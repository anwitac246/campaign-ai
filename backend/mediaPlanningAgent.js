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

function prepareContext(context = []) {
  if (!context || context.length === 0) {
    return '';
  }

  return context
    .slice(-5)
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

function buildPrompt(brief, contextStr, strategyData = null) {
  let prompt = `You are a social media strategist and media planning expert specializing in Indian markets. Your task is to create a comprehensive media plan for this campaign.

${contextStr ? `Previous Context:\n${contextStr}\n\n` : ''}

Campaign Brief:
${brief}
`;

  if (strategyData) {
    prompt += `\nCampaign Strategy Context:
Target Audience: ${strategyData.targetAudience?.primary || 'Not specified'}
Core Message: ${strategyData.coreMessage || 'Not specified'}
Target Channels: ${strategyData.targetChannels?.join(', ') || 'Not specified'}
`;
  }

  prompt += `
Your task:
1. Create an optimal posting schedule considering:
   - Indian timezone (IST)
   - Peak engagement times for the target audience
   - Platform-specific best practices
   - Campaign objectives

2. Recommend content types that will perform best (Reels, Stories, Carousels, Posts, Videos)

3. Suggest collaboration opportunities with:
   - Other brands
   - Local influencers
   - Content creators
   - Community organizations

4. Design a multi-channel strategy specifying:
   - Primary and secondary channels
   - Channel-specific focus areas
   - Cross-promotion tactics

Return your response in this EXACT JSON format:
{
  "postingSchedule": [
    {
      "day": "Monday",
      "time": "7:00 PM IST",
      "platform": "Instagram",
      "contentType": "Reel",
      "reason": "Peak engagement time for working professionals"
    }
  ],
  "recommendedContentTypes": [
    {
      "type": "Reels",
      "frequency": "3x per week",
      "priority": "High",
      "rationale": "Why this content type is recommended"
    }
  ],
  "collaborationIdeas": [
    {
      "type": "Brand Partnership",
      "suggestion": "Partner with a complementary brand",
      "expectedImpact": "Reach new audience segment",
      "implementation": "Co-create content series"
    }
  ],
  "channelStrategy": [
    {
      "channel": "Instagram",
      "role": "Primary",
      "focus": "Visual storytelling and community building",
      "contentMix": "60% Reels, 30% Stories, 10% Posts",
      "kpis": ["Engagement Rate", "Follower Growth", "Story Views"]
    }
  ],
  "contentCalendar": {
    "themes": ["Weekly content themes"],
    "campaigns": ["Mini campaign ideas"],
    "events": ["Relevant events/holidays to leverage"]
  },
  "budgetAllocation": {
    "organic": "70%",
    "paid": "30%",
    "recommendations": "How to allocate paid budget across channels"
  }
}

IMPORTANT: 
- Use Indian Standard Time (IST) for all times
- Consider Indian festivals, holidays, and cultural events
- Focus on platforms popular in India (Instagram, YouTube, WhatsApp)
- Return ONLY valid JSON, no markdown, no explanations.`;

  return prompt;
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

    if (!parsed.postingSchedule || !Array.isArray(parsed.postingSchedule)) {
      parsed.postingSchedule = [];
    }
    if (!parsed.recommendedContentTypes || !Array.isArray(parsed.recommendedContentTypes)) {
      parsed.recommendedContentTypes = [];
    }
    if (!parsed.collaborationIdeas || !Array.isArray(parsed.collaborationIdeas)) {
      parsed.collaborationIdeas = [];
    }
    if (!parsed.channelStrategy || !Array.isArray(parsed.channelStrategy)) {
      parsed.channelStrategy = [];
    }
    if (!parsed.contentCalendar) {
      parsed.contentCalendar = {
        themes: [],
        campaigns: [],
        events: []
      };
    }
    if (!parsed.budgetAllocation) {
      parsed.budgetAllocation = {
        organic: "70%",
        paid: "30%",
        recommendations: "Standard allocation for organic-first strategy"
      };
    }

    return parsed;

  } catch (error) {
    console.error('Error parsing media planning response:', error.message);
    
    return {
      postingSchedule: [],
      recommendedContentTypes: [],
      collaborationIdeas: [],
      channelStrategy: [],
      contentCalendar: {
        themes: [],
        campaigns: [],
        events: []
      },
      budgetAllocation: {
        organic: "70%",
        paid: "30%",
        recommendations: "Unable to generate recommendations"
      },
      rawResponse: response,
      parseError: true
    };
  }
}

function generateWeeklyCalendar(mediaPlan) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const calendar = daysOfWeek.map(day => ({
    day,
    posts: mediaPlan.postingSchedule
      .filter(post => post.day === day)
      .map(post => ({
        time: post.time,
        platform: post.platform,
        contentType: post.contentType,
        reason: post.reason
      }))
  }));

  return calendar;
}

async function handle(brief, options = {}) {
  const { context = [], strategyData = null } = options;

  try {
    console.log('\nMEDIA PLANNING AGENT STARTED');
    console.log(`Brief: ${brief.substring(0, 100)}...`);

    const contextStr = prepareContext(context);
    const prompt = buildPrompt(brief, contextStr, strategyData);

    console.log('Calling Gemini for media planning...');
    const geminiResponse = await callGemini(prompt);

    const mediaPlan = parseResponse(geminiResponse);

    const weeklyCalendar = generateWeeklyCalendar(mediaPlan);

    mediaPlan.weeklyCalendar = weeklyCalendar;

    const totalPosts = mediaPlan.postingSchedule.length;
    const platforms = [...new Set(mediaPlan.postingSchedule.map(p => p.platform))];
    const contentTypes = [...new Set(mediaPlan.recommendedContentTypes.map(c => c.type))];

    console.log('MEDIA PLAN COMPLETED');
    console.log(`   - ${totalPosts} posts scheduled per week`);
    console.log(`   - ${platforms.length} platforms: ${platforms.join(', ')}`);
    console.log(`   - ${contentTypes.length} content types recommended`);
    console.log(`   - ${mediaPlan.collaborationIdeas.length} collaboration opportunities\n`);

    return {
      success: true,
      mediaPlan,
      metadata: {
        agent: 'media_planning',
        timestamp: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        metrics: {
          totalPostsPerWeek: totalPosts,
          platformsCount: platforms.length,
          contentTypesCount: contentTypes.length,
          collaborationIdeas: mediaPlan.collaborationIdeas.length
        }
      }
    };

  } catch (error) {
    console.error('MEDIA PLANNING AGENT ERROR:', error.message);
    
    return {
      success: false,
      error: error.message,
      mediaPlan: {
        postingSchedule: [],
        recommendedContentTypes: [],
        collaborationIdeas: [],
        channelStrategy: [],
        contentCalendar: {
          themes: [],
          campaigns: [],
          events: []
        },
        budgetAllocation: {
          organic: "70%",
          paid: "30%",
          recommendations: "Unable to generate recommendations due to error"
        },
        errorMessage: `Error during media planning: ${error.message}`
      },
      metadata: {
        agent: 'media_planning',
        timestamp: new Date().toISOString(),
        error: true
      }
    };
  }
}

function validateMediaPlan(mediaPlan) {
  const issues = [];
  const warnings = [];

  if (!mediaPlan.postingSchedule || mediaPlan.postingSchedule.length === 0) {
    issues.push('No posting schedule defined');
  }

  if (!mediaPlan.channelStrategy || mediaPlan.channelStrategy.length === 0) {
    issues.push('No channel strategy defined');
  }

  if (!mediaPlan.recommendedContentTypes || mediaPlan.recommendedContentTypes.length === 0) {
    warnings.push('No content types recommended');
  }

  if (!mediaPlan.collaborationIdeas || mediaPlan.collaborationIdeas.length === 0) {
    warnings.push('No collaboration ideas provided');
  }

  const totalPosts = mediaPlan.postingSchedule?.length || 0;
  if (totalPosts < 3) {
    warnings.push('Posting frequency might be too low for optimal engagement');
  } else if (totalPosts > 21) {
    warnings.push('Posting frequency might be too high and lead to audience fatigue');
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 10))
  };
}

module.exports = {
  handle,
  validateMediaPlan,
  generateWeeklyCalendar
};