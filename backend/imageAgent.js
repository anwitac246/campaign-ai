const { callGeminiForImage, regenerateImageWithFeedback: regenerateImage } = require('./utils/geminiImageClient');
const { callGemini } = require('./utils/geminiClient');
const fs = require('fs').promises;
const path = require('path');

async function handle(strategy, content, options = {}) {
  try {
    if (!strategy || typeof strategy !== 'object') {
      throw new Error('Invalid input: strategy must be a valid object');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Invalid input: content must be a non-empty string');
    }

    const { hashtags = [], memes = [], generateImage = true, userFeedback = null } = options;

    const conceptPrompt = buildImageConceptPrompt(strategy, content, hashtags, memes, userFeedback);

    console.log('[Image Agent] Generating visual concept...');
    const conceptResponse = await callGemini(conceptPrompt);
    
    const visualConcept = parseImageConceptResponse(conceptResponse);

    let generatedImage = null;
    if (generateImage) {
      console.log('[Image Agent] Generating image with Gemini...');
      const imagePrompt = buildImageGenerationPrompt(strategy, content, visualConcept);
      generatedImage = await callGeminiForImage(imagePrompt);
    }

    console.log('[Image Agent] Visual concept and image generated successfully');

    return {
      success: true,
      visualConcept,
      image: generatedImage,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: 'imageAgent',
        model: 'gemini-2.5-flash-image',
        strategyApplied: true
      }
    };

  } catch (error) {
    console.error('[Image Agent] Error:', error.message);
    
    throw {
      success: false,
      error: error.message,
      agent: 'imageAgent',
      timestamp: new Date().toISOString()
    };
  }
}

async function regenerateImageWithFeedback(strategy, content, currentImagePath, userFeedback) {
  try {
    console.log('[Image Agent] Regenerating image with user feedback...');
    
    if (!currentImagePath) {
      throw new Error('Current image path is required for regeneration');
    }

    if (!userFeedback || userFeedback.trim() === '') {
      throw new Error('User feedback is required for image regeneration');
    }

    // Build enhanced prompt with feedback
    const feedbackPrompt = `User requested changes: ${userFeedback}

Strategy context:
- Core Message: ${strategy.coreMessage || 'N/A'}
- Tone: ${strategy.tone || 'professional'}
- Target Audience: ${strategy.targetAudience?.primary || 'general audience'}

Content: ${content}

Please create an improved version of the image incorporating these changes while maintaining the overall campaign theme and professional quality.`;
    
    // Use the regeneration function from geminiImageClient
    const regeneratedImage = await regenerateImage(currentImagePath, feedbackPrompt);

    // Generate updated concept
    const conceptPrompt = buildImageConceptPrompt(strategy, content, [], [], userFeedback);
    const conceptResponse = await callGemini(conceptPrompt);
    const visualConcept = parseImageConceptResponse(conceptResponse);

    console.log('[Image Agent] Image regenerated successfully with feedback');

    return {
      success: true,
      visualConcept,
      image: regeneratedImage,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: 'imageAgent',
        model: 'gemini-2.5-flash-image',
        regenerated: true,
        userFeedbackApplied: true
      }
    };

  } catch (error) {
    console.error('[Image Agent] Error regenerating image:', error.message);
    
    throw {
      success: false,
      error: error.message,
      agent: 'imageAgent',
      timestamp: new Date().toISOString()
    };
  }
}

function buildImageConceptPrompt(strategy, content, hashtags = [], memes = [], userFeedback = null) {
  let prompt = `You are an expert Visual Marketing AI. Your task is to generate a concept for an image, poster, or social media visual based on a marketing strategy and accompanying content.

STRATEGY:
${JSON.stringify(strategy, null, 2)}

CONTENT:
"${content}"

TRENDING HASHTAGS:
${hashtags.length > 0 ? hashtags.join(', ') : 'None'}

TRENDING MEMES:
${memes.length > 0 ? memes.join(', ') : 'None'}`;

  if (userFeedback) {
    prompt += `

USER FEEDBACK FOR IMPROVEMENT:
${userFeedback}

Please incorporate this feedback into your concept design.`;
  }

  prompt += `

TASK:
1. Generate a detailed visual concept for an image or poster that aligns with the marketing strategy.
2. Include the following details in your response:
   - Visual theme / mood: colors, style, aesthetics
   - Composition / layout: placement of text, images, logos, or memes
   - Text to include: slogans, captions, hashtags (if applicable)
   - Target platform: Instagram, Twitter, LinkedIn, etc.
   - Any meme references: if relevant, describe how the meme should be integrated
3. Ensure the visual concept reflects:
   - The core message, tone, and audience from the strategy
   - Trending hashtags and memes in a natural and contextually relevant way
4. Suggest optional variations for creative exploration

OUTPUT FORMAT (JSON ONLY):
{
  "visualType": "poster | socialMediaGraphic | banner | carousel",
  "theme": "Description of the visual theme and mood",
  "layout": "Description of the layout and composition",
  "textElements": ["List of text elements to include"],
  "hashtags": ["List of hashtags to integrate"],
  "memeReferences": ["List of memes to include and their placement"],
  "platform": "Recommended social media platform",
  "optionalVariations": ["Description of 1-2 alternative creative ideas"]
}

IMPORTANT:
- Return ONLY the JSON object, no extra text, markdown, or emojis.
- Make sure the hashtags and memes fit naturally in the visual concept.
- The concept should be actionable for a designer or a text-to-image AI.
- Core message from strategy: "${strategy.coreMessage || 'Not specified'}"
- Tone: ${strategy.tone || 'professional'}`;

  return prompt;
}

function buildImageGenerationPrompt(strategy, content, visualConcept) {
  const targetAudience = strategy.targetAudience?.primary || 'general audience';
  const tone = strategy.tone || 'professional';
  const coreMessage = strategy.coreMessage || content;

  let imagePrompt = `Create a ${visualConcept.visualType || 'social media graphic'} for a ${tone} marketing campaign. `;
  imagePrompt += `Target audience: ${targetAudience}. `;
  imagePrompt += `Core message: "${coreMessage}". `;
  
  if (visualConcept.theme) {
    imagePrompt += `Visual style: ${visualConcept.theme}. `;
  }
  
  if (visualConcept.layout) {
    imagePrompt += `Layout: ${visualConcept.layout}. `;
  }
  
  if (visualConcept.textElements && visualConcept.textElements.length > 0) {
    imagePrompt += `Include text: ${visualConcept.textElements.join(', ')}. `;
  }
  
  if (visualConcept.platform) {
    imagePrompt += `Optimized for ${visualConcept.platform}. `;
  }

  imagePrompt += 'High quality, professional, modern design.';

  return imagePrompt;
}

function parseImageConceptResponse(geminiResponse) {
  try {
    let cleanedResponse = geminiResponse.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const concept = JSON.parse(cleanedResponse);

    const requiredFields = ['visualType', 'theme', 'layout'];
    for (const field of requiredFields) {
      if (!concept[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!concept.textElements) {
      concept.textElements = [];
    }
    
    if (!concept.hashtags) {
      concept.hashtags = [];
    }
    
    if (!concept.memeReferences) {
      concept.memeReferences = [];
    }
    
    if (!concept.optionalVariations) {
      concept.optionalVariations = [];
    }

    return concept;

  } catch (error) {
    console.error('[Image Agent] Failed to parse concept response:', error.message);
    
    return {
      visualType: 'socialMediaGraphic',
      theme: 'Modern and professional',
      layout: 'Centered composition',
      textElements: [],
      hashtags: [],
      memeReferences: [],
      platform: 'Instagram',
      optionalVariations: [],
      rawResponse: geminiResponse,
      parsingError: error.message
    };
  }
}

module.exports = { handle, regenerateImageWithFeedback };