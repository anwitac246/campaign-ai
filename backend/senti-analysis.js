const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate environment variables
const YOUTUBE_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_LLM_API_KEY;

if (!YOUTUBE_API_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing API keys! Please check your .env file');
  console.error('Required: GEMINI_API_KEY (YouTube) and GEMINI_LLM_API_KEY (Gemini AI)');
}

const analysisSchema = new mongoose.Schema({
  channelId: String,
  videoId: String,
  videoTitle: String,
  videoDescription: String,
  videoUrl: String,
  caption: String,
  thumbnailUrl: String,
  publishedAt: Date,
  fetchedAt: { type: Date, default: Date.now },
  statistics: {
    viewCount: Number,
    likeCount: Number,
    commentCount: Number
  },
  commentsAnalyzed: Number,
  analysis: {
    verdict: String,
    contentSummary: String,
    whyItWorked: [String],
    whyItFailed: [String],
    engagementAnalysis: String,
    audienceReaction: String,
    keyThemes: [String],
    improvements: [String],
    overallScore: Number
  },
  rawComments: [{
    text: String,
    author: String,
    likeCount: Number,
    sentiment: String
  }]
});

const Analysis = mongoose.model('Analysis', analysisSchema);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-analysis')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

async function getLatestVideo(channelId) {
  try {
    console.log('Fetching channel info for:', channelId);
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        key: YOUTUBE_API_KEY,
        id: channelId,
        part: 'contentDetails'
      }
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      throw new Error('Channel not found. Please check the channel ID.');
    }

    const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;
    console.log('Uploads playlist ID:', uploadsPlaylistId);

    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        key: YOUTUBE_API_KEY,
        playlistId: uploadsPlaylistId,
        part: 'snippet',
        maxResults: 1
      }
    });

    if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
      throw new Error('No videos found in this channel.');
    }

    const videoId = playlistRes.data.items[0].snippet.resourceId.videoId;
    console.log('Latest video ID:', videoId);

    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        key: YOUTUBE_API_KEY,
        id: videoId,
        part: 'snippet,statistics'
      }
    });

    const video = videoRes.data.items[0];
    
    return {
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      caption: video.snippet.description.split('\n')[0] || video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
      publishedAt: video.snippet.publishedAt,
      statistics: {
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0)
      }
    };
  } catch (error) {
    if (error.response) {
      console.error('YouTube API Error:', error.response.data);
      throw new Error(`YouTube API Error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    throw error;
  }
}

async function fetchComments(videoId, maxComments = 200) {
  const comments = [];
  let pageToken = null;

  try {
    console.log('Fetching comments for video:', videoId);
    
    do {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          key: YOUTUBE_API_KEY,
          videoId: videoId,
          part: 'snippet',
          maxResults: 100,
          order: 'relevance',
          pageToken: pageToken
        }
      });

      if (response.data.items) {
        response.data.items.forEach(item => {
          const comment = item.snippet.topLevelComment.snippet;
          comments.push({
            text: comment.textDisplay.replace(/<[^>]*>/g, ''),
            author: comment.authorDisplayName,
            likeCount: comment.likeCount,
            publishedAt: comment.publishedAt
          });
        });
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken && comments.length < maxComments);

    console.log(`Fetched ${comments.length} comments`);
    return comments;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Comments are disabled for this video or API quota exceeded');
    }
    console.error('Comment fetch error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }
}

async function analyzeWithGemini(videoData, comments) {
  const commentsText = comments.slice(0, 100).map((c, i) => `${i + 1}. ${c.text}`).join('\n');
  
  const prompt = `You are analyzing a YouTube video to determine if it succeeded or failed, and why.

VIDEO INFORMATION:
Title: ${videoData.title}
Caption/Description: ${videoData.caption}
Views: ${videoData.statistics.viewCount}
Likes: ${videoData.statistics.likeCount}
Comments: ${videoData.statistics.commentCount}
Published: ${videoData.publishedAt}

TOP COMMENTS FROM VIEWERS:
${commentsText}

Analyze this video and provide a comprehensive assessment. Return ONLY valid JSON with this exact structure:
{
  "verdict": "SUCCESS",
  "contentSummary": "Brief summary of what the video content was about",
  "whyItWorked": ["reason 1", "reason 2", "reason 3"],
  "whyItFailed": ["reason 1", "reason 2"],
  "engagementAnalysis": "Detailed analysis of engagement metrics",
  "audienceReaction": "Summary of audience reaction from comments",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallScore": 75
}

IMPORTANT: 
- verdict must be exactly one of: "SUCCESS", "FAILURE", or "MIXED"
- overallScore must be a number between 0-100
- Provide at least 3 items in whyItWorked or whyItFailed arrays
- Be specific and actionable based on the actual data provided`;

  try {
    console.log('Sending request to Gemini API...');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    console.log('Gemini API response status:', response.status);
    console.log('Response data structure:', JSON.stringify(response.data, null, 2));

    // Check if response exists
    if (!response.data) {
      throw new Error('No data in Gemini API response');
    }

    // Check for candidates
    if (!response.data.candidates || response.data.candidates.length === 0) {
      console.error('No candidates in response:', response.data);
      throw new Error('Gemini API returned no candidates. The content may have been filtered.');
    }

    const candidate = response.data.candidates[0];
    
    // Check for content
    if (!candidate.content) {
      console.error('No content in candidate:', candidate);
      throw new Error('No content in Gemini response');
    }

    // Check for parts
    if (!candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('No parts in content:', candidate.content);
      throw new Error('No parts in Gemini response');
    }

    const resultText = candidate.content.parts[0].text;
    console.log('Gemini response text received, length:', resultText.length);
    
    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in response. Full text:', resultText);
      throw new Error('Could not parse JSON from Gemini response');
    }
    
    console.log('JSON extracted, parsing...');
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.verdict || parsed.overallScore === undefined) {
      console.error('Missing required fields. Parsed object:', parsed);
      throw new Error('Missing required fields in analysis');
    }
    
    console.log('✅ Analysis parsed successfully');
    return parsed;
  } catch (error) {
    if (error.response) {
      console.error('Gemini API Error Response:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`Gemini API Error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    if (error.message.includes('JSON')) {
      console.error('JSON parsing error:', error.message);
    }
    console.error('Analysis error:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { channelId } = req.body;

    console.log('\n=== New Analysis Request ===');
    console.log('Request body:', req.body);
    console.log('Channel ID:', channelId);

    if (!channelId) {
      console.log('❌ No channel ID provided');
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    if (!YOUTUBE_API_KEY || !GEMINI_API_KEY) {
      console.log('❌ API keys missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API keys' });
    }

    console.log('\n=== Starting Analysis ===');
    console.log('Channel ID:', channelId);
    console.log('Step 1: Fetching latest video...');

    const video = await getLatestVideo(channelId);
    console.log('✅ Video fetched:', video.title);
    
    console.log('Step 2: Fetching comments...');
    const comments = await fetchComments(video.videoId);
    console.log('✅ Comments fetched:', comments.length);

    if (comments.length === 0) {
      console.log('❌ No comments found');
      return res.status(404).json({ 
        error: 'No comments found on this video. Comments may be disabled.' 
      });
    }

    console.log('Step 3: Analyzing with Gemini...');
    const analysis = await analyzeWithGemini(video, comments);
    console.log('✅ Analysis complete');

    console.log('Step 4: Saving to database...');
    const analysisDoc = new Analysis({
      channelId,
      videoId: video.videoId,
      videoTitle: video.title,
      videoDescription: video.description,
      videoUrl: `https://youtube.com/watch?v=${video.videoId}`,
      caption: video.caption,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: new Date(video.publishedAt),
      statistics: video.statistics,
      commentsAnalyzed: comments.length,
      analysis,
      rawComments: comments.slice(0, 50).map(c => ({
        text: c.text,
        author: c.author,
        likeCount: c.likeCount,
        sentiment: 'neutral'
      }))
    });

    await analysisDoc.save();
    console.log('✅ Analysis saved to database');
    console.log('=== Analysis Complete ===\n');

    res.json({
      success: true,
      analysisId: analysisDoc._id,
      video: {
        id: video.videoId,
        title: video.title,
        url: `https://youtube.com/watch?v=${video.videoId}`,
        thumbnail: video.thumbnailUrl,
        publishedAt: video.publishedAt,
        statistics: video.statistics
      },
      analysis
    });

  } catch (error) {
    console.error('\n❌ Analysis error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Analysis failed. Please try again.' 
    });
  }
});

app.get('/api/analyses', async (req, res) => {
  try {
    const analyses = await Analysis.find()
      .select('-rawComments')
      .sort({ fetchedAt: -1 })
      .limit(20);
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasYouTubeKey: !!YOUTUBE_API_KEY,
    hasGeminiKey: !!GEMINI_API_KEY,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 GEMINI_API_KEY (YouTube): ${YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔑 GEMINI_LLM_API_KEY (Gemini AI): ${GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`📦 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}\n`);
});