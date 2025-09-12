const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initSupabase, testConnection } = require('./config/supabase');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mealPlanRoutes = require('./routes/mealplans');
const quizRoutes = require('./routes/quiz');
const paymentRoutes = require('./routes/payments');
const emailRoutes = require('./routes/emails');
// const progressRoutes = require('./routes/progress');
// const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabase = initSupabase();

// Test database connection
testConnection();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:3001', 'https://nutrivida-hazel.vercel.app', 'https://nutrivida-m23ml2s61-karre89s-projects.vercel.app'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files - React build files and public assets
app.use(express.static('public'));
app.use('/static', express.static('static'));
app.use(express.static('.', { 
  index: false // Don't serve index.html as default, let API routes handle first
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'NutriVida API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
// app.use('/api/progress', progressRoutes);

// Serve React app for frontend routes (catch-all, must be after API routes)
app.get('*', (req, res) => {
  // Serve API response for /api routes
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.originalUrl 
    });
  }
  
  // Serve React app for all other routes
  res.sendFile('index.html', { root: __dirname });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NutriVida server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Supabase connection test successful`);
});

module.exports = app;