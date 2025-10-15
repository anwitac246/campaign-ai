const { callGemini } = require('./utils/geminiClient');

async function handle(brief, context = []) {
  try {
    if (!brief || typeof brief !== 'string' || brief.trim().length === 0) {
      throw new Error('Invalid input: brief must be a non-empty string');
    }

    const contextString = prepareContext(context);
    const prompt = buildStrategyPrompt(brief, contextString);

    console.log('[Strategy Agent] Calling Gemini API for strategy generation...');
    const geminiResponse = await callGemini(prompt);

    const strategy = parseStrategyResponse(geminiResponse);

    console.log('[Strategy Agent] Strategy generated successfully');

    return {
      success: true,
      strategy,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: 'strategyAgent',
        model: 'gemini-2.5-flash'
      }
    };

  } catch (error) {
    console.error('[Strategy Agent] Error:', error.message);
    
    throw {
      success: false,
      error: error.message,
      agent: 'strategyAgent',
      timestamp: new Date().toISOString()
    };
  }
}

function prepareContext(context) {
  if (!context || (Array.isArray(context) && context.length === 0)) {
    return 'No previous context available.';
  }

  if (Array.isArray(context)) {
    return context
      .map((item, index) => `[${index + 1}] ${JSON.stringify(item)}`)
      .join('\n');
  }

  return JSON.stringify(context, null, 2);
}

function buildStrategyPrompt(brief, contextString) {
  return `You are an expert Marketing Strategist AI. Your role is to analyze marketing briefs and create comprehensive, actionable campaign strategies.

CONTEXT FROM PREVIOUS INTERACTIONS:
${contextString}

MARKETING BRIEF:
${brief}

TASK:
Analyze the brief and create a detailed campaign strategy. Think deeply about:
1. The target audience's needs, pain points, and motivations
2. The product/service's unique value proposition
3. The competitive landscape and market positioning
4. The optimal timing and occasion for the campaign
5. The most effective channels to reach the audience

OUTPUT REQUIREMENTS:
Provide a structured campaign strategy in the following JSON format:

{
  "coreMessage": "A clear, compelling one-sentence message that captures the essence of the campaign",
  "tone": "The communication tone (e.g., professional, friendly, urgent, inspirational, humorous)",
  "targetAudience": {
    "primary": "Detailed description of the primary target audience",
    "demographics": "Age, location, income, occupation, etc.",
    "psychographics": "Values, interests, behaviors, pain points"
  },
  "targetChannels": [
    "List of recommended marketing channels (e.g., social media, email, TV, outdoor, influencers)"
  ],
  "strategicPlan": {
    "phase1": "Initial phase activities and objectives",
    "phase2": "Mid-campaign activities and objectives",
    "phase3": "Final phase and optimization activities"
  },
  "keyMessagingPillars": [
    "3-5 core themes or messages that should be consistent across all materials"
  ],
  "successMetrics": [
    "KPIs and metrics to measure campaign success"
  ],
  "budgetConsiderations": "High-level budget allocation recommendations",
  "timeline": "Recommended campaign duration and key milestones"
}

Be strategic, creative, and data-informed. Ensure the strategy is actionable and can guide downstream agents (copywriting, visual design, media planning).

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting. Do not use any emojis in your response.`;
}

function parseStrategyResponse(geminiResponse) {
  try {
    let cleanedResponse = geminiResponse.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const strategy = JSON.parse(cleanedResponse);

    const requiredFields = ['coreMessage', 'tone', 'targetChannels'];
    for (const field of requiredFields) {
      if (!strategy[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return strategy;

  } catch (error) {
    console.error('[Strategy Agent] Failed to parse Gemini response:', error.message);
    
    return {
      coreMessage: 'Strategy generation in progress',
      tone: 'professional',
      targetChannels: ['digital'],
      rawResponse: geminiResponse,
      parsingError: error.message
    };
  }
}

module.exports = { handle };