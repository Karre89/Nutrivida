const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const AIMealPlanService = require('../services/aiMealPlanService');
const { 
  createMealPlan,
  getUserMealPlans,
  getActiveMealPlan,
  getUserProfile
} = require('../utils/supabaseHelpers');
const { 
  authenticateUser, 
  requireOnboarding,
  requireActiveSubscription 
} = require('../middleware/auth');

const router = express.Router();

// Initialize AI meal plan service
const aiMealPlanService = new AIMealPlanService();

// Apply authentication to all meal plan routes
router.use(authenticateUser);

// Validation middleware
const validateMealPlanGeneration = [
  body('duration')
    .optional()
    .isInt({ min: 3, max: 30 })
    .withMessage('Duration must be between 3 and 30 days'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('culturalTheme')
    .optional()
    .isIn(['latino', 'somali', 'south_asian', 'mediterranean', 'caribbean', 'middle_eastern'])
    .withMessage('Please select a valid cultural theme'),
  body('planName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters')
];

const validateMealPlanUpdate = [
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('planName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters')
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
 * POST /api/mealplans/generate
 * Generate a new AI-powered meal plan
 */
router.post('/generate', requireOnboarding, requireActiveSubscription, validateMealPlanGeneration, handleValidationErrors, async (req, res) => {
  try {
    const { 
      duration = 7, 
      startDate, 
      culturalTheme, 
      planName,
      dietaryRestrictions = [],
      allergies = [],
      cookingSkillLevel = 'intermediate',
      timeAvailable = 'moderate',
      budgetLevel = 'moderate',
      familySize = 1
    } = req.body;
    
    // Get user profile
    const userProfile = await getUserProfile(req.userId);
    
    // Get user's quiz response for detailed preferences
    const supabase = require('../config/supabase').getSupabase();
    const { data: quizResponse } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Use cultural theme from request, quiz, or user profile
    const effectiveCulturalTheme = culturalTheme || 
                                  quizResponse?.cultural_background || 
                                  userProfile.cultural_background;
    
    if (!effectiveCulturalTheme) {
      return res.status(400).json({
        success: false,
        message: 'Cultural background is required to generate meal plans'
      });
    }

    // Extract primary goal from quiz or default to general health
    const primaryGoal = quizResponse?.primary_goal || 'general_health';
    
    // Build comprehensive user profile for AI generation
    const aiUserProfile = {
      culturalBackground: effectiveCulturalTheme,
      primaryGoal: primaryGoal,
      dietaryRestrictions,
      allergies,
      cookingSkillLevel,
      timeAvailable,
      budgetLevel,
      familySize,
      age: userProfile.age || quizResponse?.responses?.age,
      gender: userProfile.gender || quizResponse?.responses?.gender,
      activityLevel: quizResponse?.responses?.activityLevel || 'moderate',
      // Additional quiz data if available
      ...(quizResponse?.responses && typeof quizResponse.responses === 'object' ? quizResponse.responses : {})
    };
    
    let mealPlanData;
    let generationMethod = 'ai';
    const startTime = Date.now();
    
    try {
      // Generate with our new AI service
      mealPlanData = await aiMealPlanService.generateMealPlan(aiUserProfile);
      generationMethod = 'ai';
    } catch (openaiError) {
      console.warn('AI generation failed, using fallback:', openaiError.message);
      
      // Fallback to service's built-in fallback
      const culturalInfo = aiMealPlanService.constructor.prototype.constructor.CULTURAL_FOODS?.[effectiveCulturalTheme];
      const healthGoals = aiMealPlanService.constructor.prototype.constructor.HEALTH_GOALS?.[primaryGoal];
      
      if (culturalInfo && healthGoals) {
        mealPlanData = aiMealPlanService.generateFallbackMealPlan(culturalInfo, healthGoals);
      } else {
        // Ultimate fallback - basic meal plan structure
        mealPlanData = {
          week: {},
          shoppingList: { proteins: [], vegetables: [], grains: [], spices: [], other: [] },
          weeklyNutrition: { avgCaloriesPerDay: 1800, avgMacros: { protein: '25%', carbs: '45%', fat: '30%' }},
          culturalInsights: 'Basic meal plan generated',
          tips: ['Stay hydrated', 'Listen to your body']
        };
        
        // Generate basic daily structure
        for (let day = 1; day <= 7; day++) {
          mealPlanData.week[`day${day}`] = {
            date: `Day ${day}`,
            breakfast: { name: 'Healthy Breakfast', description: 'Nutritious start to your day' },
            lunch: { name: 'Balanced Lunch', description: 'Midday fuel' },
            dinner: { name: 'Complete Dinner', description: 'Evening nourishment' },
            snack: { name: 'Healthy Snack', description: 'Light snack' }
          };
        }
      }
      generationMethod = 'fallback';
    }
    
    const generationTime = Date.now() - startTime;
    
    // Deactivate any current active meal plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', req.userId)
      .eq('is_active', true);
    
    // Save the meal plan to database
    const mealPlan = await createMealPlan(req.userId, {
      plan_name: planName || `${effectiveCulturalTheme} ${primaryGoal.replace('_', ' ')} Plan - ${new Date().toLocaleDateString()}`,
      cultural_theme: effectiveCulturalTheme,
      duration_days: duration,
      start_date: startDate || new Date().toISOString().split('T')[0],
      is_active: true,
      meals: mealPlanData.week || mealPlanData.meals || {},
      shopping_list: mealPlanData.shoppingList || mealPlanData.shopping_list || {},
      cultural_tips: mealPlanData.tips || mealPlanData.cultural_tips || [],
      nutritional_summary: mealPlanData.weeklyNutrition || mealPlanData.nutritional_summary || {},
      openai_cost: 0, // We'll calculate this later if needed
      generation_time_ms: generationTime,
      prompt_version: 'v2.0-ai-service',
      generation_metadata: mealPlanData.metadata || {}
    });
    
    res.status(201).json({
      success: true,
      message: `Meal plan generated successfully using ${generationMethod === 'ai' ? 'AI' : 'fallback method'}`,
      mealPlan: {
        ...mealPlan,
        generation_method: generationMethod,
        cultural_insights: mealPlanData.culturalInsights
      }
    });
    
  } catch (error) {
    console.error('Generate meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/mealplans
 * Get user's meal plans with pagination
 */
router.get('/', requireOnboarding, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const supabase = require('../config/supabase').getSupabase();
    
    // Get meal plans with pagination
    const { data: mealPlans, error, count } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      mealPlans,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > offset + limit
      }
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
 * GET /api/mealplans/active
 * Get user's currently active meal plan
 */
router.get('/active', requireOnboarding, async (req, res) => {
  try {
    const activeMealPlan = await getActiveMealPlan(req.userId);
    
    if (!activeMealPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active meal plan found'
      });
    }
    
    res.json({
      success: true,
      mealPlan: activeMealPlan
    });
    
  } catch (error) {
    console.error('Get active meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/mealplans/:id
 * Get a specific meal plan by ID
 */
router.get('/:id', requireOnboarding, async (req, res) => {
  try {
    const mealPlanId = req.params.id;
    
    const supabase = require('../config/supabase').getSupabase();
    
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .eq('user_id', req.userId) // Ensure user owns this meal plan
      .single();
    
    if (error || !mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }
    
    res.json({
      success: true,
      mealPlan
    });
    
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/mealplans/:id
 * Update a meal plan
 */
router.put('/:id', requireOnboarding, validateMealPlanUpdate, handleValidationErrors, async (req, res) => {
  try {
    const mealPlanId = req.params.id;
    const { isActive, planName } = req.body;
    
    const supabase = require('../config/supabase').getSupabase();
    
    // Build update data
    const updateData = {};
    if (isActive !== undefined) updateData.is_active = isActive;
    if (planName !== undefined) updateData.plan_name = planName;
    
    // If setting this plan as active, deactivate other plans
    if (isActive === true) {
      await supabase
        .from('meal_plans')
        .update({ is_active: false })
        .eq('user_id', req.userId)
        .eq('is_active', true);
    }
    
    const { data: updatedMealPlan, error } = await supabase
      .from('meal_plans')
      .update(updateData)
      .eq('id', mealPlanId)
      .eq('user_id', req.userId) // Ensure user owns this meal plan
      .select()
      .single();
    
    if (error || !updatedMealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or update failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      mealPlan: updatedMealPlan
    });
    
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/mealplans/:id
 * Delete a meal plan
 */
router.delete('/:id', requireOnboarding, async (req, res) => {
  try {
    const mealPlanId = req.params.id;
    
    const supabase = require('../config/supabase').getSupabase();
    
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)
      .eq('user_id', req.userId); // Ensure user owns this meal plan
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/mealplans/:id/shopping-list
 * Get shopping list for a specific meal plan
 */
router.get('/:id/shopping-list', requireOnboarding, async (req, res) => {
  try {
    const mealPlanId = req.params.id;
    
    const supabase = require('../config/supabase').getSupabase();
    
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .select('shopping_list, plan_name')
      .eq('id', mealPlanId)
      .eq('user_id', req.userId)
      .single();
    
    if (error || !mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }
    
    res.json({
      success: true,
      shoppingList: mealPlan.shopping_list,
      planName: mealPlan.plan_name
    });
    
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shopping list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/mealplans/generate-from-quiz
 * Generate a meal plan directly from quiz data (public endpoint for demos)
 */
router.post('/generate-from-quiz', async (req, res) => {
  try {
    const { 
      culturalBackground, 
      primaryGoal, 
      responses = {},
      generatePreview = false 
    } = req.body;
    
    if (!culturalBackground || !primaryGoal) {
      return res.status(400).json({
        success: false,
        message: 'Cultural background and primary goal are required'
      });
    }
    
    // Build user profile from quiz data
    const aiUserProfile = {
      culturalBackground,
      primaryGoal,
      dietaryRestrictions: responses.dietaryRestrictions || [],
      allergies: responses.allergies || [],
      cookingSkillLevel: responses.cookingSkillLevel || 'intermediate',
      timeAvailable: responses.timeAvailable || 'moderate',
      budgetLevel: responses.budgetLevel || 'moderate',
      familySize: responses.familySize || 1,
      age: responses.age,
      gender: responses.gender,
      activityLevel: responses.activityLevel || 'moderate'
    };
    
    let mealPlanData;
    let generationMethod = 'ai';
    
    try {
      // Generate with AI service
      mealPlanData = await aiMealPlanService.generateMealPlan(aiUserProfile);
      
      // If it's a preview request, limit the data
      if (generatePreview) {
        const previewDays = Object.keys(mealPlanData.week).slice(0, 3);
        const previewWeek = {};
        previewDays.forEach(day => {
          previewWeek[day] = mealPlanData.week[day];
        });
        
        mealPlanData = {
          ...mealPlanData,
          week: previewWeek,
          tips: mealPlanData.tips?.slice(0, 3),
          isPreview: true,
          upgradeMessage: 'Subscribe to get full 7-day meal plans with shopping lists and cultural insights'
        };
      }
      
    } catch (openaiError) {
      console.warn('AI generation failed, using fallback:', openaiError.message);
      generationMethod = 'fallback';
      
      // Use fallback
      const culturalInfo = { 
        name: culturalBackground,
        staples: ['rice', 'vegetables', 'protein'],
        spices: ['salt', 'pepper', 'herbs'] 
      };
      const healthGoals = { focus: primaryGoal, macroBalance: { carbs: '45%', protein: '25%', fats: '30%' }};
      
      mealPlanData = aiMealPlanService.generateFallbackMealPlan(culturalInfo, healthGoals);
    }
    
    res.json({
      success: true,
      message: `Meal plan generated successfully using ${generationMethod}`,
      mealPlan: mealPlanData,
      generationMethod,
      culturalBackground,
      primaryGoal
    });
    
  } catch (error) {
    console.error('Generate from quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate meal plan from quiz data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/mealplans/:id/regenerate-meal
 * Regenerate a specific meal in an existing meal plan
 */
router.post('/:id/regenerate-meal', requireOnboarding, requireActiveSubscription, async (req, res) => {
  try {
    const { id: mealPlanId } = req.params;
    const { mealType, dayNumber } = req.body; // e.g., mealType: 'breakfast', dayNumber: 1
    
    if (!mealType || !dayNumber) {
      return res.status(400).json({
        success: false,
        message: 'Meal type and day number are required'
      });
    }
    
    // Get the meal plan to access user profile
    const supabase = require('../config/supabase').getSupabase();
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .eq('user_id', req.userId)
      .single();
      
    if (mealPlanError || !mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }
    
    // Get user profile and quiz data
    const userProfile = await getUserProfile(req.userId);
    const { data: quizResponse } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Build AI user profile
    const aiUserProfile = {
      culturalBackground: mealPlan.cultural_theme,
      primaryGoal: quizResponse?.primary_goal || 'general_health',
      dietaryRestrictions: quizResponse?.responses?.dietaryRestrictions || [],
      allergies: quizResponse?.responses?.allergies || [],
      cookingSkillLevel: quizResponse?.responses?.cookingSkillLevel || 'intermediate',
      timeAvailable: quizResponse?.responses?.timeAvailable || 'moderate',
      budgetLevel: quizResponse?.responses?.budgetLevel || 'moderate',
      familySize: quizResponse?.responses?.familySize || 1,
    };
    
    // Regenerate the specific meal
    const newMeal = await aiMealPlanService.regenerateMeal(
      mealType, 
      dayNumber, 
      aiUserProfile, 
      mealPlan.meals
    );
    
    // Update the meal plan in the database
    const dayKey = `day${dayNumber}`;
    const updatedMeals = { ...mealPlan.meals };
    if (updatedMeals[dayKey]) {
      updatedMeals[dayKey][mealType] = newMeal;
    }
    
    const { error: updateError } = await supabase
      .from('meal_plans')
      .update({ meals: updatedMeals })
      .eq('id', mealPlanId)
      .eq('user_id', req.userId);
      
    if (updateError) {
      throw new Error('Failed to update meal plan');
    }
    
    res.json({
      success: true,
      message: `${mealType} for ${dayKey} regenerated successfully`,
      newMeal,
      dayKey,
      mealType
    });
    
  } catch (error) {
    console.error('Regenerate meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate meal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/mealplans/preview
 * Generate a preview meal plan (without saving) for non-subscribers
 */
router.post('/preview', requireOnboarding, validateMealPlanGeneration, handleValidationErrors, async (req, res) => {
  try {
    const { culturalTheme } = req.body;
    
    // Get user profile for cultural background
    const userProfile = await getUserProfile(req.userId);
    const effectiveCulturalTheme = culturalTheme || userProfile.cultural_background;
    
    if (!effectiveCulturalTheme) {
      return res.status(400).json({
        success: false,
        message: 'Cultural background is required'
      });
    }
    
    // Create a basic health profile for preview
    const basicHealthProfile = {
      primary_goal: 'general_health',
      family_size: 1,
      cooking_time_preference: 30,
      activity_level: 'moderate'
    };
    
    // Generate a 3-day preview using fallback method
    const previewData = generateFallbackMealPlan(
      { ...userProfile, cultural_background: effectiveCulturalTheme },
      basicHealthProfile,
      { duration: 3 }
    );
    
    res.json({
      success: true,
      message: 'Preview meal plan generated',
      preview: {
        cultural_theme: effectiveCulturalTheme,
        duration_days: 3,
        meals: previewData.days.slice(0, 3), // Only show first 3 days
        cultural_tips: previewData.cultural_tips.slice(0, 2), // Limit tips
        nutritional_summary: previewData.nutritional_summary,
        is_preview: true,
        upgrade_message: 'Subscribe to get full 7-day meal plans with detailed recipes and shopping lists'
      }
    });
    
  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/mealplans/cultural-foods/:culturalBackground
 * Get available cultural foods for a specific background
 */
router.get('/cultural-foods/:culturalBackground', async (req, res) => {
  try {
    const { culturalBackground } = req.params;
    
    if (!['latino', 'somali', 'south_asian', 'mediterranean', 'caribbean', 'middle_eastern'].includes(culturalBackground)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cultural background'
      });
    }
    
    const { getCulturalFoods, getStapleFoods } = require('../utils/supabaseHelpers');
    
    const [culturalFoods, stapleFoods] = await Promise.all([
      getCulturalFoods(culturalBackground),
      getStapleFoods(culturalBackground)
    ]);
    
    res.json({
      success: true,
      culturalBackground,
      foods: {
        staples: stapleFoods,
        all: culturalFoods
      }
    });
    
  } catch (error) {
    console.error('Get cultural foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cultural foods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;