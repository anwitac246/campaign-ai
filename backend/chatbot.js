const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const PDFDocument = require('pdfkit');
const { google } = require('googleapis');

const ffmpeg = require('fluent-ffmpeg');
const { handle: handleStrategy } = require('./strategyAgent');
const { handle: handleCopywriting } = require('./copyAgent');
const { handle: handleImage } = require('./imageAgent');
const { handle: handleMarketResearch } = require('./marketResearchAgent');
const { handle: handleMediaPlanning } = require('./mediaPlanningAgent');
const { regenerateImageWithFeedback } = require('./imageAgent');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Helper function to ensure database connection
async function ensureDatabaseConnection() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  type: { type: String, enum: ['user', 'bot', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  agentType: { type: String },
  file: {
    name: String,
    type: String,
    size: Number
  },
  imageData: {
    path: String,
    mimeType: String
  },
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    timestamp: Date
  }],
  requiresFeedback: { type: Boolean, default: false },
  feedbackStep: { type: String },
  feedbackReceived: { type: Boolean, default: false },
  feedbackData: { type: mongoose.Schema.Types.Mixed }
});

const ShortTermMemorySchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, default: 'anonymous' },
  title: { type: String, default: 'New Chat' },
  messages: [MessageSchema],
  shortTermMemory: [ShortTermMemorySchema],
  campaignStrategy: { type: mongoose.Schema.Types.Mixed },
  campaignContent: { type: mongoose.Schema.Types.Mixed },
  visualConcept: { type: mongoose.Schema.Types.Mixed },
  marketResearch: { type: mongoose.Schema.Types.Mixed },
  mediaPlan: { type: mongoose.Schema.Types.Mixed },
  currentWorkflowStep: { type: String, default: null },
  pendingFeedbackStep: { type: String, default: null },
  isFinalized: { type: Boolean, default: false },
  finalizedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);

// Scheduled Post Schema
const ScheduledPostSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  campaignTitle: { type: String, required: true },
  scheduledAt: { type: Date, required: true, index: true },
  videoDuration: { type: Number, default: 3 },
  status: { 
    type: String, 
    enum: ['scheduled', 'posting', 'posted', 'failed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  videoUrl: { type: String },
  videoId: { type: String },
  errorMessage: { type: String },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  lastAttemptAt: { type: Date },
  postedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ScheduledPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ScheduledPost = mongoose.model('ScheduledPost', ScheduledPostSchema);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const generatedImagesDir = path.join(__dirname, 'backend', 'generated_images');

if (!fs.existsSync(generatedImagesDir)) {
  fs.mkdirSync(generatedImagesDir);
}

// Download Campaign PDF endpoint
app.post('/api/campaign/download', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=campaign-${sessionId}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('Campaign Package', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (session.campaignStrategy) {
      doc.fontSize(18).font('Helvetica-Bold').text('Campaign Strategy');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Core Message:');
      doc.fontSize(10).font('Helvetica').text(session.campaignStrategy.coreMessage || 'N/A');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Tone:');
      doc.fontSize(10).font('Helvetica').text(session.campaignStrategy.tone || 'N/A');
      doc.moveDown();
      
      if (session.campaignStrategy.targetAudience) {
        doc.fontSize(12).font('Helvetica-Bold').text('Target Audience:');
        doc.fontSize(10).font('Helvetica').text(session.campaignStrategy.targetAudience.primary || 'N/A');
        doc.moveDown();
      }
      
      if (session.campaignStrategy.keyMessagingPillars) {
        doc.fontSize(12).font('Helvetica-Bold').text('Key Messaging Pillars:');
        session.campaignStrategy.keyMessagingPillars.forEach((pillar, i) => {
          doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${pillar}`);
        });
        doc.moveDown();
      }
      doc.addPage();
    }

    if (session.marketResearch) {
      doc.fontSize(18).font('Helvetica-Bold').text('Market Research & Influencers');
      doc.moveDown();
      
      if (session.marketResearch.localInfluencers) {
        session.marketResearch.localInfluencers.forEach((influencer, i) => {
          doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${influencer.name}`);
          doc.fontSize(10).font('Helvetica').text(`Username: ${influencer.username}`);
          doc.text(`Followers: ${influencer.followers?.toLocaleString() || 'N/A'}`);
          doc.text(`Reason: ${influencer.reason}`);
          doc.moveDown();
        });
      }
      
      if (session.marketResearch.trendingHashtags) {
        doc.fontSize(12).font('Helvetica-Bold').text('Trending Hashtags:');
        doc.fontSize(10).font('Helvetica').text(session.marketResearch.trendingHashtags.join(' '));
        doc.moveDown();
      }
      doc.addPage();
    }

    if (session.campaignContent) {
      doc.fontSize(18).font('Helvetica-Bold').text('Marketing Copy');
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(session.campaignContent.content || 'N/A');
      doc.moveDown();
      
      if (session.campaignContent.hashtags) {
        doc.fontSize(12).font('Helvetica-Bold').text('Hashtags:');
        doc.fontSize(10).font('Helvetica').text(session.campaignContent.hashtags.join(' '));
        doc.moveDown();
      }
      
      if (session.campaignContent.callToAction) {
        doc.fontSize(12).font('Helvetica-Bold').text('Call to Action:');
        doc.fontSize(10).font('Helvetica').text(session.campaignContent.callToAction);
        doc.moveDown();
      }
      doc.addPage();
    }

    if (session.mediaPlan) {
      doc.fontSize(18).font('Helvetica-Bold').text('Media Plan & Content Calendar');
      doc.moveDown();
      
      if (session.mediaPlan.channelStrategy) {
        doc.fontSize(14).font('Helvetica-Bold').text('Channel Strategy:');
        doc.moveDown(0.5);
        session.mediaPlan.channelStrategy.forEach(channel => {
          doc.fontSize(10).font('Helvetica').text(`${channel.channel} (${channel.role}): ${channel.focus}`);
        });
        doc.moveDown();
      }
      
      if (session.mediaPlan.postingSchedule) {
        doc.fontSize(14).font('Helvetica-Bold').text('Weekly Posting Schedule:');
        doc.moveDown(0.5);
        session.mediaPlan.postingSchedule.forEach(post => {
          doc.fontSize(10).font('Helvetica').text(`${post.day} ${post.time} - ${post.platform}: ${post.contentType}`);
        });
        doc.moveDown();
      }
      
      if (session.mediaPlan.budgetAllocation) {
        doc.fontSize(14).font('Helvetica-Bold').text('Budget Allocation:');
        doc.fontSize(10).font('Helvetica').text(`Organic: ${session.mediaPlan.budgetAllocation.organic}`);
        doc.text(`Paid: ${session.mediaPlan.budgetAllocation.paid}`);
        doc.moveDown();
      }
    }

    if (session.visualConcept) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('Visual Concept');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Visual Type:');
      doc.fontSize(10).font('Helvetica').text(session.visualConcept.visualType || 'N/A');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Theme:');
      doc.fontSize(10).font('Helvetica').text(session.visualConcept.theme || 'N/A');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Layout:');
      doc.fontSize(10).font('Helvetica').text(session.visualConcept.layout || 'N/A');
      doc.moveDown();
      
      let imagePath = null;
      const messagesWithImages = session.messages.filter(m => m.imageData?.path);
      if (messagesWithImages.length > 0) {
        const lastMessage = messagesWithImages[messagesWithImages.length - 1];
        imagePath = lastMessage.imageData.path;
      }
      
      if (!imagePath) {
        const generatedImagesPath = path.join(__dirname, 'generated_images');
        if (fs.existsSync(generatedImagesPath)) {
          const files = fs.readdirSync(generatedImagesPath)
            .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
            .sort((a, b) => {
              const aStat = fs.statSync(path.join(generatedImagesPath, a));
              const bStat = fs.statSync(path.join(generatedImagesPath, b));
              return bStat.mtime - aStat.mtime;
            });
          
          if (files.length > 0) {
            imagePath = path.join('generated_images', files[0]);
          }
        }
      }
      
      if (imagePath) {
        const fullImagePath = path.isAbsolute(imagePath) ? imagePath : path.join(__dirname, imagePath);
        
        if (fs.existsSync(fullImagePath)) {
          try {
            doc.moveDown();
            doc.image(fullImagePath, {
              fit: [500, 400],
              align: 'center'
            });
          } catch (err) {
            doc.fontSize(10).font('Helvetica').fillColor('red')
              .text('(Image could not be embedded in PDF)', { align: 'center' });
          }
        }
      }
    }

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// Post to YouTube endpoint
app.post('/api/campaign/post', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const copy = session.campaignContent?.content || 'Campaign Post';
    const hashtags = session.campaignContent?.hashtags || [];
    
    let imagePath = null;
    const messagesWithImages = session.messages.filter(m => m.imageData?.path);
    if (messagesWithImages.length > 0) {
      const lastMessage = messagesWithImages[messagesWithImages.length - 1];
      imagePath = lastMessage.imageData.path;
    }
    
    if (!imagePath) {
      const generatedImagesPath = path.join(__dirname, 'generated_images');
      
      if (fs.existsSync(generatedImagesPath)) {
        const files = fs.readdirSync(generatedImagesPath)
          .filter(f => (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) && !f.startsWith('video_'))
          .sort((a, b) => {
            const aStat = fs.statSync(path.join(generatedImagesPath, a));
            const bStat = fs.statSync(path.join(generatedImagesPath, b));
            return bStat.mtime - aStat.mtime;
          });
        
        if (files.length > 0) {
          imagePath = path.join('generated_images', files[0]);
        }
      }
    }
    
    if (!imagePath) {
      return res.status(400).json({ 
        error: 'No image found for campaign',
        hint: 'Make sure the campaign has completed image generation'
      });
    }
    
    const fullImagePath = path.isAbsolute(imagePath) ? imagePath : path.join(__dirname, imagePath);
    
    if (!fs.existsSync(fullImagePath)) {
      return res.status(400).json({ 
        error: 'Image file not found on server',
        details: `Looking for: ${fullImagePath}`
      });
    }

    const videoFilename = `video_${Date.now()}.mp4`;
    const videoPath = path.join(generatedImagesDir, videoFilename);
    
    await new Promise((resolve, reject) => {
      ffmpeg(fullImagePath)
        .inputOptions(['-loop 1', '-t 2'])
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
          '-r 30'
        ])
        .output(videoPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file was not created');
    }

    const credentialsPath = path.join(__dirname, 'oauth-credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      return res.status(500).json({ 
        error: 'OAuth credentials not found. Please run the OAuth setup first.',
        hint: 'Run: node generate-oauth-token.js'
      });
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uris?.[0] || 'http://localhost'
    );
    
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const title = `${session.title || 'Campaign'} - ${new Date().toLocaleDateString()}`;
    const description = `${copy}\n\n${hashtags.join(' ')}`;

    const videoUpload = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.substring(0, 100),
          description: description.substring(0, 5000),
          tags: hashtags.slice(0, 15).map(h => h.replace('#', '').substring(0, 30)),
          categoryId: '22',
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: 'unlisted',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    try {
      fs.unlinkSync(videoPath);
    } catch (cleanupErr) {
      console.error('Error cleaning up video file:', cleanupErr);
    }

    res.json({
      success: true,
      message: 'Posted to YouTube successfully',
      videoId: videoUpload.data.id,
      videoUrl: `https://www.youtube.com/watch?v=${videoUpload.data.id}`,
      videoTitle: title
    });

  } catch (error) {
    console.error('❌ Error posting to YouTube:', error);
    
    try {
      const files = fs.readdirSync(generatedImagesDir).filter(f => f.startsWith('video_'));
      files.forEach(file => {
        const filePath = path.join(generatedImagesDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }
    
    let errorHint = 'Check server logs for details';
    if (error.message.includes('credentials')) {
      errorHint = 'Run: node generate-oauth-token.js';
    } else if (error.message.includes('quota')) {
      errorHint = 'YouTube API daily quota exceeded (10,000 units/day)';
    }
    
    res.status(500).json({ 
      error: 'Failed to post to YouTube', 
      details: error.message,
      hint: errorHint
    });
  }
});

app.use('/generated_images', express.static(generatedImagesDir));

async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType.startsWith('image/')) {
      return [`Image file uploaded: ${path.basename(filePath)}`];
    } else if (mimeType === 'application/pdf') {
      return [`PDF file uploaded: ${path.basename(filePath)}`];
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return [`DOCX file uploaded: ${path.basename(filePath)}`];
    }
    return [`File uploaded: ${path.basename(filePath)}`];
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return [`File uploaded: ${path.basename(filePath)}`];
  }
}

async function callGeminiAPI(messages) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    let conversationHistory = '';
    messages.forEach(msg => {
      if (msg.role === 'system') {
        conversationHistory += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        conversationHistory += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        conversationHistory += `Assistant: ${msg.content}\n\n`;
      }
    });

    const result = await model.generateContent(conversationHistory);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    throw new Error('Failed to get response from AI service');
  }
}

class CrewAIOrchestrator {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.shortTermMemory = new Map();
    this.agents = {
      strategy: handleStrategy,
      copywriting: handleCopywriting,
      image: handleImage,
      marketResearch: handleMarketResearch,
      mediaPlanning: handleMediaPlanning
    };
  }

  async loadShortTermMemory() {
    try {
      const session = await ChatSession.findOne({ sessionId: this.sessionId });
      if (session && session.shortTermMemory) {
        session.shortTermMemory.forEach(item => {
          if (!item.expiresAt || item.expiresAt > new Date()) {
            this.shortTermMemory.set(item.key, item.value);
          }
        });
      }
    } catch (error) {
      console.error('Error loading short-term memory:', error);
    }
  }

  async saveShortTermMemory(key, value, ttlMinutes = 60) {
    this.shortTermMemory.set(key, value);
    
    try {
      const session = await ChatSession.findOne({ sessionId: this.sessionId });
      if (session) {
        const existingIndex = session.shortTermMemory.findIndex(item => item.key === key);
        const memoryItem = {
          key,
          value,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
        };
        
        if (existingIndex >= 0) {
          session.shortTermMemory[existingIndex] = memoryItem;
        } else {
          session.shortTermMemory.push(memoryItem);
        }
        
        await session.save();
      }
    } catch (error) {
      console.error('Error saving short-term memory:', error);
    }
  }

  getShortTermMemory(key) {
    return this.shortTermMemory.get(key);
  }

  async determineIntent(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('edit') || lowerMessage.includes('change') || lowerMessage.includes('modify')) {
      return 'edit_request';
    }
    
    if (lowerMessage.includes('campaign') || 
        lowerMessage.includes('strategy') || 
        lowerMessage.includes('marketing') ||
        lowerMessage.includes('brief') ||
        lowerMessage.includes('create') ||
        lowerMessage.includes('generate')) {
      return 'full_campaign';
    }
    
    return 'general_chat';
  }

  async orchestrate(userMessage, conversationHistory) {
    await this.loadShortTermMemory();
    
    const intent = await this.determineIntent(userMessage);
    
    if (intent === 'edit_request') {
      return await this.handleEditRequest(userMessage, conversationHistory);
    }
    
    if (intent === 'full_campaign') {
      return await this.handleFullCampaign(userMessage, conversationHistory);
    }
    
    return await this.handleGeneralChat(userMessage, conversationHistory);
  }

  async handleEditRequest(userMessage, conversationHistory) {
    try {
      const lastStrategy = this.getShortTermMemory('last_strategy');
      const lastContent = this.getShortTermMemory('last_content');
      const lastVisual = this.getShortTermMemory('last_visual');
      const lastResearch = this.getShortTermMemory('last_research');
      const lastMediaPlan = this.getShortTermMemory('last_media_plan');
      
      const editPrompt = `You are a campaign editor. The user wants to make edits.

User's edit request: ${userMessage}

Return JSON format:
{
  "componentsToUpdate": ["strategy", "copy", "image"],
  "editReason": "Brief explanation"
}`;

      const messages = [
        { role: 'system', content: 'You are a campaign editing assistant.' },
        { role: 'user', content: editPrompt }
      ];
      
      const editResponse = await callGeminiAPI(messages);
      
      let editInstructions;
      try {
        const cleaned = editResponse.trim().replace(/```json\n?/g, '').replace(/\n?```/g, '');
        editInstructions = JSON.parse(cleaned);
      } catch (e) {
        return {
          response: 'Could you please be more specific about what you would like to change?',
          agentType: 'edit',
          error: true
        };
      }

      const results = {
        strategy: lastStrategy,
        content: lastContent,
        visual: lastVisual,
        research: lastResearch,
        mediaPlan: lastMediaPlan,
        imagePath: null
      };

      const session = await ChatSession.findOne({ sessionId: this.sessionId });
      if (session) {
        if (results.strategy) session.campaignStrategy = results.strategy;
        if (results.content) session.campaignContent = results.content;
        await session.save();
      }

      return {
        response: `Changes applied: ${editInstructions.editReason}`,
        agentType: 'edit',
        data: results
      };

    } catch (error) {
      return {
        response: `Issue while applying edits: ${error.message}`,
        agentType: 'edit',
        error: true
      };
    }
  }

  async handleFullCampaign(userMessage, conversationHistory) {
    try {
      let session = await ChatSession.findOne({ sessionId: this.sessionId });
      
      if (!session) {
        session = new ChatSession({
          sessionId: this.sessionId,
          userId: 'anonymous',
          title: 'Campaign Generation',
          messages: [],
          isActive: true
        });
        await session.save();
      }

      if (session.pendingFeedbackStep) {
        return {
          response: `Please provide feedback on the ${session.pendingFeedbackStep} before proceeding.`,
          agentType: 'feedback_pending',
          requiresFeedback: false
        };
      }

      const context = this.prepareContextForAgent(conversationHistory);
      const strategyResult = await this.agents.strategy(userMessage, context);
      
      if (!strategyResult.success) {
        throw new Error('Strategy generation failed');
      }
      
      await this.saveShortTermMemory('last_strategy', strategyResult.strategy);
      
      session = await ChatSession.findOne({ sessionId: this.sessionId });
      
      if (session) {
        session.campaignStrategy = strategyResult.strategy;
        session.currentWorkflowStep = 'strategy';
        session.pendingFeedbackStep = 'strategy';
        await session.save();
      }

      const strategyResponse = this.formatStrategyResponse(strategyResult.strategy);

      return {
        response: strategyResponse,
        agentType: 'strategy',
        requiresFeedback: true,
        feedbackStep: 'strategy',
        data: { strategy: strategyResult.strategy },
        metadata: strategyResult.metadata
      };

    } catch (error) {
      return {
        response: `Issue while generating campaign: ${error.message}. Please try again.`,
        agentType: 'full_campaign',
        error: true
      };
    }
  }

  formatStrategyResponse(strategy) {
    let response = '## CAMPAIGN STRATEGY\n\n';
    response += `**Core Message:** ${strategy.coreMessage}\n\n`;
    response += `**Tone:** ${strategy.tone}\n\n`;
    
    if (strategy.targetAudience) {
      response += '**Target Audience:**\n';
      response += `- Primary: ${strategy.targetAudience.primary}\n`;
      if (strategy.targetAudience.demographics) {
        response += `- Demographics: ${strategy.targetAudience.demographics}\n`;
      }
      if (strategy.targetAudience.psychographics) {
        response += `- Psychographics: ${strategy.targetAudience.psychographics}\n`;
      }
      response += '\n';
    }
    
    if (strategy.targetChannels && strategy.targetChannels.length > 0) {
      response += `**Target Channels:** ${strategy.targetChannels.join(', ')}\n\n`;
    }
    
    if (strategy.keyMessagingPillars && strategy.keyMessagingPillars.length > 0) {
      response += '**Key Messaging Pillars:**\n';
      strategy.keyMessagingPillars.forEach((pillar, index) => {
        response += `${index + 1}. ${pillar}\n`;
      });
      response += '\n';
    }

    return response;
  }

  async handleGeneralChat(userMessage, conversationHistory) {
    try {
      let messages = [];
      
      if (conversationHistory && conversationHistory.length > 0) {
        messages = conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
      
      messages.unshift({
        role: 'system',
        content: 'You are CampaignAI, a helpful AI assistant specialized in marketing. Be professional yet friendly.'
      });
      
      messages.push({
        role: 'user',
        content: userMessage
      });
      
      const aiResponse = await callGeminiAPI(messages);
      
      return {
        response: aiResponse,
        agentType: 'general',
        metadata: {
          model: 'gemini-2.5-flash',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in general chat handling:', error);
      throw error;
    }
  }

  prepareContextForAgent(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }
    
    return conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
  }

  formatCompleteResponse(strategy, copy, visualConcept, research, mediaPlan, imageData) {
    let response = '## COMPLETE CAMPAIGN PACKAGE\n\n';
    
    response += '### STRATEGY\n\n';
    response += `**Core Message:** ${strategy.coreMessage}\n\n`;
    response += `**Tone:** ${strategy.tone}\n\n`;
    
    if (research && research.localInfluencers && research.localInfluencers.length > 0) {
      response += '---\n\n### MARKET RESEARCH\n\n';
      research.localInfluencers.forEach((influencer, index) => {
        response += `${index + 1}. **${influencer.name}** (${influencer.username})\n`;
        response += `   - Followers: ${influencer.followers?.toLocaleString() || 'N/A'}\n\n`;
      });
    }
    
    response += '---\n\n### COPY\n\n';
    response += `${copy.content}\n\n`;
    
    if (copy.hashtags && copy.hashtags.length > 0) {
      response += `**Hashtags:** ${copy.hashtags.join(' ')}\n\n`;
    }
    
    response += '---\n\n### VISUAL\n\n';
    response += `**Type:** ${visualConcept.visualType}\n`;
    response += `**Theme:** ${visualConcept.theme}\n\n`;
    
    if (imageData && imageData.imagePath) {
      response += `✅ **Image Generated**\n\n`;
    }

    if (mediaPlan) {
      response += '---\n\n### MEDIA PLAN\n\n';
      if (mediaPlan.postingSchedule && mediaPlan.postingSchedule.length > 0) {
        response += '**Posting Schedule:**\n\n';
        mediaPlan.postingSchedule.forEach(post => {
          response += `- ${post.day} ${post.time}: ${post.platform} - ${post.contentType}\n`;
        });
        response += '\n';
      }
    }
    
    response += '---\n\n✅ **Campaign ready!**\n';
    
    return response;
  }
}

// Finalize endpoint
app.post('/api/finalize', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    await ensureDatabaseConnection();

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.campaignStrategy || !session.campaignContent || !session.visualConcept) {
      return res.status(400).json({ 
        error: 'Campaign incomplete. Complete all steps before finalizing.',
        missing: {
          strategy: !session.campaignStrategy,
          content: !session.campaignContent,
          visual: !session.visualConcept
        }
      });
    }

    session.isFinalized = true;
    session.finalizedAt = new Date();
    session.pendingFeedbackStep = null;
    await session.save();

    res.json({
      success: true,
      message: 'Campaign finalized successfully',
      sessionId: sessionId,
      finalizedAt: session.finalizedAt
    });

  } catch (error) {
    console.error('Error finalizing campaign:', error);
    res.status(500).json({
      error: 'Failed to finalize campaign',
      details: error.message
    });
  }
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { sessionId, feedbackStep, approved, feedback } = req.body;

    if (!sessionId || !feedbackStep) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const orchestrator = new CrewAIOrchestrator(sessionId);
    await orchestrator.loadShortTermMemory();

    if (approved) {
      session.pendingFeedbackStep = null;
      let nextResult;
      
      switch (feedbackStep) {
        case 'strategy':
          const strategy = orchestrator.getShortTermMemory('last_strategy');
          const researchResult = await orchestrator.agents.marketResearch('', []);
          
          await orchestrator.saveShortTermMemory('last_research', researchResult.research);
          session.marketResearch = researchResult.research;
          
          const copyResult = await orchestrator.agents.copywriting(strategy, {
            hashtags: researchResult.research?.trendingHashtags || [],
            memes: [],
            contentType: 'socialMediaCaption'
          });
          
          await orchestrator.saveShortTermMemory('last_content', copyResult.content);
          session.campaignContent = copyResult.content;
          session.currentWorkflowStep = 'copy';
          session.pendingFeedbackStep = 'copy';
          await session.save();
          
          nextResult = {
            response: `### MARKETING COPY\n\n${copyResult.content.content}\n\n${copyResult.content.hashtags ? `**Hashtags:** ${copyResult.content.hashtags.join(' ')}` : ''}`,
            agentType: 'copywriting',
            requiresFeedback: true,
            feedbackStep: 'copy',
            data: { copy: copyResult.content }
          };
          break;
          
        case 'copy':
          const lastStrategy = orchestrator.getShortTermMemory('last_strategy');
          const lastContent = orchestrator.getShortTermMemory('last_content');
          
          const imageResult = await orchestrator.agents.image(
            lastStrategy,
            lastContent.content,
            { hashtags: lastContent.hashtags || [], memes: [], generateImage: true }
          );
          
          await orchestrator.saveShortTermMemory('last_visual', imageResult.visualConcept);
          await orchestrator.saveShortTermMemory('last_image_path', imageResult.image?.imagePath);
          session.visualConcept = imageResult.visualConcept;
          session.currentWorkflowStep = 'image';
          session.pendingFeedbackStep = 'image';
          await session.save();
          
          nextResult = {
            response: `### VISUAL CONCEPT\n\n**Type:** ${imageResult.visualConcept.visualType}\n**Theme:** ${imageResult.visualConcept.theme}\n\n${imageResult.image?.imagePath ? '✅ **Image Generated**' : ''}`,
            agentType: 'image',
            requiresFeedback: true,
            feedbackStep: 'image',
            data: { visualConcept: imageResult.visualConcept, imagePath: imageResult.image?.imagePath },
            imagePath: imageResult.image?.imagePath
          };
          break;
          
        case 'image':
          const finalStrategy = orchestrator.getShortTermMemory('last_strategy');
          
          const mediaPlanResult = await orchestrator.agents.mediaPlanning('', {
            context: [],
            strategyData: finalStrategy
          });
          
          await orchestrator.saveShortTermMemory('last_media_plan', mediaPlanResult.mediaPlan);
          session.mediaPlan = mediaPlanResult.mediaPlan;
          session.currentWorkflowStep = 'complete';
          session.pendingFeedbackStep = null;
          await session.save();
          
          const allStrategy = orchestrator.getShortTermMemory('last_strategy');
          const allContent = orchestrator.getShortTermMemory('last_content');
          const allVisual = orchestrator.getShortTermMemory('last_visual');
          const allResearch = orchestrator.getShortTermMemory('last_research');
          const allImagePath = orchestrator.getShortTermMemory('last_image_path');
          
          const completeResponse = orchestrator.formatCompleteResponse(
            allStrategy,
            allContent,
            allVisual,
            allResearch,
            mediaPlanResult.mediaPlan,
            allImagePath ? { imagePath: allImagePath } : null
          );
          
          nextResult = {
            response: completeResponse,
            agentType: 'full_campaign',
            requiresFeedback: false,
            data: {
              strategy: allStrategy,
              copy: allContent,
              visualConcept: allVisual,
              research: allResearch,
              mediaPlan: mediaPlanResult.mediaPlan,
              imagePath: allImagePath
            },
            imagePath: allImagePath
          };
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid feedback step' });
      }
      
      return res.json(nextResult);
      
    } else {
      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({ error: 'Feedback text is required' });
      }
      
      let regeneratedResult;
      
      switch (feedbackStep) {
        case 'strategy':
          const strategyPrompt = `Revision needed. User feedback: ${feedback}`;
          const strategyResult = await orchestrator.agents.strategy(strategyPrompt, []);
          
          await orchestrator.saveShortTermMemory('last_strategy', strategyResult.strategy);
          session.campaignStrategy = strategyResult.strategy;
          await session.save();
          
          regeneratedResult = {
            response: orchestrator.formatStrategyResponse(strategyResult.strategy),
            agentType: 'strategy',
            requiresFeedback: true,
            feedbackStep: 'strategy',
            data: { strategy: strategyResult.strategy }
          };
          break;
          
        case 'copy':
          const strategy = orchestrator.getShortTermMemory('last_strategy');
          const lastResearch = orchestrator.getShortTermMemory('last_research');
          
          const copyResult = await orchestrator.agents.copywriting(strategy, {
            hashtags: lastResearch?.trendingHashtags || [],
            memes: [],
            contentType: 'socialMediaCaption',
            userFeedback: feedback
          });
          
          await orchestrator.saveShortTermMemory('last_content', copyResult.content);
          session.campaignContent = copyResult.content;
          await session.save();
          
          regeneratedResult = {
            response: `### MARKETING COPY (Revised)\n\n${copyResult.content.content}`,
            agentType: 'copywriting',
            requiresFeedback: true,
            feedbackStep: 'copy',
            data: { copy: copyResult.content }
          };
          break;
          
        case 'image':
          const currentStrategy = orchestrator.getShortTermMemory('last_strategy');
          const currentContent = orchestrator.getShortTermMemory('last_content');
          const currentImagePath = orchestrator.getShortTermMemory('last_image_path');
          
          const newImageResult = await regenerateImageWithFeedback(
            currentStrategy,
            currentContent.content,
            currentImagePath,
            feedback
          );
          
          await orchestrator.saveShortTermMemory('last_visual', newImageResult.visualConcept);
          await orchestrator.saveShortTermMemory('last_image_path', newImageResult.image?.imagePath);
          session.visualConcept = newImageResult.visualConcept;
          await session.save();
          
          regeneratedResult = {
            response: `### VISUAL (Revised)\n\n**Type:** ${newImageResult.visualConcept.visualType}\n\n✅ **Updated**`,
            agentType: 'image',
            requiresFeedback: true,
            feedbackStep: 'image',
            data: { visualConcept: newImageResult.visualConcept, imagePath: newImageResult.image?.imagePath },
            imagePath: newImageResult.image?.imagePath
          };
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid feedback step' });
      }
      
      return res.json(regeneratedResult);
    }

  } catch (error) {
    console.error('Error handling feedback:', error);
    res.status(500).json({
      error: 'Failed to process feedback',
      details: error.message
    });
  }
});

// Main chat endpoint
app.post('/api/chat', upload.single('file'), async (req, res) => {
  try {
    const { message, context, sessionId, userId } = req.body;
    let userMessage = message || '';

    let fileInfo = null;
    if (req.file) {
      const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
      userMessage += `\n\nFile content: ${extractedText}`;

      fileInfo = {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      };

      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    let conversationHistory = [];
    if (context) {
      try {
        conversationHistory = JSON.parse(context);
      } catch (error) {
        console.error('Error parsing context:', error);
      }
    }

    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentUserId = userId || 'anonymous';
    
    let chatSession = await ChatSession.findOne({ sessionId: currentSessionId });
    
    if (!chatSession) {
      chatSession = new ChatSession({
        sessionId: currentSessionId,
        userId: currentUserId,
        title: userMessage.substring(0, 50) || 'New Chat',
        messages: [],
        isActive: true
      });
      await chatSession.save();
    } else {
      if (chatSession.userId === 'anonymous' && currentUserId !== 'anonymous') {
        chatSession.userId = currentUserId;
        await chatSession.save();
      }
    }

    const orchestrator = new CrewAIOrchestrator(currentSessionId);
    const orchestratorResult = await orchestrator.orchestrate(userMessage, conversationHistory);
    
    const aiResponse = orchestratorResult.response;
    const agentType = orchestratorResult.agentType;

    const userMessageDoc = {
      messageId: `msg_${Date.now()}_user`,
      type: 'user',
      content: message || `File uploaded: ${fileInfo?.name || 'Unknown file'}`,
      timestamp: new Date(),
      ...(fileInfo && { file: fileInfo })
    };

    const botMessageDoc = {
      messageId: `msg_${Date.now() + 1}_bot`,
      type: agentType === 'general' ? 'bot' : 'agent',
      content: aiResponse,
      timestamp: new Date(),
      agentType: agentType,
      requiresFeedback: orchestratorResult.requiresFeedback || false,
      feedbackStep: orchestratorResult.feedbackStep || null,
      feedbackReceived: false,
      ...(orchestratorResult.imagePath && { 
        imageData: { 
          path: orchestratorResult.imagePath,
          mimeType: 'image/png'
        }
      })
    };

    chatSession = await ChatSession.findOne({ sessionId: currentSessionId });
    
    if (chatSession) {
      chatSession.messages.push(userMessageDoc, botMessageDoc);
      chatSession.title = chatSession.messages[0]?.content?.substring(0, 50) || 'New Chat';
      chatSession.userId = currentUserId;
      await chatSession.save();
    }

    res.json({
      response: aiResponse,
      sessionId: currentSessionId,
      agentType: agentType,
      timestamp: new Date().toISOString(),
      requiresFeedback: orchestratorResult.requiresFeedback || false,
      feedbackStep: orchestratorResult.feedbackStep || null,
      ...(orchestratorResult.metadata && { metadata: orchestratorResult.metadata }),
      ...(orchestratorResult.data && { data: orchestratorResult.data }),
      ...(orchestratorResult.imagePath && { imagePath: orchestratorResult.imagePath })
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message.includes('AI service')) {
      statusCode = 502;
      errorMessage = 'AI service temporarily unavailable';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message
    });
  }
});

app.put('/api/messages/:messageId/edit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { sessionId, newContent } = req.body;

    const session = await ChatSession.findOne({ sessionId: sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messageIndex = session.messages.findIndex(m => m.messageId === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = session.messages[messageIndex];
    
    if (!message.editHistory) {
      message.editHistory = [];
    }
    message.editHistory.push({
      content: message.content,
      timestamp: new Date()
    });
    
    message.content = newContent;
    message.isEdited = true;

    await session.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      updatedMessage: message
    });

  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      error: 'Failed to edit message',
      details: error.message
    });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const { userId = 'anonymous', limit = 20 } = req.query;
    
    const sessions = await ChatSession.find({ 
      userId: userId,
      isActive: true 
    })
    .select('sessionId title createdAt updatedAt isFinalized finalizedAt')
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit));

    res.json({
      sessions: sessions.map(session => ({
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isFinalized: session.isFinalized || false,
        finalizedAt: session.finalizedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch chat sessions',
      details: error.message
    });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({ 
      sessionId: sessionId,
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      id: session.sessionId,
      title: session.title,
      messages: session.messages.map(msg => ({
        id: msg.messageId,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        agentType: msg.agentType,
        isEdited: msg.isEdited,
        requiresFeedback: msg.requiresFeedback,
        feedbackStep: msg.feedbackStep,
        feedbackReceived: msg.feedbackReceived,
        ...(msg.file && { file: msg.file }),
        ...(msg.imageData && { imageData: msg.imageData })
      })),
      campaignStrategy: session.campaignStrategy,
      campaignContent: session.campaignContent,
      visualConcept: session.visualConcept,
      marketResearch: session.marketResearch,
      mediaPlan: session.mediaPlan,
      isFinalized: session.isFinalized || false,
      finalizedAt: session.finalizedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch chat session',
      details: error.message
    });
  }
});

app.get('/api/sessions/:sessionId/strategy', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({ sessionId: sessionId, isActive: true });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (!session.campaignStrategy) {
      return res.status(404).json({ error: 'No campaign strategy found' });
    }

    res.json({
      sessionId: session.sessionId,
      strategy: session.campaignStrategy,
      timestamp: session.updatedAt
    });

  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign strategy',
      details: error.message
    });
  }
});

app.get('/api/sessions/:sessionId/mediaplan', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({ sessionId: sessionId, isActive: true });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (!session.mediaPlan) {
      return res.status(404).json({ error: 'No media plan found' });
    }

    res.json({
      sessionId: session.sessionId,
      mediaPlan: session.mediaPlan,
      timestamp: session.updatedAt
    });

  } catch (error) {
    console.error('Error fetching media plan:', error);
    res.status(500).json({
      error: 'Failed to fetch media plan',
      details: error.message
    });
  }
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await ChatSession.updateOne(
      { sessionId: sessionId },
      { isActive: false }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      message: 'Chat session deleted successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Failed to delete chat session',
      details: error.message
    });
  }
});

// SCHEDULER ENDPOINTS

app.post('/api/schedule-post', async (req, res) => {
  try {
    const { sessionId, scheduledAt, videoDuration = 3 } = req.body;

    if (!sessionId || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await ensureDatabaseConnection();

    const session = await ChatSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.isFinalized) {
      return res.status(400).json({ error: 'Campaign must be finalized before scheduling' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const existingSchedule = await ScheduledPost.findOne({ 
      sessionId,
      status: { $in: ['scheduled', 'posting'] }
    });

    if (existingSchedule) {
      return res.status(400).json({ error: 'Campaign already has a scheduled post' });
    }

    const scheduledPost = new ScheduledPost({
      sessionId,
      campaignTitle: session.title,
      scheduledAt: scheduledDate,
      videoDuration: parseInt(videoDuration),
      status: 'scheduled'
    });

    await scheduledPost.save();

    res.json({
      success: true,
      message: 'Post scheduled successfully',
      scheduledPost: {
        id: scheduledPost._id,
        sessionId: scheduledPost.sessionId,
        campaignTitle: scheduledPost.campaignTitle,
        scheduledAt: scheduledPost.scheduledAt,
        status: scheduledPost.status
      }
    });

  } catch (error) {
    console.error('Error scheduling post:', error);
    res.status(500).json({
      error: 'Failed to schedule post',
      details: error.message
    });
  }
});

app.get('/api/scheduled-posts', async (req, res) => {
  try {
    const { status } = req.query;

    await ensureDatabaseConnection();

    const query = {};
    if (status) {
      query.status = status;
    }

    const scheduledPosts = await ScheduledPost.find(query)
      .sort({ scheduledAt: -1 })
      .limit(100);

    res.json({
      success: true,
      scheduledPosts: scheduledPosts.map(post => ({
        _id: post._id,
        sessionId: post.sessionId,
        campaignTitle: post.campaignTitle,
        scheduledAt: post.scheduledAt,
        status: post.status,
        videoUrl: post.videoUrl,
        videoId: post.videoId,
        errorMessage: post.errorMessage,
        attempts: post.attempts,
        postedAt: post.postedAt,
        createdAt: post.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduled posts',
      details: error.message
    });
  }
});

app.get('/api/scheduled-posts/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    await ensureDatabaseConnection();

    const scheduledPost = await ScheduledPost.findById(scheduleId);

    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    const session = await ChatSession.findOne({ sessionId: scheduledPost.sessionId, isActive: true });

    res.json({
      success: true,
      scheduledPost: {
        _id: scheduledPost._id,
        sessionId: scheduledPost.sessionId,
        campaignTitle: scheduledPost.campaignTitle,
        scheduledAt: scheduledPost.scheduledAt,
        videoDuration: scheduledPost.videoDuration,
        status: scheduledPost.status,
        videoUrl: scheduledPost.videoUrl,
        videoId: scheduledPost.videoId,
        errorMessage: scheduledPost.errorMessage,
        attempts: scheduledPost.attempts,
        createdAt: scheduledPost.createdAt
      },
      session: session ? {
        title: session.title,
        campaignStrategy: session.campaignStrategy,
        campaignContent: session.campaignContent
      } : null
    });

  } catch (error) {
    console.error('Error fetching scheduled post:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduled post',
      details: error.message
    });
  }
});

app.put('/api/scheduled-posts/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { scheduledAt, videoDuration } = req.body;

    await ensureDatabaseConnection();

    const scheduledPost = await ScheduledPost.findById(scheduleId);

    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    if (scheduledPost.status !== 'scheduled') {
      return res.status(400).json({ error: `Cannot update post with status: ${scheduledPost.status}` });
    }

    if (scheduledAt) {
      const newScheduledDate = new Date(scheduledAt);
      if (newScheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
      scheduledPost.scheduledAt = newScheduledDate;
    }

    if (videoDuration !== undefined) {
      scheduledPost.videoDuration = parseInt(videoDuration);
    }

    await scheduledPost.save();

    res.json({
      success: true,
      message: 'Scheduled post updated successfully',
      scheduledPost: {
        _id: scheduledPost._id,
        sessionId: scheduledPost.sessionId,
        scheduledAt: scheduledPost.scheduledAt,
        videoDuration: scheduledPost.videoDuration,
        status: scheduledPost.status
      }
    });

  } catch (error) {
    console.error('Error updating scheduled post:', error);
    res.status(500).json({
      error: 'Failed to update scheduled post',
      details: error.message
    });
  }
});

app.delete('/api/scheduled-posts/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    await ensureDatabaseConnection();

    const scheduledPost = await ScheduledPost.findById(scheduleId);

    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    if (!['scheduled', 'failed'].includes(scheduledPost.status)) {
      return res.status(400).json({ error: `Cannot cancel post with status: ${scheduledPost.status}` });
    }

    scheduledPost.status = 'cancelled';
    await scheduledPost.save();

    res.json({
      success: true,
      message: 'Scheduled post cancelled successfully',
      scheduledPost: {
        _id: scheduledPost._id,
        sessionId: scheduledPost.sessionId,
        status: scheduledPost.status
      }
    });

  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    res.status(500).json({
      error: 'Failed to cancel scheduled post',
      details: error.message
    });
  }
});

app.get('/api/sessions/:sessionId/scheduled-posts', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await ensureDatabaseConnection();

    const scheduledPosts = await ScheduledPost.find({ sessionId })
      .sort({ scheduledAt: -1 });

    res.json({
      success: true,
      sessionId: sessionId,
      scheduledPosts: scheduledPosts.map(post => ({
        _id: post._id,
        scheduledAt: post.scheduledAt,
        status: post.status,
        videoUrl: post.videoUrl,
        videoId: post.videoId,
        errorMessage: post.errorMessage,
        attempts: post.attempts,
        postedAt: post.postedAt,
        createdAt: post.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching session scheduled posts:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduled posts for session',
      details: error.message
    });
  }
});

app.get('/api/scheduler/stats', async (req, res) => {
  try {
    await ensureDatabaseConnection();

    const totalScheduled = await ScheduledPost.countDocuments({ status: 'scheduled' });
    const totalPosting = await ScheduledPost.countDocuments({ status: 'posting' });
    const totalPosted = await ScheduledPost.countDocuments({ status: 'posted' });
    const totalFailed = await ScheduledPost.countDocuments({ status: 'failed' });
    const totalCancelled = await ScheduledPost.countDocuments({ status: 'cancelled' });

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingPosts = await ScheduledPost.countDocuments({
      status: 'scheduled',
      scheduledAt: { $gte: now, $lte: next24Hours }
    });

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const todayPosts = await ScheduledPost.countDocuments({
      status: 'scheduled',
      scheduledAt: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      success: true,
      stats: {
        byStatus: {
          scheduled: totalScheduled,
          posting: totalPosting,
          posted: totalPosted,
          failed: totalFailed,
          cancelled: totalCancelled
        },
        upcoming: {
          next24Hours: upcomingPosts,
          today: todayPosts
        },
        total: totalScheduled + totalPosting + totalPosted + totalFailed + totalCancelled
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching scheduler stats:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduler statistics',
      details: error.message
    });
  }
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let schedulerStats = null;
  
  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
      
      const scheduledCount = await ScheduledPost.countDocuments({ status: 'scheduled' });
      const postingCount = await ScheduledPost.countDocuments({ status: 'posting' });
      schedulerStats = {
        scheduled: scheduledCount,
        posting: postingCount
      };
    }
  } catch (error) {
    dbStatus = 'error';
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    scheduler: schedulerStats,
    geminiApiConfigured: !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here',
    googleSearchConfigured: !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_CX,
    orchestrator: 'active',
    agents: ['strategy', 'copywriting', 'image', 'marketResearch', 'mediaPlanning'],
    workflow: 'sequential_with_feedback',
    features: ['mongodb_image_storage', 'campaign_export', 'youtube_ready', 'scheduler']
  });
});

module.exports = { ScheduledPost };

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         CampaignAI - CAMPAIGN ORCHESTRATOR            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('Available Endpoints:');
  console.log('');
  console.log('CAMPAIGN WORKFLOW:');
  console.log(`   POST /api/chat                        - Full Campaign Generation`);
  console.log(`   POST /api/feedback                    - Handle feedback on steps`);
  console.log(`   POST /api/finalize                    - Finalize campaign`);
  console.log('');
  console.log('SCHEDULER:');
  console.log(`   POST /api/schedule-post               - Schedule a campaign`);
  console.log(`   GET  /api/scheduled-posts             - Get all scheduled posts`);
  console.log(`   GET  /api/scheduled-posts/:id         - Get specific scheduled post`);
  console.log(`   PUT  /api/scheduled-posts/:id         - Update scheduled post`);
  console.log(`   DELETE /api/scheduled-posts/:id       - Cancel scheduled post`);
  console.log(`   GET  /api/sessions/:id/scheduled-posts - Get session's posts`);
  console.log(`   GET  /api/scheduler/stats             - Get scheduler statistics`);
  console.log('');
  console.log('EXPORT & DOWNLOAD:');
  console.log(`   POST /api/campaign/download           - Download PDF`);
  console.log(`   POST /api/campaign/post               - Post to YouTube`);
  console.log('');
  console.log('SESSION MANAGEMENT:');
  console.log(`   PUT  /api/messages/:id/edit           - Edit message`);
  console.log(`   GET  /api/sessions                    - Get all chat sessions`);
  console.log(`   GET  /api/sessions/:id                - Get specific session`);
  console.log(`   GET  /api/sessions/:id/strategy       - Get campaign strategy`);
  console.log(`   GET  /api/sessions/:id/mediaplan      - Get media plan`);
  console.log(`   DELETE /api/sessions/:id              - Delete session`);
  console.log(`   GET  /api/health                      - Health check`);
  console.log('');
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.log('⚠ WARNING: GEMINI_API_KEY not configured!');
  } else {
    console.log('✓ Gemini API configured');
  }

  console.log('');
  console.log('Campaign Workflow:');
  console.log('   1. Strategy Agent → FEEDBACK');
  console.log('   2. Market Research Agent');
  console.log('   3. Copywriting Agent → FEEDBACK');
  console.log('   4. Image Agent → FEEDBACK');
  console.log('   5. Media Planning Agent');
  console.log('   6. Finalize - POST /api/finalize');
  console.log('   7. Schedule - POST /api/schedule-post');
  console.log('   8. Auto-post at scheduled time\n');
  console.log('⚡ Run scheduler: node scheduler.js\n');
});