# NutriVida - Culture-First Health Platform

NutriVida is a culturally-adaptive health platform that provides AI-powered, personalized meal plans and nutrition guidance tailored to users' cultural backgrounds and health goals.

## 🌍 Mission

Helping people from diverse backgrounds achieve better health outcomes without abandoning their cultural food heritage.

## 🎯 Target Market

Adults 25-55 from Latino, Somali, South Asian, Mediterranean, Caribbean, and Middle Eastern backgrounds who want to improve their health while maintaining their cultural food identity.

## ⚡ Key Features

- **Cultural Health Assessment**: Interactive quiz capturing background, goals, and preferences
- **AI Meal Plan Generation**: 7-day culturally-adapted meal plans with authentic recipes
- **Progress Tracking**: Weight, blood sugar, energy, and mood monitoring
- **Subscription Management**: Tiered access with automatic billing

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh token rotation
- **AI Integration**: OpenAI GPT-4 for meal plan generation
- **Payments**: Stripe for subscription management
- **Email**: SendGrid for automated communications

### Frontend
- **Framework**: React.js with responsive design
- **Styling**: Tailwind CSS with cultural theming
- **State Management**: Context API + useReducer
- **Internationalization**: React-i18next for multi-language support

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- OpenAI API key
- Stripe account (test mode)
- SendGrid account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nutrivida
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then fill in your actual API keys and configuration values.

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
nutrivida/
├── server.js                 # Main server entry point
├── config/                   # Configuration files
│   ├── database.js          # MongoDB connection
│   ├── auth.js              # JWT configuration
│   └── openai.js            # OpenAI client setup
├── models/                   # MongoDB schemas
│   ├── User.js              # User model
│   ├── HealthProfile.js     # Health profile model
│   ├── MealPlan.js          # Meal plan model
│   └── Progress.js          # Progress tracking model
├── routes/                   # API routes
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── mealplans.js         # Meal plan generation
│   ├── progress.js          # Progress tracking
│   └── payments.js          # Stripe integration
├── middleware/               # Custom middleware
│   ├── auth.js              # JWT verification
│   ├── validation.js        # Request validation
│   └── errorHandler.js      # Error handling
├── services/                 # Business logic
│   ├── mealPlanGenerator.js # AI meal plan creation
│   ├── emailService.js      # Email automation
│   └── stripeService.js     # Payment processing
├── utils/                    # Utility functions
│   ├── culturalData.js      # Cultural food databases
│   ├── nutritionCalc.js     # Nutrition calculations
│   └── helpers.js           # General helpers
├── public/                   # Static frontend files
└── tests/                    # Test files
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Environment Setup
- **Development**: Local development with hot reload
- **Production**: AWS/Heroku with MongoDB Atlas

### Environment Variables
See `.env.example` for required configuration variables.

## 📊 Success Metrics

- **User Engagement**: 70% completion rate for 7-day programs
- **Health Outcomes**: 60% improvement in primary health goals
- **Cultural Authenticity**: 4.0+ star rating from users
- **Revenue Target**: $10K MRR within 6 months

## 🤝 Contributing

This is currently a solo development project. For questions or suggestions, please open an issue.

## 📄 License

MIT License - see LICENSE file for details.

## 🌟 Cultural Commitment

NutriVida is committed to authentic representation of cultural foods and traditions. We work with cultural nutrition experts and community feedback to ensure our meal plans respect and honor diverse food heritage.