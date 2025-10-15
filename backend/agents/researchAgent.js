const axios = require('axios');

const INSTAGRAM_API_BASE = 'https://graph.instagram.com';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function callGemini(prompt) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error calling Gemini:', error.message);
    throw error;
  }
}

async function fetchInstagramInfluencer(username) {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN) {
      console.warn('Instagram access token not configured');
      return null;
    }

    const response = await axios.get(`${INSTAGRAM_API_BASE}/me`, {
      params: {
        fields: 'business_discovery.username(' + username + '){followers_count,media_count,biography,profile_picture_url}',
        access_token: INSTAGRAM_ACCESS_TOKEN
      }
    });

    return response.data.business_discovery;
  } catch (error) {
    console.error(`Error fetching Instagram data for ${username}:`, error.message);
    return null;
  }
}

async function fetchTrendingHashtags(location) {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN) {
      console.warn('Instagram access token not configured');
      return [];
    }

    const response = await axios.get(`${INSTAGRAM_API_BASE}/me/media`, {
      params: {
        fields: 'caption,like_count,comments_count,timestamp',
        access_token: INSTAGRAM_ACCESS_TOKEN,
        limit: 50
      }
    });

    const hashtags = new Map();
    response.data.data.forEach(post => {
      if (post.caption) {
        const found = post.caption.match(/#\w+/g) || [];
        found.forEach(tag => {
          const count = hashtags.get(tag) || 0;
          hashtags.set(tag, count + 1);
        });
      }
    });

    return Array.from(hashtags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

  } catch (error) {
    console.error('Error fetching trending hashtags:', error.message);
    return [];
  }
}

async function discoverLocalInfluencers(location, niche) {
  try {
    const prompt = `You are an Instagram influencer research expert. Given a location and niche, suggest 10 real Instagram influencer usernames who:
- Are active in ${location}
- Focus on ${niche}
- Have 5K-500K followers (micro to mid-tier influencers)
- Post regularly about local content

Return ONLY a JSON array of usernames, nothing else:
["username1", "username2", ...]`;

    const geminiResponse = await callGemini(prompt);
    
    let suggestedUsernames = [];
    try {
      suggestedUsernames = JSON.parse(geminiResponse.trim());
    } catch (e) {
      const matches = geminiResponse.match(/@?\w+/g) || [];
      suggestedUsernames = matches.slice(0, 10);
    }

    const influencers = [];
    for (const username of suggestedUsernames.slice(0, 5)) {
      const data = await fetchInstagramInfluencer(username.replace('@', ''));
      if (data) {
        influencers.push({
          name: username,
          username: `@${username}`,
          followers: data.followers_count || 0,
          posts: data.media_count || 0,
          bio: data.biography || '',
          profilePic: data.profile_picture_url || '',
          reason: `Active ${niche} influencer in ${location} with engaged audience`
        });
      }
    }

    return influencers;

  } catch (error) {
    console.error('Error discovering influencers:', error.message);
    return [];
  }
}

function prepareContext(context = []) {
  if (!context || context.length === 0) {
    return '';
  }

  return context
    .slice(-5)
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

function buildPrompt(brief, contextStr, influencers, hashtags) {
  return `You are a market research and influencer outreach specialist. Your task is to analyze the campaign brief and generate a comprehensive market research report.

${contextStr ? `Previous Context:\n${contextStr}\n\n` : ''}

Campaign Brief:
${brief}

Discovered Influencers (from Instagram API):
${JSON.stringify(influencers, null, 2)}

Trending Hashtags (from Instagram data):
${JSON.stringify(hashtags, null, 2)}

Your task:
1. Analyze the provided influencers and rank them by relevance to the campaign
2. Suggest additional trending hashtags that align with the brief
3. Draft personalized outreach messages for each top influencer

Return your response in this EXACT JSON format:
{
  "localInfluencers": [
    {
      "name": "Influencer Name",
      "username": "@username",
      "followers": 50000,
      "engagementRate": "3.5%",
      "reason": "Why they're a good fit for this campaign",
      "relevanceScore": 9
    }
  ],
  "trendingHashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "outreachMessages": [
    {
      "influencer": "@username",
      "subject": "Partnership Opportunity",
      "message": "Personalized outreach message here"
    }
  ],
  "insights": "Key market insights and recommendations"
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;
}

function parseResponse(response) {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    if (!parsed.localInfluencers || !Array.isArray(parsed.localInfluencers)) {
      parsed.localInfluencers = [];
    }
    if (!parsed.trendingHashtags || !Array.isArray(parsed.trendingHashtags)) {
      parsed.trendingHashtags = [];
    }
    if (!parsed.outreachMessages || !Array.isArray(parsed.outreachMessages)) {
      parsed.outreachMessages = [];
    }

    return parsed;

  } catch (error) {
    console.error('Error parsing market research response:', error.message);
    
    return {
      localInfluencers: [],
      trendingHashtags: [],
      outreachMessages: [],
      insights: response,
      parseError: true
    };
  }
}

async function handle(brief, context = []) {
  try {
    console.log('\nMARKET RESEARCH AGENT STARTED');
    console.log(`Brief: ${brief.substring(0, 100)}...`);

    const location = brief.match(/\b(Mumbai|Delhi|Bangalore|Chennai|Hyderabad|Pune|Kolkata)\b/i)?.[0] || 'India';
    const niche = brief.match(/\b(fashion|food|travel|tech|fitness|beauty|lifestyle)\b/i)?.[0] || 'lifestyle';

    console.log(`Location: ${location} | Niche: ${niche}`);

    console.log('Fetching Instagram influencer data...');
    const influencers = await discoverLocalInfluencers(location, niche);
    
    console.log('Fetching trending hashtags...');
    const hashtags = await fetchTrendingHashtags(location);

    const contextStr = prepareContext(context);
    const prompt = buildPrompt(brief, contextStr, influencers, hashtags);

    console.log('Calling Gemini for analysis...');
    const geminiResponse = await callGemini(prompt);

    const research = parseResponse(geminiResponse);

    console.log('MARKET RESEARCH COMPLETED');
    console.log(`   - ${research.localInfluencers.length} influencers identified`);
    console.log(`   - ${research.trendingHashtags.length} hashtags suggested`);
    console.log(`   - ${research.outreachMessages.length} outreach messages drafted\n`);

    return {
      success: true,
      research,
      metadata: {
        agent: 'market_research',
        timestamp: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        instagramDataFetched: influencers.length > 0,
        location,
        niche
      }
    };

  } catch (error) {
    console.error('MARKET RESEARCH AGENT ERROR:', error.message);
    
    return {
      success: false,
      error: error.message,
      research: {
        localInfluencers: [],
        trendingHashtags: [],
        outreachMessages: [],
        insights: `Error during market research: ${error.message}`
      },
      metadata: {
        agent: 'market_research',
        timestamp: new Date().toISOString(),
        error: true
      }
    };
  }
}

module.exports = {
  handle,
  fetchInstagramInfluencer,
  fetchTrendingHashtags,
  discoverLocalInfluencers
};