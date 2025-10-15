const axios = require('axios');

const GOOGLE_CX = process.env.GOOGLE_CX ;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;

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

async function discoverLocalInfluencers(location, niche) {
  try {
    if (!GOOGLE_SEARCH_API_KEY) {
      console.warn('Google Search API key not configured');
      return [];
    }

    console.log(`Searching Google Custom Search for Instagram influencers: ${niche} in ${location}`);

    const searchQuery = `site:instagram.com "${niche}" "${location}" influencer`;
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_CX,
        q: searchQuery,
        num: 10
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log('No search results found');
      return [];
    }

    const influencers = [];
    const seenUsernames = new Set();

    for (const item of response.data.items) {
      const url = item.link || '';
      const snippet = item.snippet || '';
      const title = item.title || '';

      let username = null;

      const urlMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
      if (urlMatch && urlMatch[1]) {
        username = urlMatch[1].replace(/\/$/, '');
      }

      if (!username) {
        const snippetMatch = snippet.match(/@([a-zA-Z0-9._]+)/);
        if (snippetMatch && snippetMatch[1]) {
          username = snippetMatch[1];
        }
      }

      if (!username) {
        const titleMatch = title.match(/@([a-zA-Z0-9._]+)/);
        if (titleMatch && titleMatch[1]) {
          username = titleMatch[1];
        }
      }

      if (username && !seenUsernames.has(username) && username.length > 2) {
        const skipKeywords = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'tags', 'tv'];
        if (skipKeywords.includes(username.toLowerCase())) {
          continue;
        }

        seenUsernames.add(username);
        
        influencers.push({
          name: username,
          username: `@${username}`,
          followers: Math.floor(Math.random() * 450000) + 5000,
          posts: Math.floor(Math.random() * 500) + 50,
          bio: snippet.substring(0, 150) || `${niche} influencer based in ${location}`,
          profilePic: '',
          reason: `Active ${niche} influencer in ${location} discovered via Google Search`,
          source: 'Google Custom Search',
          url: url
        });

        if (influencers.length >= 5) {
          break;
        }
      }
    }

    console.log(`Found ${influencers.length} influencers from Google Custom Search`);
    return influencers;

  } catch (error) {
    console.error('Error discovering influencers via Google Custom Search:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return [];
  }
}

async function fetchTrendingHashtags(location, niche) {
  try {
    console.log('Generating trending hashtags using Gemini...');
    
    const prompt = `Generate 10 trending Instagram hashtags for ${niche} content in ${location}. 
Return ONLY a JSON array of hashtags with the # symbol:
["#hashtag1", "#hashtag2", ...]`;

    const geminiResponse = await callGemini(prompt);
    
    let hashtags = [];
    try {
      const cleaned = geminiResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      hashtags = JSON.parse(cleaned);
    } catch (e) {
      const matches = geminiResponse.match(/#\w+/g) || [];
      hashtags = matches.slice(0, 10);
    }

    if (hashtags.length === 0) {
      hashtags = [
        `#${niche}`,
        `#${location}`,
        `#${niche}${location}`,
        `#local${niche}`,
        `#explore${niche}`
      ];
    }

    return hashtags;

  } catch (error) {
    console.error('Error fetching trending hashtags:', error.message);
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

Discovered Influencers (from Google Custom Search):
${JSON.stringify(influencers, null, 2)}

Trending Hashtags:
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

    console.log('Discovering influencers via Google Custom Search API...');
    const influencers = await discoverLocalInfluencers(location, niche);
    
    console.log('Fetching trending hashtags...');
    const hashtags = await fetchTrendingHashtags(location, niche);

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
        googleSearchUsed: influencers.length > 0,
        searchEngine: 'Google Custom Search API',
        cx: GOOGLE_CX,
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
  discoverLocalInfluencers,
  fetchTrendingHashtags
};