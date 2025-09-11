const OpenAI = require('openai');

// Initialize OpenAI client - handle missing API key gracefully
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-key-will-replace-with-real-one') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.log('ℹ️  OpenAI API key not configured - using fallback meal plan generation');
  }
} catch (error) {
  console.log('⚠️  Failed to initialize OpenAI client - using fallback meal plan generation');
  openai = null;
}

// Cultural food knowledge base
const CULTURAL_FOODS = {
  latino: {
    name: 'Latino',
    staples: ['rice', 'black beans', 'corn tortillas', 'quinoa', 'sweet potatoes', 'plantains'],
    proteins: ['chicken', 'fish', 'turkey', 'eggs', 'black beans', 'lentils'],
    vegetables: ['bell peppers', 'tomatoes', 'onions', 'cilantro', 'avocado', 'jalapeños', 'spinach'],
    spices: ['cumin', 'chili powder', 'paprika', 'oregano', 'lime', 'garlic'],
    cookingMethods: ['grilling', 'sautéing', 'roasting', 'steaming'],
    traditionalDishes: ['arroz con pollo', 'black bean soup', 'fish tacos', 'quinoa salad', 'stuffed peppers'],
    healthySwaps: {
      'white rice': 'brown rice or quinoa',
      'refried beans': 'whole black beans',
      'fried plantains': 'baked plantains',
      'sour cream': 'Greek yogurt'
    }
  },
  somali: {
    name: 'Somali',
    staples: ['rice', 'injera', 'pasta', 'potatoes', 'lentils', 'sorghum'],
    proteins: ['goat meat', 'chicken', 'fish', 'camel milk', 'eggs', 'lentils'],
    vegetables: ['tomatoes', 'onions', 'spinach', 'okra', 'carrots', 'green beans'],
    spices: ['berbere', 'cardamom', 'cinnamon', 'coriander', 'fenugreek', 'ginger'],
    cookingMethods: ['stewing', 'grilling', 'steaming', 'fermenting'],
    traditionalDishes: ['anjero', 'maraq', 'bariis', 'hilib ari', 'suugo'],
    healthySwaps: {
      'white rice': 'brown rice or sorghum',
      'regular pasta': 'whole grain pasta',
      'fried foods': 'grilled or steamed alternatives'
    }
  },
  south_asian: {
    name: 'South Asian',
    staples: ['basmati rice', 'lentils', 'chickpeas', 'whole wheat roti', 'quinoa'],
    proteins: ['chicken', 'fish', 'paneer', 'lentils', 'chickpeas', 'eggs'],
    vegetables: ['spinach', 'cauliflower', 'okra', 'eggplant', 'tomatoes', 'onions', 'green beans'],
    spices: ['turmeric', 'cumin', 'coriander', 'garam masala', 'ginger', 'garlic', 'cardamom'],
    cookingMethods: ['curry-making', 'tandoori', 'steaming', 'sautéing'],
    traditionalDishes: ['dal', 'chicken curry', 'vegetable biryani', 'tandoori fish', 'saag paneer'],
    healthySwaps: {
      'white rice': 'brown basmati rice',
      'ghee': 'olive oil in moderation',
      'regular yogurt': 'Greek yogurt',
      'naan': 'whole wheat roti'
    }
  },
  mediterranean: {
    name: 'Mediterranean',
    staples: ['olive oil', 'whole grains', 'legumes', 'nuts', 'fish'],
    proteins: ['fish', 'chicken', 'eggs', 'legumes', 'nuts', 'Greek yogurt'],
    vegetables: ['tomatoes', 'olives', 'spinach', 'zucchini', 'eggplant', 'peppers', 'cucumbers'],
    spices: ['oregano', 'basil', 'thyme', 'rosemary', 'lemon', 'garlic'],
    cookingMethods: ['grilling', 'roasting', 'sautéing with olive oil', 'steaming'],
    traditionalDishes: ['Greek salad', 'grilled fish', 'ratatouille', 'hummus', 'tabbouleh'],
    healthySwaps: {
      'butter': 'extra virgin olive oil',
      'refined grains': 'whole grains',
      'processed meats': 'fresh fish and poultry'
    }
  },
  caribbean: {
    name: 'Caribbean',
    staples: ['rice', 'beans', 'yuca', 'plantains', 'sweet potatoes', 'breadfruit'],
    proteins: ['fish', 'chicken', 'beans', 'eggs', 'shellfish'],
    vegetables: ['callaloo', 'okra', 'tomatoes', 'bell peppers', 'onions', 'sweet peppers'],
    spices: ['allspice', 'scotch bonnet peppers', 'thyme', 'ginger', 'garlic', 'lime'],
    cookingMethods: ['jerk seasoning', 'steaming', 'grilling', 'stewing'],
    traditionalDishes: ['jerk chicken', 'rice and peas', 'callaloo', 'fish stew', 'roasted plantains'],
    healthySwaps: {
      'fried plantains': 'baked plantains',
      'coconut oil': 'use in moderation',
      'white rice': 'brown rice or quinoa'
    }
  },
  middle_eastern: {
    name: 'Middle Eastern',
    staples: ['bulgur', 'rice', 'lentils', 'chickpeas', 'olive oil', 'tahini'],
    proteins: ['chicken', 'fish', 'lamb (lean cuts)', 'lentils', 'chickpeas', 'nuts'],
    vegetables: ['tomatoes', 'cucumbers', 'eggplant', 'zucchini', 'spinach', 'parsley'],
    spices: ['za\'atar', 'sumac', 'cardamom', 'cinnamon', 'mint', 'lemon'],
    cookingMethods: ['grilling', 'roasting', 'steaming', 'slow cooking'],
    traditionalDishes: ['hummus', 'tabbouleh', 'grilled kebabs', 'stuffed vegetables', 'lentil soup'],
    healthySwaps: {
      'white rice': 'bulgur or brown rice',
      'fried foods': 'grilled or baked alternatives',
      'heavy cream': 'tahini or Greek yogurt'
    }
  }
};

// Health goal guidelines
const HEALTH_GOALS = {
  blood_sugar_control: {
    focus: 'Blood sugar stability',
    macroBalance: { carbs: '40%', protein: '30%', fats: '30%' },
    guidelines: [
      'Focus on complex carbohydrates with high fiber',
      'Pair carbs with protein or healthy fats',
      'Include foods with low glycemic index',
      'Emphasize lean proteins and healthy fats',
      'Include plenty of non-starchy vegetables'
    ],
    avoidFoods: ['refined sugars', 'white bread', 'sugary drinks', 'processed foods'],
    preferFoods: ['quinoa', 'brown rice', 'lean proteins', 'leafy greens', 'nuts', 'seeds']
  },
  weight_loss: {
    focus: 'Sustainable weight management',
    macroBalance: { carbs: '35%', protein: '35%', fats: '30%' },
    guidelines: [
      'Create moderate calorie deficit',
      'Prioritize high-protein foods for satiety',
      'Include high-fiber foods',
      'Focus on nutrient-dense foods',
      'Control portion sizes'
    ],
    avoidFoods: ['processed snacks', 'sugary beverages', 'fried foods', 'refined carbs'],
    preferFoods: ['lean proteins', 'vegetables', 'fruits', 'whole grains', 'legumes']
  },
  energy_boost: {
    focus: 'Sustained energy levels',
    macroBalance: { carbs: '45%', protein: '25%', fats: '30%' },
    guidelines: [
      'Include complex carbohydrates for steady energy',
      'Add iron-rich foods to prevent fatigue',
      'Include B-vitamin rich foods',
      'Stay well hydrated',
      'Balance meals to avoid energy crashes'
    ],
    avoidFoods: ['simple sugars', 'excessive caffeine', 'heavy meals'],
    preferFoods: ['oats', 'quinoa', 'leafy greens', 'nuts', 'lean meats', 'citrus fruits']
  },
  glp1_support: {
    focus: 'Supporting GLP-1 medication effects',
    macroBalance: { carbs: '35%', protein: '40%', fats: '25%' },
    guidelines: [
      'Eat smaller, more frequent meals',
      'Focus on high-protein foods',
      'Include fiber-rich foods',
      'Stay well hydrated',
      'Avoid foods that cause nausea'
    ],
    avoidFoods: ['high-fat foods', 'spicy foods', 'large portions', 'sugary foods'],
    preferFoods: ['lean proteins', 'mild vegetables', 'whole grains', 'low-fat dairy']
  },
  general_health: {
    focus: 'Overall wellness and nutrition',
    macroBalance: { carbs: '45%', protein: '25%', fats: '30%' },
    guidelines: [
      'Include variety of colors in fruits and vegetables',
      'Balance all macronutrients',
      'Include foods from all food groups',
      'Practice portion control',
      'Stay hydrated'
    ],
    avoidFoods: ['excessive processed foods', 'too much added sugar', 'excessive sodium'],
    preferFoods: ['variety of fruits and vegetables', 'whole grains', 'lean proteins', 'healthy fats']
  }
};

class AIMealPlanService {
  constructor() {
    this.openai = openai;
  }

  async generateMealPlan(userProfile) {
    try {
      const {
        culturalBackground,
        primaryGoal,
        dietaryRestrictions = [],
        allergies = [],
        cookingSkillLevel = 'intermediate',
        timeAvailable = 'moderate',
        budgetLevel = 'moderate',
        familySize = 1,
        age,
        gender,
        activityLevel = 'moderate'
      } = userProfile;

      // Get cultural and health context
      const culturalInfo = CULTURAL_FOODS[culturalBackground] || CULTURAL_FOODS.latino;
      const healthGoals = HEALTH_GOALS[primaryGoal] || HEALTH_GOALS.general_health;

      // Check if OpenAI is available, otherwise use fallback
      if (!openai) {
        console.log('🔄 Using fallback meal plan generation...');
        return this.generateFallbackMealPlan(culturalInfo, healthGoals);
      }

      // Build the AI prompt
      const prompt = this.buildMealPlanPrompt(culturalInfo, healthGoals, userProfile);

      // Generate meal plan using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional nutritionist and cultural food expert specializing in creating authentic, healthy meal plans. You understand traditional cooking methods and ingredients from various cultures while applying modern nutrition science. Always provide practical, culturally authentic recipes that honor traditional flavors while meeting specific health goals.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content;
      
      // Parse and structure the AI response
      const structuredMealPlan = await this.parseAIResponse(aiResponse, culturalInfo, healthGoals);

      // Add metadata
      structuredMealPlan.metadata = {
        generatedAt: new Date().toISOString(),
        culturalBackground: culturalInfo.name,
        healthGoal: healthGoals.focus,
        macroBalance: healthGoals.macroBalance,
        estimatedPrepTime: this.calculatePrepTime(structuredMealPlan),
        difficultyLevel: cookingSkillLevel
      };

      return structuredMealPlan;

    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan: ' + error.message);
    }
  }

  buildMealPlanPrompt(culturalInfo, healthGoals, userProfile) {
    const {
      dietaryRestrictions,
      allergies,
      cookingSkillLevel,
      timeAvailable,
      budgetLevel,
      familySize
    } = userProfile;

    return `Create a comprehensive 7-day meal plan for someone with ${culturalInfo.name} cultural background focusing on ${healthGoals.focus}.

CULTURAL REQUIREMENTS:
- Use authentic ${culturalInfo.name} ingredients: ${culturalInfo.staples.join(', ')}
- Include traditional spices and seasonings: ${culturalInfo.spices.join(', ')}
- Feature traditional cooking methods: ${culturalInfo.cookingMethods.join(', ')}
- Incorporate these traditional dishes as inspiration: ${culturalInfo.traditionalDishes.join(', ')}
- Apply these healthy modifications: ${Object.entries(culturalInfo.healthySwaps).map(([old, new_]) => `${old} → ${new_}`).join(', ')}

HEALTH GOALS:
- Primary focus: ${healthGoals.focus}
- Macro balance target: ${healthGoals.macroBalance.carbs} carbs, ${healthGoals.macroBalance.protein} protein, ${healthGoals.macroBalance.fats} fats
- Key guidelines: ${healthGoals.guidelines.join('; ')}
- Foods to emphasize: ${healthGoals.preferFoods.join(', ')}
- Foods to minimize: ${healthGoals.avoidFoods.join(', ')}

USER PREFERENCES:
${dietaryRestrictions.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${allergies.length > 0 ? `- Allergies: ${allergies.join(', ')}` : ''}
- Cooking skill level: ${cookingSkillLevel}
- Time available for cooking: ${timeAvailable}
- Budget level: ${budgetLevel}
- Family size: ${familySize} ${familySize === 1 ? 'person' : 'people'}

Please provide a detailed 7-day meal plan in the following JSON format:
{
  "week": {
    "day1": {
      "date": "Day 1",
      "breakfast": {
        "name": "Dish Name",
        "description": "Brief description",
        "ingredients": ["ingredient 1", "ingredient 2"],
        "instructions": ["step 1", "step 2"],
        "prepTime": "15 mins",
        "cookTime": "20 mins",
        "servings": ${familySize},
        "nutrition": {
          "calories": 350,
          "protein": "25g",
          "carbs": "30g",
          "fat": "12g",
          "fiber": "8g"
        },
        "culturalNotes": "Why this dish fits the cultural background"
      },
      "lunch": { /* same structure */ },
      "dinner": { /* same structure */ },
      "snack": { /* same structure */ }
    },
    // ... continue for day2 through day7
  },
  "shoppingList": {
    "proteins": ["item1", "item2"],
    "vegetables": ["item1", "item2"],
    "grains": ["item1", "item2"],
    "spices": ["item1", "item2"],
    "other": ["item1", "item2"]
  },
  "weeklyNutrition": {
    "avgCaloriesPerDay": 1800,
    "avgMacros": {
      "protein": "25%",
      "carbs": "45%",
      "fat": "30%"
    }
  },
  "culturalInsights": "Brief explanation of how this meal plan honors the cultural background while meeting health goals",
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Make sure all recipes use authentic ingredients and cooking methods while being practical for the specified cooking skill level and time constraints. Include cultural context for why each dish fits the tradition.`;
  }

  async parseAIResponse(aiResponse, culturalInfo, healthGoals) {
    try {
      // Try to parse JSON from AI response
      let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const mealPlan = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance the structure
      if (!mealPlan.week) {
        throw new Error('Invalid meal plan structure - missing week data');
      }

      // Ensure all days have required meals
      for (let day = 1; day <= 7; day++) {
        const dayKey = `day${day}`;
        if (!mealPlan.week[dayKey]) {
          throw new Error(`Missing data for ${dayKey}`);
        }

        const dayData = mealPlan.week[dayKey];
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
          if (!dayData[meal]) {
            throw new Error(`Missing ${meal} for ${dayKey}`);
          }
        });
      }

      return mealPlan;

    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Return fallback meal plan if parsing fails
      return this.generateFallbackMealPlan(culturalInfo, healthGoals);
    }
  }

  generateFallbackMealPlan(culturalInfo, healthGoals) {
    // Simple fallback meal plan structure
    const fallbackPlan = {
      week: {},
      shoppingList: {
        proteins: culturalInfo.proteins.slice(0, 3),
        vegetables: culturalInfo.vegetables.slice(0, 5),
        grains: culturalInfo.staples.slice(0, 3),
        spices: culturalInfo.spices.slice(0, 4),
        other: ['olive oil', 'eggs', 'yogurt']
      },
      weeklyNutrition: {
        avgCaloriesPerDay: 1800,
        avgMacros: healthGoals.macroBalance
      },
      culturalInsights: `This meal plan incorporates authentic ${culturalInfo.name} ingredients and cooking methods while supporting your goal of ${healthGoals.focus}.`,
      tips: [
        'Prepare ingredients in advance to save time',
        'Adjust portion sizes based on your hunger levels',
        'Stay hydrated throughout the day',
        'Listen to your body and make adjustments as needed'
      ]
    };

    // Generate basic meals for each day
    for (let day = 1; day <= 7; day++) {
      fallbackPlan.week[`day${day}`] = {
        date: `Day ${day}`,
        breakfast: {
          name: `Traditional ${culturalInfo.name} Breakfast`,
          description: `Healthy breakfast featuring ${culturalInfo.staples[0]}`,
          ingredients: [culturalInfo.staples[0], culturalInfo.proteins[0], 'vegetables'],
          instructions: ['Prepare ingredients', 'Cook according to traditional methods'],
          prepTime: '10 mins',
          cookTime: '15 mins',
          servings: 1,
          nutrition: { calories: 350, protein: '20g', carbs: '35g', fat: '12g', fiber: '6g' },
          culturalNotes: `Features traditional ${culturalInfo.name} flavors`
        },
        lunch: {
          name: `${culturalInfo.name} Style Lunch`,
          description: `Balanced lunch with traditional spices`,
          ingredients: [culturalInfo.vegetables[0], culturalInfo.proteins[1], culturalInfo.staples[1]],
          instructions: ['Season with traditional spices', 'Cook using preferred method'],
          prepTime: '15 mins',
          cookTime: '25 mins',
          servings: 1,
          nutrition: { calories: 450, protein: '25g', carbs: '40g', fat: '15g', fiber: '8g' },
          culturalNotes: `Incorporates authentic ${culturalInfo.name} spices`
        },
        dinner: {
          name: `Traditional ${culturalInfo.name} Dinner`,
          description: `Complete dinner with cultural authenticity`,
          ingredients: [culturalInfo.proteins[2], culturalInfo.vegetables[1], culturalInfo.staples[2]],
          instructions: ['Use traditional cooking method', 'Season appropriately'],
          prepTime: '20 mins',
          cookTime: '35 mins',
          servings: 1,
          nutrition: { calories: 550, protein: '30g', carbs: '45g', fat: '18g', fiber: '10g' },
          culturalNotes: `Traditional preparation method honored`
        },
        snack: {
          name: `Healthy ${culturalInfo.name} Snack`,
          description: 'Light, nutritious snack',
          ingredients: ['nuts', 'fruit', culturalInfo.spices[0]],
          instructions: ['Combine ingredients', 'Enjoy fresh'],
          prepTime: '5 mins',
          cookTime: '0 mins',
          servings: 1,
          nutrition: { calories: 150, protein: '8g', carbs: '12g', fat: '8g', fiber: '4g' },
          culturalNotes: `Simple, traditional snack option`
        }
      };
    }

    return fallbackPlan;
  }

  calculatePrepTime(mealPlan) {
    let totalMinutes = 0;
    let mealCount = 0;

    Object.values(mealPlan.week).forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        if (day[mealType] && day[mealType].prepTime) {
          const prepTime = parseInt(day[mealType].prepTime) || 0;
          const cookTime = parseInt(day[mealType].cookTime) || 0;
          totalMinutes += prepTime + cookTime;
          mealCount++;
        }
      });
    });

    const avgMinutes = Math.round(totalMinutes / mealCount);
    return `${avgMinutes} mins average per meal`;
  }

  // Method to regenerate a specific meal
  async regenerateMeal(mealType, dayNumber, userProfile, currentMealPlan) {
    try {
      const culturalInfo = CULTURAL_FOODS[userProfile.culturalBackground] || CULTURAL_FOODS.latino;
      const healthGoals = HEALTH_GOALS[userProfile.primaryGoal] || HEALTH_GOALS.general_health;

      const prompt = `Generate a single ${mealType} recipe for day ${dayNumber} of a ${culturalInfo.name} meal plan focused on ${healthGoals.focus}.

Cultural requirements: Use ${culturalInfo.name} ingredients and cooking methods.
Health goal: ${healthGoals.focus}
Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'none'}
Allergies: ${userProfile.allergies?.join(', ') || 'none'}

Provide the response in this exact JSON format:
{
  "name": "Dish Name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15 mins",
  "cookTime": "20 mins",
  "servings": ${userProfile.familySize || 1},
  "nutrition": {
    "calories": 350,
    "protein": "25g",
    "carbs": "30g",
    "fat": "12g",
    "fiber": "8g"
  },
  "culturalNotes": "Cultural context"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a nutritionist creating culturally authentic, healthy recipes. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      });

      const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error('Error regenerating meal:', error);
      throw error;
    }
  }
}

module.exports = AIMealPlanService;