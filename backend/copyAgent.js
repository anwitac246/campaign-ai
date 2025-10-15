const { callGemini } = require('./utils/geminiClient');

async function handle(strategy, options = {}) {
  try {
    if (!strategy || typeof strategy !== 'object') {
      throw new Error('Invalid input: strategy must be a valid object');
    }

    const { hashtags = [], memes = [], contentType = 'socialMediaCaption' } = options;

    const prompt = buildCopywritingPrompt(strategy, hashtags, memes, contentType);

    console.log('[Copywriting Agent] Calling Gemini API for content generation...');
    const geminiResponse = await callGemini(prompt);

    const content = parseCopywritingResponse(geminiResponse);

    console.log('[Copywriting Agent] Content generated successfully');

    return {
      success: true,
      content,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: 'copywritingAgent',
        model: 'gemini-2.5-flash',
        strategyApplied: true
      }
    };

  } catch (error) {
    console.error('[Copywriting Agent] Error:', error.message);
    
    throw {
      success: false,
      error: error.message,
      agent: 'copywritingAgent',
      timestamp: new Date().toISOString()
    };
  }
}

function buildCopywritingPrompt(strategy, hashtags = [], memes = [], contentType = 'socialMediaCaption') {
  return `You are an expert Marketing Copywriting AI. Your task is to create marketing content (social media captions, ad copies, or blog posts) that strictly follows the provided campaign strategy.

STRATEGY:
${JSON.stringify(strategy, null, 2)}

TRENDING HASHTAGS:
${hashtags.length > 0 ? hashtags.join(', ') : 'None'}

TRENDING MEMES:
${memes.length > 0 ? memes.join(', ') : 'None'}

REQUESTED CONTENT TYPE:
${contentType}

TASK:
1. Generate a piece of marketing content that strictly follows the above strategy:
   - Target audience, tone, core message, and brand guidelines must be respected.
   - Content must integrate hashtags naturally.
   - Content may reference memes creatively where appropriate.
2. Ensure the content is engaging, clear, and suitable for the specified audience.
3. Do not deviate from the strategy.
4. Maintain the tone and style defined in the strategy.

CONTENT TYPE GUIDELINES:
- socialMediaCaption: Short, engaging, 150-280 characters, optimized for platforms like Instagram, Twitter, LinkedIn
- adCopy: Persuasive, benefit-focused, includes clear call-to-action, 50-150 words
- blogPost: Long-form content with intro, body, conclusion, 300-500 words

OUTPUT FORMAT (JSON ONLY):
{
  "contentType": "socialMediaCaption | adCopy | blogPost",
  "content": "The generated text content",
  "hashtags": ["list", "of", "used", "hashtags"],
  "memeReferences": ["list", "of", "used", "memes"],
  "callToAction": "Optional CTA if applicable"
}

IMPORTANT:
- Return ONLY the JSON object, no extra text or markdown.
- Do not include emojis unless explicitly mentioned in the strategy.
- Make sure hashtags and memes fit naturally and are contextually relevant.
- The content must align with the core message: "${strategy.coreMessage || 'Not specified'}"
- The tone must be: ${strategy.tone || 'professional'}`;
}

function parseCopywritingResponse(geminiResponse) {
  try {
    let cleanedResponse = geminiResponse.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const content = JSON.parse(cleanedResponse);

    const requiredFields = ['contentType', 'content'];
    for (const field of requiredFields) {
      if (!content[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!content.hashtags) {
      content.hashtags = [];
    }
    
    if (!content.memeReferences) {
      content.memeReferences = [];
    }

    return content;

  } catch (error) {
    console.error('[Copywriting Agent] Failed to parse Gemini response:', error.message);
    
    return {
      contentType: 'socialMediaCaption',
      content: 'Content generation in progress',
      hashtags: [],
      memeReferences: [],
      rawResponse: geminiResponse,
      parsingError: error.message
    };
  }
}

module.exports = { handle };