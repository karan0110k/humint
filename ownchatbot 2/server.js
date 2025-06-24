const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Check required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found, using local MongoDB');
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/humint', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
// Chat route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('📩 Received message:', message);

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Generate content with Gemini
    console.log('🤖 Generating response...');
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = await response.text();

    console.log('✅ AI Response:', text);

    res.json({ response: text });
  } catch (error) {
    console.error('❌ Error in chat:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Start server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});