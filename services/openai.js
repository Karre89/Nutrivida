const OpenAI = require('openai');
const { getCulturalFoods, getStapleFoods } = require('../utils/supabaseHelpers');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate a culturally-adapted meal plan using OpenAI
 */
const generateMealPlan = async (userProfile, healthProfile, options = {}) => {
  try {
    console.log(`🤖 Generating meal plan for ${userProfile.cultural_background} cuisine...`);
    
    const startTime = Date.now();
    
    // Get cultural foods for this background
    const culturalFoods = await getCulturalFoods(userProfile.cultural_background);
    const stapleFoods = await getStapleFoods(userProfile.cultural_background);
    
    // Build the prompt based on user data
    const prompt = await buildMealPlanPrompt(userProfile, healthProfile, culturalFoods, stapleFoods, options);
    
    // Generate meal plan with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(userProfile.cultural_background)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });
    
    const generationTime = Date.now() - startTime;
    const rawContent = response.choices[0].message.content;
    
    // Parse the JSON response
    let mealPlan;
    try {
      mealPlan = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid meal plan format received from AI');
    }
    
    // Validate the meal plan structure
    const validatedMealPlan = validateMealPlanStructure(mealPlan);
    
    // Generate shopping list
    const shoppingList = generateShoppingList(validatedMealPlan);
    
    // Calculate cost estimation
    const costEstimate = calculateOpenAICost(response.usage);
    
    console.log(`✅ Meal plan generated in ${generationTime}ms (Cost: $${costEstimate.toFixed(4)})`);
    
    return {
      meals: validatedMealPlan,
      shopping_list: shoppingList,
      cultural_tips: mealPlan.cultural_tips || [],
      nutritional_summary: mealPlan.nutritional_summary || {},
      generation_metadata: {
        generation_time_ms: generationTime,
        openai_cost: costEstimate,
        tokens_used: response.usage,
        model: 'gpt-4',
        prompt_version: 'v1.0'
      }
    };
    
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

/**
 * Build a detailed prompt for meal plan generation
 */
const buildMealPlanPrompt = async (userProfile, healthProfile, culturalFoods, stapleFoods, options) => {
  const duration = options.duration || 7;
  const startDate = options.startDate || new Date().toISOString().split('T')[0];
  
  // Build dietary restrictions text
  const restrictions = healthProfile.dietary_restrictions || [];
  const allergies = healthProfile.allergies || [];
  const restrictionsText = restrictions.length > 0 ? `Dietary restrictions: ${restrictions.join(', ')}` : '';
  const allergiesText = allergies.length > 0 ? `Allergies: ${allergies.join(', ')}` : '';
  
  // Build staple foods list
  const staplesList = stapleFoods.map(f => f.name).join(', ');
  const culturalFoodsList = culturalFoods.slice(0, 20).map(f => f.name).join(', ');
  
  return `Create a ${duration}-day culturally authentic ${userProfile.cultural_background} meal plan for a ${userProfile.age || 'adult'}-year-old person.

USER PROFILE:
- Cultural Background: ${userProfile.cultural_background}
- Primary Health Goal: ${healthProfile.primary_goal}
- Family Size: ${healthProfile.family_size} people
- Cooking Time Preference: ${healthProfile.cooking_time_preference} minutes
- Activity Level: ${healthProfile.activity_level}
- Current Weight: ${healthProfile.current_weight || 'not specified'} lbs
- Target Weight: ${healthProfile.target_weight || 'not specified'} lbs
${restrictionsText}
${allergiesText}

CULTURAL REQUIREMENTS:
- Use authentic ${userProfile.cultural_background} ingredients and cooking methods
- Include traditional spices and seasonings
- Respect cultural meal patterns and timing
- Staple foods to include: ${staplesList}
- Available cultural ingredients: ${culturalFoodsList}

NUTRITIONAL GOALS:
- Focus on ${healthProfile.primary_goal.replace('_', ' ')}
- Create balanced meals with appropriate macronutrients
- Include variety while maintaining cultural authenticity
- Consider portion sizes for ${healthProfile.family_size} people

MEAL PLAN REQUIREMENTS:
- Start date: ${startDate}
- ${duration} complete days
- 3 meals per day (breakfast, lunch, dinner)
- Include 1-2 healthy snacks per day
- Provide detailed recipes with ingredients and instructions
- Include prep time and cooking time for each meal
- Ensure meals can be prepared within ${healthProfile.cooking_time_preference} minutes

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_number": 1,
      "meals": {
        "breakfast": {
          "name": "Meal Name",
          "description": "Brief description",
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "prep_time": 10,
          "cook_time": 15,
          "servings": ${healthProfile.family_size},
          "nutrition": {
            "calories": 400,
            "protein": 20,
            "carbs": 45,
            "fat": 12,
            "fiber": 8
          },
          "cultural_notes": "Cultural significance or traditional preparation notes"
        },
        "lunch": { /* same structure */ },
        "dinner": { /* same structure */ },
        "snacks": [
          {
            "name": "Snack Name",
            "ingredients": ["ingredient 1"],
            "instructions": ["step 1"],
            "nutrition": { "calories": 150 }
          }
        ]
      }
    }
  ],
  "cultural_tips": [
    "Traditional cooking tip 1",
    "Cultural context about ingredients",
    "Preparation techniques specific to this cuisine"
  ],
  "nutritional_summary": {
    "daily_calories": 1800,
    "daily_protein": 80,
    "daily_carbs": 200,
    "daily_fat": 60,
    "daily_fiber": 30,
    "health_benefits": ["benefit 1", "benefit 2"]
  }
}

Make this meal plan authentic, delicious, and aligned with the user's health goals while honoring their cultural heritage.`;
};

/**
 * Get system prompt for specific cultural background
 */
const getSystemPrompt = (culturalBackground) => {
  const culturalContext = {
    latino: "You are a Latino nutrition expert specializing in Mexican, Central American, and South American cuisines. Focus on traditional ingredients like beans, corn, rice, avocados, tomatoes, chiles, and cilantro. Use authentic cooking methods like braising, grilling, and slow-cooking.",
    
    somali: "You are a Somali nutrition expert specializing in East African and Middle Eastern influenced cuisine. Focus on traditional ingredients like injera, berbere spice, lentils, goat meat, camel milk, and aromatic spices. Use traditional cooking methods like stewing and fermentation.",
    
    south_asian: "You are a South Asian nutrition expert specializing in Indian, Pakistani, Bangladeshi, and Sri Lankan cuisines. Focus on traditional ingredients like basmati rice, lentils, turmeric, cumin, garam masala, and yogurt. Use authentic cooking methods like tempering spices, slow-cooking curries, and tandoor-style preparation.",
    
    mediterranean: "You are a Mediterranean nutrition expert specializing in Greek, Turkish, Lebanese, and Italian cuisines. Focus on traditional ingredients like olive oil, tomatoes, herbs, legumes, fish, and whole grains. Use authentic cooking methods like grilling, roasting, and fresh preparation.",
    
    caribbean: "You are a Caribbean nutrition expert specializing in Jamaican, Cuban, Puerto Rican, and other island cuisines. Focus on traditional ingredients like plantains, yuca, beans, rice, tropical fruits, and jerk spices. Use authentic cooking methods like slow-cooking, grilling, and tropical preparation.",
    
    middle_eastern: "You are a Middle Eastern nutrition expert specializing in Lebanese, Persian, Turkish, and Moroccan cuisines. Focus on traditional ingredients like tahini, dates, nuts, lamb, bulgur, and aromatic spices. Use authentic cooking methods like slow-braising, grilling, and spice blending."
  };
  
  return `${culturalContext[culturalBackground] || culturalContext.latino}

You create culturally authentic, health-focused meal plans that respect traditional cooking methods while optimizing for modern nutritional goals. Always prioritize:

1. Cultural authenticity and traditional flavors
2. Health and nutritional balance
3. Practical preparation within time constraints
4. Family-friendly portions and ingredients
5. Clear, detailed cooking instructions

Respond only with valid JSON in the exact format requested. Do not include any text outside the JSON object.`;
};

/**
 * Validate meal plan structure and provide defaults
 */
const validateMealPlanStructure = (mealPlan) => {
  if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
    throw new Error('Invalid meal plan structure: missing days array');
  }
  
  // Validate each day
  mealPlan.days.forEach((day, index) => {
    if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
      throw new Error(`Invalid day ${index + 1}: missing required meals`);
    }
    
    // Ensure each meal has required fields
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const meal = day.meals[mealType];
      if (!meal.name || !meal.ingredients || !meal.instructions) {
        throw new Error(`Invalid ${mealType} on day ${index + 1}: missing required fields`);
      }
      
      // Provide defaults for missing fields
      meal.prep_time = meal.prep_time || 10;
      meal.cook_time = meal.cook_time || 20;
      meal.servings = meal.servings || 1;
      meal.nutrition = meal.nutrition || { calories: 400 };
    });
    
    // Ensure snacks exist
    day.meals.snacks = day.meals.snacks || [];
  });
  
  return mealPlan;
};

/**
 * Generate organized shopping list from meal plan
 */
const generateShoppingList = (mealPlan) => {
  const categories = {
    proteins: [],
    vegetables: [],
    fruits: [],
    grains: [],
    dairy: [],
    spices: [],
    pantry: [],
    other: []
  };
  
  const allIngredients = new Set();
  
  // Collect all ingredients
  mealPlan.days.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (day.meals[mealType] && day.meals[mealType].ingredients) {
        day.meals[mealType].ingredients.forEach(ingredient => {
          allIngredients.add(ingredient.toLowerCase().trim());
        });
      }
    });
    
    // Add snack ingredients
    if (day.meals.snacks) {
      day.meals.snacks.forEach(snack => {
        if (snack.ingredients) {
          snack.ingredients.forEach(ingredient => {
            allIngredients.add(ingredient.toLowerCase().trim());
          });
        }
      });
    }
  });
  
  // Categorize ingredients (basic categorization)
  Array.from(allIngredients).forEach(ingredient => {
    const item = ingredient.toLowerCase();
    
    if (item.includes('chicken') || item.includes('beef') || item.includes('fish') || 
        item.includes('egg') || item.includes('meat') || item.includes('beans')) {
      categories.proteins.push(ingredient);
    } else if (item.includes('rice') || item.includes('bread') || item.includes('flour') ||
               item.includes('pasta') || item.includes('grain')) {
      categories.grains.push(ingredient);
    } else if (item.includes('milk') || item.includes('cheese') || item.includes('yogurt')) {
      categories.dairy.push(ingredient);
    } else if (item.includes('spice') || item.includes('cumin') || item.includes('pepper') ||
               item.includes('salt') || item.includes('herb')) {
      categories.spices.push(ingredient);
    } else if (item.includes('tomato') || item.includes('onion') || item.includes('pepper') ||
               item.includes('lettuce') || item.includes('spinach')) {
      categories.vegetables.push(ingredient);
    } else if (item.includes('apple') || item.includes('banana') || item.includes('orange') ||
               item.includes('fruit')) {
      categories.fruits.push(ingredient);
    } else if (item.includes('oil') || item.includes('sauce') || item.includes('vinegar')) {
      categories.pantry.push(ingredient);
    } else {
      categories.other.push(ingredient);
    }
  });
  
  // Sort each category
  Object.keys(categories).forEach(category => {
    categories[category].sort();
  });
  
  return categories;
};

/**
 * Calculate estimated OpenAI API cost
 */
const calculateOpenAICost = (usage) => {
  if (!usage) return 0;
  
  // GPT-4 pricing (as of 2024)
  const inputCostPer1k = 0.03;
  const outputCostPer1k = 0.06;
  
  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1k;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1k;
  
  return inputCost + outputCost;
};

/**
 * Generate a fallback meal plan when OpenAI is unavailable
 */
const generateFallbackMealPlan = (userProfile, healthProfile, options = {}) => {
  console.log('🔄 Generating fallback meal plan...');
  
  const duration = options.duration || 7;
  const startDate = new Date(options.startDate || Date.now());
  
  // Basic fallback meal plan structure
  const fallbackPlan = {
    days: [],
    cultural_tips: [
      `Traditional ${userProfile.cultural_background} cuisine emphasizes fresh, whole ingredients`,
      'Meal planning helps maintain cultural food traditions while meeting health goals',
      'Consider preparing larger batches of staple items for the week'
    ],
    nutritional_summary: {
      daily_calories: 1800,
      daily_protein: 80,
      daily_carbs: 200,
      daily_fat: 60,
      daily_fiber: 30,
      health_benefits: ['Improved energy levels', 'Better blood sugar control']
    }
  };
  
  // Generate basic days
  for (let i = 0; i < duration; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    fallbackPlan.days.push({
      date: dayDate.toISOString().split('T')[0],
      day_number: i + 1,
      meals: {
        breakfast: {
          name: `Traditional ${userProfile.cultural_background} Breakfast`,
          description: 'A nutritious breakfast featuring cultural staples',
          ingredients: ['staple grains', 'protein source', 'vegetables'],
          instructions: ['Prepare ingredients', 'Cook according to tradition'],
          prep_time: 10,
          cook_time: 15,
          servings: healthProfile.family_size,
          nutrition: { calories: 400, protein: 20, carbs: 45, fat: 12, fiber: 8 }
        },
        lunch: {
          name: `Healthy ${userProfile.cultural_background} Lunch`,
          description: 'A balanced midday meal',
          ingredients: ['vegetables', 'protein', 'healthy fats'],
          instructions: ['Prepare fresh ingredients', 'Combine thoughtfully'],
          prep_time: 15,
          cook_time: 20,
          servings: healthProfile.family_size,
          nutrition: { calories: 500, protein: 25, carbs: 50, fat: 18, fiber: 10 }
        },
        dinner: {
          name: `Traditional ${userProfile.cultural_background} Dinner`,
          description: 'A satisfying evening meal',
          ingredients: ['main protein', 'vegetables', 'grains'],
          instructions: ['Season authentically', 'Cook with care'],
          prep_time: 20,
          cook_time: 30,
          servings: healthProfile.family_size,
          nutrition: { calories: 600, protein: 30, carbs: 60, fat: 20, fiber: 12 }
        },
        snacks: [
          {
            name: 'Healthy Cultural Snack',
            ingredients: ['traditional ingredients'],
            instructions: ['Prepare simply'],
            nutrition: { calories: 150 }
          }
        ]
      }
    });
  }
  
  return fallbackPlan;
};

module.exports = {
  generateMealPlan,
  generateFallbackMealPlan,
  calculateOpenAICost
};