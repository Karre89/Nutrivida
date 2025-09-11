# NutriVida Setup Guide

## 🚀 Complete Setup Checklist

### ✅ Development Environment (COMPLETED)
- [x] Node.js project structure created
- [x] GitHub repository connected
- [x] Dependencies installed
- [x] Supabase configuration files created
- [x] Database schema designed and deployed

### ✅ Database Setup (COMPLETED)
- [x] Supabase project created and configured
- [x] Database schema deployed successfully
- [x] Sample cultural foods data loaded
- [x] Row Level Security (RLS) policies configured
- [x] Database connection tested and working

### ✅ Backend API Development (COMPLETED)
- [x] Authentication routes (`/api/auth`)
  - User signup, signin, signout
  - Password reset functionality
  - JWT token management
  - Email verification flow
- [x] User management routes (`/api/users`)
  - Profile management
  - Health profile creation/updates
  - Progress tracking
  - Dashboard data endpoint
- [x] Meal plan routes (`/api/mealplans`)
  - AI-powered meal plan generation
  - Cultural food database integration
  - Shopping list generation
  - Meal plan management
- [x] Quiz routes (`/api/quiz`)
  - Lead capture and conversion tracking
  - Personalized recommendations
  - Analytics endpoints
- [x] OpenAI integration service
  - Culturally-adapted meal plan generation
  - Fallback system for reliability
  - Cost tracking and optimization

### ✅ Server Configuration (COMPLETED)
- [x] Express.js server setup with security middleware
- [x] CORS configuration for frontend integration
- [x] Rate limiting and error handling
- [x] Environment variable management
- [x] Health check endpoint
- [x] All routes integrated and tested

### 🔄 Current Status: Ready for Frontend Development

#### Server Information:
- **URL**: http://localhost:3002
- **Health Check**: http://localhost:3002/health
- **Environment**: Development
- **Database**: Connected to Supabase

#### Available API Endpoints:
```
Authentication:
POST   /api/auth/signup          - Create new user account
POST   /api/auth/signin          - Sign in with credentials
POST   /api/auth/signout         - Sign out user
POST   /api/auth/reset-password  - Send password reset email
GET    /api/auth/me              - Get current user info

User Management:
GET    /api/users/profile        - Get user profile
PUT    /api/users/profile        - Update user profile
POST   /api/users/health-profile - Create/update health profile
GET    /api/users/progress       - Get progress entries
POST   /api/users/progress       - Add progress entry
GET    /api/users/dashboard      - Get dashboard data

Meal Plans:
POST   /api/mealplans/generate   - Generate AI meal plan
GET    /api/mealplans            - Get user's meal plans
GET    /api/mealplans/active     - Get active meal plan
GET    /api/mealplans/:id        - Get specific meal plan
POST   /api/mealplans/preview    - Generate preview (no subscription required)

Quiz & Lead Capture:
POST   /api/quiz/submit          - Submit health assessment quiz
GET    /api/quiz/response/:email - Get quiz response by email
POST   /api/quiz/track-conversion - Track conversion to paid
GET    /api/quiz/analytics       - Get conversion analytics
```

## 🔧 Troubleshooting

### Common Issues:
1. **"Project creation failed"**: Try different region or wait a few minutes
2. **"Can't find API keys"**: Make sure project is fully created (green status)
3. **"Schema errors"**: Check that you're in the SQL Editor, not Table Editor

### Getting Help:
- Supabase docs: https://supabase.com/docs
- Join Supabase Discord: https://discord.supabase.com
- NutriVida GitHub Issues: https://github.com/Karre89/Nutrivida/issues

## 📝 Notes
- Free tier includes: 500MB database, 2GB bandwidth/month
- No credit card required for free tier
- Database password is only shown once - save it!
- All API keys are found in Settings → API