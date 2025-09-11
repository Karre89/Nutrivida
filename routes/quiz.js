const express = require('express');
const { body, validationResult } = require('express-validator');
const { saveQuizResponse, getQuizResponse } = require('../utils/supabaseHelpers');
const { optionalAuth } = require('../middleware/auth');
const EmailService = require('../services/emailService');

const router = express.Router();

// Initialize email service
const emailService = new EmailService();

// Validation middleware
const validateQuizResponse = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('culturalBackground')
    .isIn(['latino', 'somali', 'south_asian', 'mediterranean', 'caribbean', 'middle_eastern'])
    .withMessage('Please select a valid cultural background'),
  body('primaryGoal')
    .isIn(['blood_sugar_control', 'weight_loss', 'energy_boost', 'glp1_support', 'general_health'])
    .withMessage('Please select a valid primary health goal'),
  body('responses')
    .isObject()
    .withMessage('Quiz responses must be an object'),
  body('utmSource')
    .optional()
    .isString()
    .withMessage('UTM source must be a string'),
  body('utmMedium')
    .optional()
    .isString()
    .withMessage('UTM medium must be a string'),
  body('utmCampaign')
    .optional()
    .isString()
    .withMessage('UTM campaign must be a string'),
  body('referrer')
    .optional()
    .isString()
    .withMessage('Referrer must be a string')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * POST /api/quiz/submit
 * Submit quiz response for lead capture
 */
router.post('/submit', optionalAuth, validateQuizResponse, handleValidationErrors, async (req, res) => {
  try {
    const {
      email,
      culturalBackground,
      primaryGoal,
      responses,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer
    } = req.body;
    
    // Check if this email has already submitted a quiz recently
    try {
      const existingResponse = await getQuizResponse(email);
      if (existingResponse) {
        // Update existing response instead of creating new one
        const supabase = require('../config/supabase').getSupabase();
        
        const { data: updatedResponse, error } = await supabase
          .from('quiz_responses')
          .update({
            cultural_background: culturalBackground,
            primary_goal: primaryGoal,
            responses,
            utm_source: utmSource || null,
            utm_medium: utmMedium || null,
            utm_campaign: utmCampaign || null,
            referrer: referrer || null,
            user_id: req.userId || null
          })
          .eq('id', existingResponse.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating quiz response:', error);
        } else {
          return res.json({
            success: true,
            message: 'Quiz response updated successfully',
            quizResponse: updatedResponse,
            isUpdate: true
          });
        }
      }
    } catch (getError) {
      // No existing response found, continue with creating new one
      console.log('No existing quiz response found, creating new one');
    }
    
    // Create new quiz response
    const quizResponseData = {
      email,
      user_id: req.userId || null, // Link to user if authenticated
      cultural_background: culturalBackground,
      primary_goal: primaryGoal,
      responses,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      referrer: referrer || null,
      completed_signup: !!req.userId, // True if user is already authenticated
      converted_to_paid: false
    };
    
    const quizResponse = await saveQuizResponse(quizResponseData);
    
    // Generate personalized recommendations based on quiz
    const recommendations = generateRecommendations(culturalBackground, primaryGoal, responses);
    
    // Send welcome email asynchronously
    const fullName = extractFullNameFromResponses(responses) || 'Friend';
    emailService.sendWelcomeEmail(email, fullName, culturalBackground)
      .then(() => {
        console.log(`Welcome email sent successfully to ${email}`);
      })
      .catch((emailError) => {
        console.error(`Failed to send welcome email to ${email}:`, emailError);
      });
    
    // Schedule meal plan ready email for 10 minutes later (production would be hours)
    setTimeout(async () => {
      try {
        await emailService.sendMealPlanReady(email, fullName, culturalBackground);
        console.log(`Meal plan ready email sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send meal plan ready email to ${email}:`, emailError);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    res.status(201).json({
      success: true,
      message: 'Quiz completed successfully',
      quizResponse,
      recommendations,
      nextSteps: {
        signup: !req.userId ? 'Create your free account to get your personalized meal plan' : null,
        subscribe: 'Subscribe to unlock full 7-day meal plans and shopping lists',
        preview: 'Get a preview of your culturally-adapted meal plan'
      }
    });
    
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/quiz/response/:email
 * Get quiz response by email (for pre-filling forms)
 */
router.get('/response/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }
    
    const quizResponse = await getQuizResponse(email);
    
    if (!quizResponse) {
      return res.status(404).json({
        success: false,
        message: 'No quiz response found for this email'
      });
    }
    
    // Only return safe data (no sensitive information)
    res.json({
      success: true,
      quizResponse: {
        cultural_background: quizResponse.cultural_background,
        primary_goal: quizResponse.primary_goal,
        responses: quizResponse.responses,
        completed_signup: quizResponse.completed_signup,
        created_at: quizResponse.created_at
      }
    });
    
  } catch (error) {
    console.error('Get quiz response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/quiz/track-conversion
 * Track when a quiz respondent converts to paid
 */
router.post('/track-conversion', optionalAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const supabase = require('../config/supabase').getSupabase();
    
    const { data: updatedResponse, error } = await supabase
      .from('quiz_responses')
      .update({
        converted_to_paid: true,
        conversion_date: new Date().toISOString(),
        user_id: req.userId || null
      })
      .eq('email', email)
      .select()
      .single();
    
    if (error) {
      console.error('Track conversion error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to track conversion'
      });
    }
    
    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      quizResponse: updatedResponse
    });
    
  } catch (error) {
    console.error('Track conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track conversion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/quiz/track-signup
 * Track when a quiz respondent signs up
 */
router.post('/track-signup', optionalAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const supabase = require('../config/supabase').getSupabase();
    
    const { data: updatedResponse, error } = await supabase
      .from('quiz_responses')
      .update({
        completed_signup: true,
        user_id: req.userId || null
      })
      .eq('email', email)
      .select()
      .single();
    
    if (error) {
      console.error('Track signup error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to track signup'
      });
    }
    
    res.json({
      success: true,
      message: 'Signup tracked successfully',
      quizResponse: updatedResponse
    });
    
  } catch (error) {
    console.error('Track signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/quiz/analytics
 * Get conversion analytics (admin endpoint)
 */
router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const { getConversionMetrics } = require('../utils/supabaseHelpers');
    const metrics = await getConversionMetrics(days);
    
    res.json({
      success: true,
      analytics: metrics,
      period: `${days} days`
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to extract full name from quiz responses
 */
const extractFullNameFromResponses = (responses) => {
  if (!responses || typeof responses !== 'object') return null;
  
  // Check various possible field names for the user's name
  const nameFields = ['fullName', 'full_name', 'name', 'firstName', 'first_name'];
  
  for (const field of nameFields) {
    if (responses[field] && typeof responses[field] === 'string') {
      return responses[field].trim();
    }
  }
  
  // Try to combine first and last name if separate
  const firstName = responses.firstName || responses.first_name;
  const lastName = responses.lastName || responses.last_name;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  if (firstName) {
    return firstName.trim();
  }
  
  return null;
};

/**
 * Helper function to generate personalized recommendations
 */
const generateRecommendations = (culturalBackground, primaryGoal, responses) => {
  const culturalRecommendations = {
    latino: {
      foods: ['Black beans', 'Brown rice', 'Avocados', 'Tomatoes', 'Cilantro', 'Lime'],
      tips: ['Use beans as your main protein source', 'Season with cumin and chili', 'Include fresh salsas']
    },
    somali: {
      foods: ['Lentils', 'Injera', 'Berbere spice', 'Goat meat', 'Dates', 'Tea'],
      tips: ['Ferment grains for better nutrition', 'Use berbere for antioxidants', 'Include traditional stews']
    },
    south_asian: {
      foods: ['Basmati rice', 'Turmeric', 'Lentils', 'Yogurt', 'Ginger', 'Garlic'],
      tips: ['Use turmeric for anti-inflammation', 'Include fermented foods', 'Prepare spice blends fresh']
    },
    mediterranean: {
      foods: ['Olive oil', 'Tomatoes', 'Fish', 'Herbs', 'Legumes', 'Whole grains'],
      tips: ['Use olive oil as main fat', 'Include fatty fish twice weekly', 'Eat seasonally']
    },
    caribbean: {
      foods: ['Plantains', 'Yuca', 'Black beans', 'Tropical fruits', 'Fish', 'Coconut'],
      tips: ['Use coconut oil for cooking', 'Include tropical fruits', 'Prepare jerk seasonings']
    },
    middle_eastern: {
      foods: ['Tahini', 'Dates', 'Lamb', 'Bulgur', 'Nuts', 'Olive oil'],
      tips: ['Use tahini for calcium', 'Include nuts and seeds', 'Prepare mezze-style meals']
    }
  };
  
  const goalRecommendations = {
    blood_sugar_control: {
      focus: 'Stable blood sugar through balanced meals',
      tips: ['Combine proteins with carbs', 'Include fiber-rich foods', 'Eat regular meals']
    },
    weight_loss: {
      focus: 'Sustainable weight management',
      tips: ['Control portion sizes', 'Include protein at every meal', 'Stay hydrated']
    },
    energy_boost: {
      focus: 'Sustained energy throughout the day',
      tips: ['Eat complex carbohydrates', 'Include iron-rich foods', 'Avoid sugar crashes']
    },
    glp1_support: {
      focus: 'Supporting GLP-1 medication effects',
      tips: ['Eat smaller, frequent meals', 'Focus on protein', 'Stay well hydrated']
    },
    general_health: {
      focus: 'Overall wellness and nutrition',
      tips: ['Eat variety of colors', 'Include all food groups', 'Practice moderation']
    }
  };
  
  return {
    cultural: culturalRecommendations[culturalBackground] || culturalRecommendations.latino,
    health: goalRecommendations[primaryGoal] || goalRecommendations.general_health,
    personalized: `Based on your ${culturalBackground} background and ${primaryGoal.replace('_', ' ')} goal, we recommend focusing on traditional ingredients with modern nutrition science.`
  };
};

module.exports = router;