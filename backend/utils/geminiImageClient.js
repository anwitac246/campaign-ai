const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGeminiForImage(prompt) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('[Gemini Image Client] Generating image with prompt:', prompt.substring(0, 100) + '...');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Use gemini-2.5-flash-image model for image generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image'
    });

    // Generate content with the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Look for inline_data (image) in the response parts
    let imageData = null;
    let textResponse = '';

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      
      for (const part of parts) {
        // Check for text
        if (part.text) {
          textResponse += part.text;
        }
        
        // Check for inline image data
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;
          console.log('[Gemini Image Client] Found inline image data');
        }
      }
    }

    if (!imageData) {
      console.log('[Gemini Image Client] No image data in response, creating fallback');
      return await createFallbackImage(prompt);
    }

    // Decode base64 image data
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Create generated_images directory if it doesn't exist
    const generatedImagesDir = path.join(process.cwd(), 'generated_images');
    try {
      await fs.access(generatedImagesDir);
    } catch {
      await fs.mkdir(generatedImagesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `campaign_${timestamp}_${randomStr}.png`;
    const imagePath = path.join(generatedImagesDir, filename);

    // Save the image
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log('[Gemini Image Client] Image saved successfully:', filename);

    return {
      success: true,
      imagePath: `generated_images/${filename}`,
      filename: filename,
      mimeType: 'image/png',
      size: imageBuffer.length,
      description: textResponse || 'Generated campaign image'
    };

  } catch (error) {
    console.error('[Gemini Image Client] Error generating image:', error.message);
    console.error('[Gemini Image Client] Full error:', error);
    
    // If Gemini image generation fails, create a fallback placeholder
    return await createFallbackImage(prompt);
  }
}

async function regenerateImageWithFeedback(currentImagePath, feedbackPrompt) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('[Gemini Image Client] Regenerating image with feedback...');

    // Read the current image
    const fullImagePath = path.join(process.cwd(), currentImagePath);
    const imageBuffer = await fs.readFile(fullImagePath);
    const base64Image = imageBuffer.toString('base64');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image'
    });

    // Create the prompt with the current image and feedback
    const enhancedPrompt = `Based on the provided image, please create an improved version with these changes: ${feedbackPrompt}

Keep the overall style and theme similar, but incorporate the requested modifications. Maintain high quality and professional design.`;

    // Generate new content with both the prompt and the existing image
    const result = await model.generateContent([
      enhancedPrompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      }
    ]);

    const response = result.response;

    // Look for the new image data
    let newImageData = null;
    let textResponse = '';

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      
      for (const part of parts) {
        if (part.text) {
          textResponse += part.text;
        }
        
        if (part.inlineData && part.inlineData.data) {
          newImageData = part.inlineData.data;
          console.log('[Gemini Image Client] Found regenerated image data');
        }
      }
    }

    if (!newImageData) {
      console.log('[Gemini Image Client] No image data in regeneration response, using fallback');
      return await createFallbackImage(feedbackPrompt);
    }

    // Decode and save the new image
    const newImageBuffer = Buffer.from(newImageData, 'base64');
    
    const generatedImagesDir = path.join(process.cwd(), 'generated_images');
    try {
      await fs.access(generatedImagesDir);
    } catch {
      await fs.mkdir(generatedImagesDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `campaign_revised_${timestamp}_${randomStr}.png`;
    const newImagePath = path.join(generatedImagesDir, filename);

    await fs.writeFile(newImagePath, newImageBuffer);
    
    console.log('[Gemini Image Client] Regenerated image saved:', filename);

    return {
      success: true,
      imagePath: `generated_images/${filename}`,
      filename: filename,
      mimeType: 'image/png',
      size: newImageBuffer.length,
      description: textResponse || 'Regenerated campaign image with feedback'
    };

  } catch (error) {
    console.error('[Gemini Image Client] Error regenerating image:', error.message);
    console.error('[Gemini Image Client] Full error:', error);
    
    return await createFallbackImage(feedbackPrompt);
  }
}

async function createFallbackImage(prompt) {
  try {
    console.log('[Gemini Image Client] Creating fallback image...');
    
    // Create a simple SVG placeholder with campaign theme
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(139,92,246);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#grad1)"/>
        <text x="512" y="450" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold">
          Campaign Visual
        </text>
        <text x="512" y="520" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)" text-anchor="middle">
          ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}
        </text>
        <text x="512" y="600" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle">
          Generated by Relatus.AI
        </text>
      </svg>
    `;

    // Create generated_images directory if it doesn't exist
    const generatedImagesDir = path.join(process.cwd(), 'generated_images');
    try {
      await fs.access(generatedImagesDir);
    } catch {
      await fs.mkdir(generatedImagesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `campaign_fallback_${timestamp}_${randomStr}.svg`;
    const imagePath = path.join(generatedImagesDir, filename);

    // Save the SVG
    await fs.writeFile(imagePath, svg);
    
    console.log('[Gemini Image Client] Fallback image created:', filename);

    return {
      success: true,
      imagePath: `generated_images/${filename}`,
      filename: filename,
      mimeType: 'image/svg+xml',
      size: Buffer.byteLength(svg),
      isFallback: true
    };

  } catch (error) {
    console.error('[Gemini Image Client] Error creating fallback image:', error.message);
    throw error;
  }
}

module.exports = { callGeminiForImage, regenerateImageWithFeedback };