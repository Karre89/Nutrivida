const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { 
  getUserProfile, 
  createHealthProfile, 
  updateHealthProfile,
  addProgressEntry,
  getUserProgress,
  getUserMealPlans
} = require('../utils/supabaseHelpers');
const { 
  authenticateUser, 
  requireOnboarding,
  requireEmailVerification 
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateUser);

// Validation middleware
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('culturalBackground')
    .optional()
    .isIn(['latino', 'somali', 'south_asian', 'mediterranean', 'caribbean', 'middle_eastern'])
    .withMessage('Please select a valid cultural background'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string')
];

const validateHealthProfile = [
  body('primaryGoal')
    .isIn(['blood_sugar_control', 'weight_loss', 'energy_boost', 'glp1_support', 'general_health'])
    .withMessage('Please select a valid primary health goal'),
  body('secondaryGoals')
    .optional()
    .isArray()
    .withMessage('Secondary goals must be an array'),
  body('dietaryRestrictions')
    .optional()
    .isArray()
    .withMessage('Dietary restrictions must be an array'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('familySize')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Family size must be between 1 and 20'),
  body('cookingTimePreference')
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage('Cooking time preference must be between 5 and 180 minutes'),
  body('activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .withMessage('Please select a valid activity level'),
  body('currentWeight')
    .optional()
    .isFloat({ min: 50, max: 500 })
    .withMessage('Current weight must be between 50 and 500'),
  body('targetWeight')
    .optional()
    .isFloat({ min: 50, max: 500 })
    .withMessage('Target weight must be between 50 and 500'),
  body('heightFeet')
    .optional()
    .isInt({ min: 3, max: 8 })
    .withMessage('Height (feet) must be between 3 and 8'),
  body('heightInches')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Height (inches) must be between 0 and 11'),
  body('bloodSugarGoal')
    .optional()
    .isFloat({ min: 70, max: 200 })
    .withMessage('Blood sugar goal must be between 70 and 200'),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'es'])
    .withMessage('Please select a valid language (en or es)')
];

const validateProgressEntry = [
  body('entryDate')
    .isISO8601()
    .withMessage('Entry date must be a valid date'),
  body('weight')
    .optional()
    .isFloat({ min: 50, max: 500 })
    .withMessage('Weight must be between 50 and 500'),
  body('bloodSugarMorning')
    .optional()
    .isFloat({ min: 40, max: 400 })
    .withMessage('Morning blood sugar must be between 40 and 400'),
  body('bloodSugarEvening')
    .optional()
    .isFloat({ min: 40, max: 400 })
    .withMessage('Evening blood sugar must be between 40 and 400'),
  body('energyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Energy level must be between 1 and 10'),
  body('moodRating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood rating must be between 1 and 10'),
  body('mealSatisfaction')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Meal satisfaction must be between 1 and 5'),
  body('culturalAuthenticityRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cultural authenticity rating must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
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
 * GET /api/users/profile
 * Get current user's complete profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      profile: userProfile
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile information
 */
router.put('/profile', validateProfileUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { fullName, culturalBackground, age, timezone } = req.body;
    
    const supabase = require('../config/supabase').getSupabase();
    
    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (culturalBackground !== undefined) updateData.cultural_background = culturalBackground;
    if (age !== undefined) updateData.age = age;
    if (timezone !== undefined) updateData.timezone = timezone;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/users/health-profile
 * Create or update health profile
 */
router.post('/health-profile', validateHealthProfile, handleValidationErrors, async (req, res) => {
  try {
    const healthData = {
      primary_goal: req.body.primaryGoal,
      secondary_goals: req.body.secondaryGoals || [],
      dietary_restrictions: req.body.dietaryRestrictions || [],
      allergies: req.body.allergies || [],
      family_size: req.body.familySize || 1,
      cooking_time_preference: req.body.cookingTimePreference || 30,
      activity_level: req.body.activityLevel || 'moderate',
      current_weight: req.body.currentWeight || null,
      target_weight: req.body.targetWeight || null,
      height_feet: req.body.heightFeet || null,
      height_inches: req.body.heightInches || null,
      blood_sugar_goal: req.body.bloodSugarGoal || null,
      preferred_language: req.body.preferredLanguage || 'en'
    };
    
    // Check if health profile already exists
    const supabase = require('../config/supabase').getSupabase();
    const { data: existing, error: checkError } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();
    
    let result;
    if (existing && !checkError) {
      // Update existing profile
      result = await updateHealthProfile(req.userId, healthData);
    } else {
      // Create new profile
      result = await createHealthProfile(req.userId, healthData);
    }
    
    // Mark user as onboarded if this is their first health profile
    if (!existing) {
      await supabase
        .from('users')
        .update({ is_onboarded: true })
        .eq('id', req.userId);
    }
    
    res.json({
      success: true,
      message: existing ? 'Health profile updated successfully' : 'Health profile created successfully',
      healthProfile: result
    });
    
  } catch (error) {
    console.error('Health profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save health profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/health-profile
 * Get user's health profile
 */
router.get('/health-profile', async (req, res) => {
  try {
    const supabase = require('../config/supabase').getSupabase();
    
    const { data: healthProfile, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (!healthProfile) {
      return res.status(404).json({
        success: false,
        message: 'Health profile not found'
      });
    }
    
    res.json({
      success: true,
      healthProfile
    });
    
  } catch (error) {
    console.error('Get health profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/users/progress
 * Add a new progress entry
 */
router.post('/progress', requireOnboarding, validateProgressEntry, handleValidationErrors, async (req, res) => {
  try {
    const progressData = {
      entry_date: req.body.entryDate,
      weight: req.body.weight || null,
      blood_sugar_morning: req.body.bloodSugarMorning || null,
      blood_sugar_evening: req.body.bloodSugarEvening || null,
      energy_level: req.body.energyLevel || null,
      mood_rating: req.body.moodRating || null,
      progress_photo_url: req.body.progressPhotoUrl || null,
      notes: req.body.notes || null,
      meal_satisfaction: req.body.mealSatisfaction || null,
      cultural_authenticity_rating: req.body.culturalAuthenticityRating || null
    };
    
    const result = await addProgressEntry(req.userId, progressData);
    
    res.status(201).json({
      success: true,
      message: 'Progress entry added successfully',
      progressEntry: result
    });
    
  } catch (error) {
    console.error('Add progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add progress entry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/progress
 * Get user's progress entries
 */
router.get('/progress', requireOnboarding, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const progressEntries = await getUserProgress(req.userId, days);
    
    res.json({
      success: true,
      progressEntries,
      totalEntries: progressEntries.length
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress entries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/meal-plans
 * Get user's meal plans
 */
router.get('/meal-plans', requireOnboarding, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const mealPlans = await getUserMealPlans(req.userId, limit);
    
    res.json({
      success: true,
      mealPlans,
      totalPlans: mealPlans.length
    });
    
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/dashboard
 * Get dashboard data (summary of user's information)
 */
router.get('/dashboard', requireOnboarding, async (req, res) => {
  try {
    // Get user profile with health profile
    const userProfile = await getUserProfile(req.userId);
    
    // Get recent progress (last 7 days)
    const recentProgress = await getUserProgress(req.userId, 7);
    
    // Get active meal plan
    const supabase = require('../config/supabase').getSupabase();
    const { data: activeMealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Get subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .single();
    
    // Calculate progress summary
    const progressSummary = {
      totalEntries: recentProgress.length,
      averageWeight: recentProgress.length > 0 ? 
        recentProgress
          .filter(p => p.weight)
          .reduce((sum, p) => sum + p.weight, 0) / recentProgress.filter(p => p.weight).length || null : null,
      averageEnergyLevel: recentProgress.length > 0 ?
        recentProgress
          .filter(p => p.energy_level)
          .reduce((sum, p) => sum + p.energy_level, 0) / recentProgress.filter(p => p.energy_level).length || null : null,
      averageMoodRating: recentProgress.length > 0 ?
        recentProgress
          .filter(p => p.mood_rating)
          .reduce((sum, p) => sum + p.mood_rating, 0) / recentProgress.filter(p => p.mood_rating).length || null : null
    };
    
    res.json({
      success: true,
      dashboard: {
        user: userProfile,
        activeMealPlan: activeMealPlan || null,
        subscription: subscription || null,
        recentProgress,
        progressSummary,
        hasActiveSubscription: !!subscription,
        hasActiveMealPlan: !!activeMealPlan
      }
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/users/account
 * Delete user account (soft delete)
 */
router.delete('/account', requireEmailVerification, async (req, res) => {
  try {
    const { confirmDelete } = req.body;
    
    if (confirmDelete !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm account deletion by sending confirmDelete: "DELETE_MY_ACCOUNT"'
      });
    }
    
    // This would typically be a soft delete in production
    // For now, we'll just cancel any active subscriptions
    const supabase = require('../config/supabase').getSupabase();
    
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', req.userId);
    
    res.json({
      success: true,
      message: 'Account deletion initiated. Your data will be removed according to our privacy policy.'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;