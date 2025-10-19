<div align="center">

# Campaign AI

[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)](https://github.com/yourusername/campaign-ai)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Campaign AI](https://img.shields.io/badge/Campaign-AI-9b59b6?style=for-the-badge&logo=robot)](https://github.com/yourusername/campaign-ai)

An AI-powered marketing campaign assistant that helps businesses create comprehensive marketing strategies through intelligent automation

</div>

---

## Technology Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

## Overview

Campaign AI is a full-stack AI-powered marketing assistant designed to empower small businesses and marketing teams. It streamlines the entire campaign creation process by leveraging a crew of specialized AI agents for market research, strategy development, copywriting, and image generation.

All features are accessible via an intuitive conversational chatbot interface, enabling users to interact naturally with powerful AI tools to plan and execute effective marketing campaigns from start to finish.

### Key Features

- AI-powered market research and trend analysis
- Automated marketing strategy development
- Professional copywriting for ads and social media
- AI-generated visual concepts and imagery
- Conversational chatbot interface for natural interaction
- Secure user authentication and data management

## Visual Architecture

### AI Agent Workflow

The core of Campaign AI is a sequential workflow where specialized agents build upon each other's work to create a complete marketing package.

```
[ User Input: "Create a campaign for my new coffee shop" ]
       │
       ▼
┌──────────────────────┐
│ 1. Market Research   │
│   (Finds trends,     │
│    influencers)      │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│ 2. Strategy Agent    │
│   (Defines message,  │
│    audience, tone)   │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. Copywriting Agent │
│   (Writes ad copy,   │
│    social posts)     │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│ 4. Image Agent       │
│   (Generates visual  │
│    concepts & art)   │
└──────────────────────┘
       │
       ▼
[ Final Output: Complete Campaign Package ]
```

## Project Structure

```
Campaign-AI/
├── backend/                  # Express.js Backend API
│   ├── controllers/          # Request handlers
│   ├── models/               # Mongoose data models
│   ├── routes/               # API routes
│   ├── utils/                # Helper functions & AI agents
│   └── server.ts             # Backend entry point
│
├── frontend/                 # Next.js Frontend Application
│   ├── components/           # Reusable React components
│   ├── pages/                # Next.js pages and API routes
│   ├── public/               # Static assets (images, fonts)
│   ├── styles/               # Tailwind CSS & global styles
│   └── utils/                # Frontend helper functions
│
├── .env.example              # Example environment variables
├── package.json              # Project dependencies & scripts
└── README.md                 # Project documentation
```

## Tech Stack Details

| Category | Technology |
|----------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Lottie |
| Backend | Node.js, Express.js |
| AI Engine | Google Gemini API |
| Database & Auth | Firebase (User Authentication), MongoDB with Mongoose |
| Utilities | EmailJS (Contact Form) |

## Getting Started

Follow these steps to set up and run Campaign AI on your local machine.

### Prerequisites

- Node.js (v18 or later) and npm
- Google Cloud project with the Gemini API enabled
- Firebase project for user authentication
- MongoDB database instance (local or cloud-hosted via Atlas)

### Installation & Setup

1. Clone the Repository:

```bash
git clone https://github.com/yourusername/campaign-ai.git
cd campaign-ai
```

2. Install Dependencies:

This will install dependencies for both the frontend and backend.

```bash
npm install
```

3. Configure Environment Variables:

Create a `.env` file in the root directory and add the following keys. Use `.env.example` as a template.

```env
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# EmailJS
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

4. Run the Application:

You'll need two separate terminals to run the backend and frontend servers concurrently.

Terminal 1: Start the Backend Server

```bash
npm run backend
```

The backend API will now be running on `http://localhost:5000`.

Terminal 2: Start the Frontend Server

```bash
npm run frontend
```

Open your browser and navigate to `http://localhost:3000` to access Campaign AI.

## API Endpoints

### Authentication

```
POST /api/auth/register      # Register new user
POST /api/auth/login         # User login
GET  /api/auth/profile       # Get user profile
```

### Campaign Management

```
GET  /api/campaigns          # Get all campaigns
POST /api/campaigns          # Create new campaign
GET  /api/campaigns/:id      # Get specific campaign
PUT  /api/campaigns/:id      # Update campaign
DELETE /api/campaigns/:id    # Delete campaign
```

### AI Agents

```
POST /api/agents/research    # Run market research agent
POST /api/agents/strategy    # Run strategy agent
POST /api/agents/copywriting # Run copywriting agent
POST /api/agents/image       # Run image generation agent
```

## Deployment

### Backend Deployment

Deploy the backend to platforms like Railway, Render, or Heroku:

1. Set up environment variables on your hosting platform
2. Configure the start script to `node server.js` or `ts-node server.ts`
3. Deploy from your Git repository

### Frontend Deployment

Deploy the frontend to Vercel or Netlify:

1. Build the production bundle: `npm run build`
2. Deploy the `.next` or `out` folder
3. Configure environment variables as needed

## Testing

Run the test suite:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

Contributions are welcome! Feel free to open an issue to discuss a new feature or submit a pull request to improve Campaign AI.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

<div align="center">

Built with intelligence by the Campaign AI Team

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/campaign-ai?style=social)](https://github.com/yourusername/campaign-ai/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/yourusername/campaign-ai?style=social)](https://github.com/yourusername/campaign-ai/network/members)

</div