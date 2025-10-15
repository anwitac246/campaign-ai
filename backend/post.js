const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { google } = require('googleapis');
const cv = require('opencv4nodejs');
require('dotenv').config();

// File paths
const CREDENTIALS_PATH = path.join(__dirname, 'oauth_credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Server configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3005';

// Directories
const TEMP_DIR = path.join(__dirname, 'temp_videos');
if (!fsSync.existsSync(TEMP_DIR)) {
  fsSync.mkdirSync(TEMP_DIR, { recursive: true });
}

class YouTubeVideoPoster {
  constructor() {
    this.oauth2Client = null;
    this.youtube = null;
  }

  async initialize() {
    try {
      // Check if credentials file exists
      if (!fsSync.existsSync(CREDENTIALS_PATH)) {
        throw new Error(`Credentials file not found at ${CREDENTIALS_PATH}. Please download it from Google Cloud Console.`);
      }

      // Load client secrets from file
      const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
      const credentials = JSON.parse(content);
      
      // Support both installed and web application types
      const clientConfig = credentials.installed || credentials.web;
      
      if (!clientConfig) {
        throw new Error('Invalid credentials file format. Should contain "installed" or "web" property.');
      }

      const { client_secret, client_id, redirect_uris } = clientConfig;

      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      // Try to load saved token
      if (fsSync.existsSync(TOKEN_PATH)) {
        try {
          const token = await fs.readFile(TOKEN_PATH, 'utf8');
          this.oauth2Client.setCredentials(JSON.parse(token));
          console.log('✓ Using saved authentication token');
        } catch (err) {
          console.log('⚠ Saved token is invalid. Need to re-authorize.');
          return false;
        }
      } else {
        console.log('⚠ No saved token found. Need to authorize first.');
        return false;
      }

      this.youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      console.log('✓ YouTube client initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing YouTube client:', error.message);
      throw error;
    }
  }

  // Get OAuth URL for first-time authentication
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Save the token to file for future use
      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      
      console.log('✓ Authorization successful!');
      console.log(`✓ Token saved to: ${TOKEN_PATH}`);
      console.log('\nYou can now upload videos without re-authorizing.');
      
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.message);
      throw error;
    }
  }

  // Fetch campaign data from server
  async fetchCampaignData(sessionId) {
    try {
      console.log(`Fetching campaign data for session: ${sessionId}`);
      
      const response = await axios.get(`${SERVER_URL}/api/sessions/${sessionId}`);
      
      if (!response.data) {
        throw new Error('Campaign data not found');
      }

      console.log('✓ Campaign data fetched successfully');
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign data:', error.message);
      throw error;
    }
  }

  // Download image from server
  async downloadImage(sessionId) {
    try {
      console.log('Downloading campaign image...');
      
      const imageUrl = `${SERVER_URL}/api/image/${sessionId}`;
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const imagePath = path.join(TEMP_DIR, `campaign_${sessionId}.png`);
      await fs.writeFile(imagePath, response.data);
      
      // Verify file was written
      const stats = await fs.stat(imagePath);
      console.log(`✓ Image downloaded: ${imagePath} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      return imagePath;
    } catch (error) {
      console.error('Error downloading image:', error.message);
      throw error;
    }
  }

  // Create video from static image
  async createVideo(imagePath, outputPath, duration = 3) {
    try {
      console.log(`Creating ${duration}-second video from image...`);
      
      // Verify image exists
      if (!fsSync.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const img = await cv.imreadAsync(imagePath);
      const height = img.rows;
      const width = img.cols;
      
      console.log(`Image dimensions: ${width}x${height}`);
      
      // Use H.264 codec for better compatibility
      const fourcc = cv.VideoWriter.fourcc('H', '2', '6', '4');
      const fps = 30;
      const frameCount = duration * fps;
      
      const videoWriter = new cv.VideoWriter(
        outputPath,
        fourcc,
        fps,
        new cv.Size(width, height),
        true
      );
      
      console.log(`Generating ${frameCount} frames at ${fps} FPS...`);
      
      for (let i = 0; i < frameCount; i++) {
        videoWriter.write(img);
        
        // Show progress
        if ((i + 1) % 15 === 0 || i === frameCount - 1) {
          const percent = Math.round(((i + 1) / frameCount) * 100);
          process.stdout.write(`\rProgress: ${i + 1}/${frameCount} frames (${percent}%)`);
        }
      }
      
      console.log('\n✓ Video frames generated');
      videoWriter.release();
      
      // Verify video was created
      const stats = await fs.stat(outputPath);
      console.log(`✓ Video created: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return outputPath;
    } catch (error) {
      console.error('Error creating video:', error.message);
      throw error;
    }
  }

  // Upload video to YouTube
  async uploadToYouTube(videoPath, campaignData) {
    try {
      console.log('Uploading video to YouTube...');
      console.log('This may take a few minutes depending on video size...');
      
      // Verify video file exists
      if (!fsSync.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Prepare metadata from campaign data
      const title = this.prepareTitle(campaignData);
      const description = this.formatDescription(campaignData);
      const tags = this.prepareTags(campaignData);
      
      console.log(`\nVideo Details:`);
      console.log(`Title: ${title}`);
      console.log(`Description length: ${description.length} characters`);
      console.log(`Tags: ${tags.join(', ')}`);
      console.log('');

      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title,
            description: description,
            tags: tags,
            categoryId: '22', // People & Blogs
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: 'public', // Change to 'private' or 'unlisted' if needed
            selfDeclaredMadeForKids: false,
            madeForKids: false
          }
        },
        media: {
          body: fsSync.createReadStream(videoPath)
        }
      });

      const videoId = response.data.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      console.log('✓ Video uploaded successfully!');
      console.log(`\nVideo ID: ${videoId}`);
      console.log(`Video URL: ${videoUrl}`);
      
      return {
        success: true,
        videoId: videoId,
        videoUrl: videoUrl,
        title: title,
        response: response.data
      };
    } catch (error) {
      console.error('Error uploading to YouTube:', error.message);
      if (error.response) {
        console.error('YouTube API Error Details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // Prepare title (max 100 characters)
  prepareTitle(campaignData) {
    let title = campaignData.title || 'Marketing Campaign';
    
    // Extract first meaningful line from content if title is generic
    if (title === 'New Chat' || title === 'New chat' || title.length < 10) {
      const content = campaignData.campaignContent?.content || '';
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.length > 10) {
        title = firstLine;
      }
    }
    
    // Truncate to YouTube's 100 character limit
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }
    
    return title;
  }

  // Prepare tags (max 500 characters total, 15 tags max)
  prepareTags(campaignData) {
    const tags = [];
    
    // Add hashtags without the # symbol
    if (campaignData.campaignContent?.hashtags) {
      const hashtagTags = campaignData.campaignContent.hashtags
        .map(tag => tag.replace('#', ''))
        .filter(tag => tag.length > 0);
      tags.push(...hashtagTags);
    }
    
    // Add some default marketing tags
    tags.push('marketing', 'campaign', 'advertisement');
    
    // Remove duplicates and limit to 15 tags
    const uniqueTags = [...new Set(tags)].slice(0, 15);
    
    // Ensure total character count doesn't exceed 500
    let totalLength = uniqueTags.join(',').length;
    while (totalLength > 500 && uniqueTags.length > 0) {
      uniqueTags.pop();
      totalLength = uniqueTags.join(',').length;
    }
    
    return uniqueTags;
  }

  // Format description (max 5000 characters)
  formatDescription(campaignData) {
    let description = '';
    
    // Add main campaign content
    if (campaignData.campaignContent?.content) {
      description += campaignData.campaignContent.content + '\n\n';
    }
    
    // Add call to action
    if (campaignData.campaignContent?.callToAction) {
      description += '👉 ' + campaignData.campaignContent.callToAction + '\n\n';
    }
    
    // Add hashtags
    if (campaignData.campaignContent?.hashtags && campaignData.campaignContent.hashtags.length > 0) {
      description += campaignData.campaignContent.hashtags.join(' ') + '\n\n';
    }
    
    // Add strategy info if available
    if (campaignData.campaignStrategy?.coreMessage) {
      description += '---\n';
      description += 'Campaign Strategy:\n';
      description += campaignData.campaignStrategy.coreMessage + '\n\n';
    }
    
    // Add footer
    description += '---\n';
    description += 'Created with Relatus.AI - AI-Powered Marketing Campaign Generator\n';
    description += 'https://relatusai.com\n';
    
    // Truncate to YouTube's 5000 character limit
    if (description.length > 5000) {
      description = description.substring(0, 4997) + '...';
    }
    
    return description;
  }

  // Main process: Complete workflow
  async processAndUpload(sessionId, options = {}) {
    const {
      videoDuration = 3,
      cleanup = true
    } = options;

    let imagePath = null;
    let videoPath = null;

    try {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║      YouTube Video Generator & Uploader               ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`Session ID: ${sessionId}`);
      console.log(`Video Duration: ${videoDuration} seconds\n`);

      // Initialize YouTube client
      console.log('Initializing YouTube API client...');
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('YouTube client not authorized. Please run: node post.js --auth');
      }

      // Fetch campaign data
      console.log('\nSTEP 1/4: Fetching campaign data...');
      const campaignData = await this.fetchCampaignData(sessionId);
      console.log(`Campaign Title: ${campaignData.title || 'Untitled'}`);

      // Download image
      console.log('\nSTEP 2/4: Downloading campaign image...');
      imagePath = await this.downloadImage(sessionId);

      // Create video
      console.log('\nSTEP 3/4: Creating video from image...');
      videoPath = path.join(TEMP_DIR, `video_${sessionId}_${Date.now()}.mp4`);
      await this.createVideo(imagePath, videoPath, videoDuration);

      // Upload to YouTube
      console.log('\nSTEP 4/4: Uploading to YouTube...');
      const uploadResult = await this.uploadToYouTube(videoPath, campaignData);

      // Cleanup temporary files
      if (cleanup) {
        console.log('\nCleaning up temporary files...');
        try {
          if (imagePath && fsSync.existsSync(imagePath)) {
            await fs.unlink(imagePath);
            console.log('✓ Deleted temporary image');
          }
          if (videoPath && fsSync.existsSync(videoPath)) {
            await fs.unlink(videoPath);
            console.log('✓ Deleted temporary video');
          }
        } catch (cleanupError) {
          console.warn('⚠ Warning: Could not clean up all temporary files');
        }
      }

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║          ✓ UPLOAD COMPLETED SUCCESSFULLY!             ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`📺 Watch your video: ${uploadResult.videoUrl}\n`);

      return uploadResult;

    } catch (error) {
      console.error('\n╔════════════════════════════════════════════════════════╗');
      console.error('║                  ✗ UPLOAD FAILED                       ║');
      console.error('╚════════════════════════════════════════════════════════╝\n');
      console.error(`Error: ${error.message}\n`);
      
      // Cleanup on error
      if (cleanup) {
        try {
          if (imagePath && fsSync.existsSync(imagePath)) await fs.unlink(imagePath);
          if (videoPath && fsSync.existsSync(videoPath)) await fs.unlink(videoPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  // Help command
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   YouTube Video Generator & Uploader for Relatus.AI    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('USAGE:');
    console.log('  node post.js <command> [options]\n');
    console.log('COMMANDS:');
    console.log('  <sessionId>          Upload campaign video to YouTube');
    console.log('  --auth               Get YouTube OAuth authorization URL');
    console.log('  --token <code>       Complete OAuth with authorization code');
    console.log('  --help, -h           Show this help message\n');
    console.log('OPTIONS:');
    console.log('  --duration <sec>     Video duration in seconds (default: 3)');
    console.log('  --no-cleanup         Keep temporary video files\n');
    console.log('EXAMPLES:');
    console.log('  # First time setup (run these once)');
    console.log('  node post.js --auth');
    console.log('  node post.js --token YOUR_AUTHORIZATION_CODE\n');
    console.log('  # Upload videos (after authorization)');
    console.log('  node post.js session_12345');
    console.log('  node post.js session_12345 --duration 5');
    console.log('  node post.js session_12345 --no-cleanup\n');
    console.log('SETUP:');
    console.log('  1. Download OAuth credentials from Google Cloud Console');
    console.log('  2. Save as "oauth_credentials.json" in project root');
    console.log('  3. Run: node post.js --auth');
    console.log('  4. Open the URL, authorize, and copy the code');
    console.log('  5. Run: node post.js --token YOUR_CODE');
    console.log('  6. Start uploading videos!\n');
    return;
  }

  const poster = new YouTubeVideoPoster();

  // Authorization flow - Get auth URL
  if (args.includes('--auth')) {
    try {
      await poster.initialize();
      const authUrl = poster.getAuthUrl();
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║            YouTube OAuth Authorization                 ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('STEP 1: Open this URL in your browser:\n');
      console.log(authUrl);
      console.log('\nSTEP 2: Sign in and authorize the application\n');
      console.log('STEP 3: Copy the authorization code from the redirect URL\n');
      console.log('STEP 4: Run this command with your code:');
      console.log('        node post.js --token YOUR_AUTHORIZATION_CODE\n');
    } catch (error) {
      console.error('\n✗ Error:', error.message);
      console.error('\nMake sure oauth_credentials.json exists in the project root.');
      process.exit(1);
    }
    return;
  }

  // Authorization flow - Exchange code for token
  if (args.includes('--token')) {
    const codeIndex = args.indexOf('--token') + 1;
    const code = args[codeIndex];
    
    if (!code) {
      console.error('\n✗ Error: Please provide authorization code after --token');
      console.error('   Usage: node post.js --token YOUR_AUTHORIZATION_CODE\n');
      process.exit(1);
    }
    
    try {
      await poster.initialize();
      await poster.getTokensFromCode(code);
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║          ✓ AUTHORIZATION SUCCESSFUL!                   ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('You can now upload videos without re-authorizing.');
      console.log('Try: node post.js YOUR_SESSION_ID\n');
    } catch (error) {
      console.error('\n✗ Authorization failed:', error.message);
      console.error('\nPlease make sure you copied the complete authorization code.\n');
      process.exit(1);
    }
    return;
  }

  // Upload video
  const sessionId = args[0];
  
  if (!sessionId || sessionId.startsWith('--')) {
    console.error('\n✗ Error: Please provide a valid session ID');
    console.error('   Usage: node post.js <sessionId> [options]');
    console.error('   Run "node post.js --help" for more information\n');
    process.exit(1);
  }

  const options = {
    videoDuration: args.includes('--duration') ? parseInt(args[args.indexOf('--duration') + 1]) || 3 : 3,
    cleanup: !args.includes('--no-cleanup')
  };

  try {
    await poster.processAndUpload(sessionId, options);
    process.exit(0);
  } catch (error) {
    console.error('Upload failed. Check the error above for details.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n✗ Fatal error:', error.message);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  YouTubeVideoPoster
};