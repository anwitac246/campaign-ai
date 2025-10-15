const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_LLM_API_KEY);

async function callGemini(prompt, options = {}) {
  try {
    if (!process.env.GEMINI_LLM_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. ' +
        'Please add it to your .env file.'
      );
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt must be a non-empty string');
    }

    const {
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      maxTokens = 8192
    } = options;

    console.log(`[Gemini Client] Calling ${model}...`);

    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    });

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Gemini returned an empty response');
    }

    console.log(`[Gemini Client] Response received (${text.length} characters)`);

    return text;

  } catch (error) {
    console.error('[Gemini Client] Error:', error.message);

    if (error.message.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key');
    }

    if (error.message.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits.');
    }

    if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`Gemini API call failed: ${error.message}`);
  }
}

async function callGeminiStream(prompt, onChunk, options = {}) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const {
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      maxTokens = 8192
    } = options;

    console.log(`[Gemini Client] Calling ${model} (streaming)...`);

    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    });

    const result = await geminiModel.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      
      if (onChunk && typeof onChunk === 'function') {
        onChunk(chunkText);
      }
    }

    console.log(`[Gemini Client] Streaming complete (${fullText.length} characters)`);

    return fullText;

  } catch (error) {
    console.error('[Gemini Client] Streaming error:', error.message);
    throw new Error(`Gemini API streaming failed: ${error.message}`);
  }
}

module.exports = {
  callGemini,
  callGeminiStream
};