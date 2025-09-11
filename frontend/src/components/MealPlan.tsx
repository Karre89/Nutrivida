import React, { useState, useEffect } from 'react';
import { mealPlanApi } from '../services/api';

interface Recipe {
  id: string;
  name: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  culturalOrigin: string;
  ingredients: string[];
  instructions: string[];
  nutritionFacts: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  tags: string[];
  imageUrl?: string;
}

interface DayMealPlan {
  date: string;
  dayName: string;
  meals: {
    breakfast: Recipe;
    lunch: Recipe;
    dinner: Recipe;
    snack?: Recipe;
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealPlan {
  id: string;
  name: string;
  culturalTheme: string;
  startDate: string;
  duration: number;
  isActive: boolean;
  days: DayMealPlan[];
  shoppingList: {
    category: string;
    items: { name: string; quantity: string; }[];
  }[];
}

const MealPlan: React.FC = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Recipe | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      // For demo, we'll create a sample meal plan
      const sampleMealPlan = createSampleMealPlan();
      setMealPlan(sampleMealPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const createSampleMealPlan = (): MealPlan => {
    const culturalTheme = localStorage.getItem('selectedCulture') || 'latino';
    
    return {
      id: '1',
      name: `7-Day ${getCultureName(culturalTheme)} Blood Sugar Reset`,
      culturalTheme,
      startDate: new Date().toISOString().split('T')[0],
      duration: 7,
      isActive: true,
      days: generateSampleDays(culturalTheme),
      shoppingList: generateShoppingList(culturalTheme)
    };
  };

  const getCultureName = (culture: string): string => {
    const names = {
      'latino': 'Latino',
      'somali': 'Somali',
      'south_asian': 'South Asian',
      'mediterranean': 'Mediterranean',
      'caribbean': 'Caribbean',
      'middle_eastern': 'Middle Eastern'
    };
    return names[culture as keyof typeof names] || 'Cultural';
  };

  const generateSampleDays = (culture: string): DayMealPlan[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const startDate = new Date();
    
    return days.map((dayName, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      
      return {
        date: date.toISOString().split('T')[0],
        dayName,
        meals: generateCulturalMeals(culture, index),
        totalNutrition: {
          calories: 1650 + Math.floor(Math.random() * 200),
          protein: 85 + Math.floor(Math.random() * 20),
          carbs: 180 + Math.floor(Math.random() * 40),
          fat: 65 + Math.floor(Math.random() * 15)
        }
      };
    });
  };

  const generateCulturalMeals = (culture: string, dayIndex: number): DayMealPlan['meals'] => {
    const mealsByculture = {
      latino: {
        breakfast: [
          'Huevos Rancheros with Black Beans',
          'Mexican Quinoa Bowl',
          'Avocado Toast with Pepitas',
          'Breakfast Burrito Bowl'
        ],
        lunch: [
          'Chicken Tinga Salad',
          'Lentil and Sweet Potato Tacos',
          'Pozole Verde',
          'Cilantro Lime Chicken Bowl'
        ],
        dinner: [
          'Grilled Fish with Salsa Verde',
          'Cauliflower Rice Burrito Bowl',
          'Stuffed Bell Peppers',
          'Zucchini Enchiladas'
        ]
      },
      somali: {
        breakfast: [
          'Anjero with Honey and Dates',
          'Spiced Oatmeal with Cardamom',
          'Somali Tea with Whole Grain Toast',
          'Scrambled Eggs with Berbere'
        ],
        lunch: [
          'Lentil and Vegetable Stew',
          'Grilled Chicken with Injera',
          'Spiced Rice with Vegetables',
          'Fish Curry with Brown Rice'
        ],
        dinner: [
          'Slow-Cooked Goat with Vegetables',
          'Spiced Chicken and Rice',
          'Vegetable Sambusa Bowl',
          'Grilled Fish with Spices'
        ]
      },
      // Add other cultures...
    };

    const meals = mealsByculture[culture as keyof typeof mealsByculture] || mealsByculture.latino;
    
    return {
      breakfast: createRecipe(meals.breakfast[dayIndex % meals.breakfast.length], 'breakfast', culture),
      lunch: createRecipe(meals.lunch[dayIndex % meals.lunch.length], 'lunch', culture),
      dinner: createRecipe(meals.dinner[dayIndex % meals.dinner.length], 'dinner', culture),
      snack: dayIndex % 3 === 0 ? createRecipe('Cultural Spiced Nuts', 'snack', culture) : undefined
    };
  };

  const createRecipe = (name: string, mealType: string, culture: string): Recipe => {
    return {
      id: `${mealType}-${Date.now()}-${Math.random()}`,
      name,
      description: `A delicious ${culture} ${mealType} recipe that supports your blood sugar goals`,
      cookingTime: mealType === 'breakfast' ? 15 : mealType === 'snack' ? 5 : 30,
      servings: 2,
      difficulty: 'medium',
      culturalOrigin: culture,
      ingredients: generateIngredients(name, culture),
      instructions: generateInstructions(name, mealType),
      nutritionFacts: generateNutrition(mealType),
      tags: ['blood-sugar-friendly', 'cultural', 'healthy', culture],
      imageUrl: `/images/${culture}/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`
    };
  };

  const generateIngredients = (recipeName: string, culture: string): string[] => {
    const baseIngredients = {
      latino: ['onion', 'garlic', 'cilantro', 'lime', 'cumin', 'chili powder'],
      somali: ['cardamom', 'cinnamon', 'ginger', 'turmeric', 'coriander', 'berbere spice'],
      // Add other cultures...
    };

    const base = baseIngredients[culture as keyof typeof baseIngredients] || baseIngredients.latino;
    return [
      '2 cups main ingredient',
      '1 medium onion, diced',
      '3 cloves garlic, minced',
      ...base.slice(0, 3).map(spice => `1 tsp ${spice}`),
      '2 tbsp olive oil',
      'Salt and pepper to taste'
    ];
  };

  const generateInstructions = (recipeName: string, mealType: string): string[] => {
    return [
      'Heat olive oil in a large pan over medium heat',
      'Add onion and cook until softened, about 5 minutes',
      'Add garlic and spices, cook for 1 minute until fragrant',
      'Add main ingredients and cook according to recipe',
      'Season with salt and pepper',
      'Serve hot and enjoy your cultural meal'
    ];
  };

  const generateNutrition = (mealType: string) => {
    const base = {
      breakfast: { calories: 350, protein: 18, carbs: 35, fat: 15, fiber: 8, sugar: 6 },
      lunch: { calories: 450, protein: 25, carbs: 45, fat: 18, fiber: 12, sugar: 8 },
      dinner: { calories: 500, protein: 30, carbs: 40, fat: 20, fiber: 10, sugar: 6 },
      snack: { calories: 150, protein: 6, carbs: 12, fat: 8, fiber: 4, sugar: 3 }
    };

    return base[mealType as keyof typeof base] || base.lunch;
  };

  const generateShoppingList = (culture: string) => {
    return [
      {
        category: 'Proteins',
        items: [
          { name: 'Chicken breast', quantity: '2 lbs' },
          { name: 'Fish fillets', quantity: '1 lb' },
          { name: 'Eggs', quantity: '1 dozen' },
          { name: 'Black beans', quantity: '2 cans' }
        ]
      },
      {
        category: 'Vegetables',
        items: [
          { name: 'Onions', quantity: '3 medium' },
          { name: 'Bell peppers', quantity: '4 pieces' },
          { name: 'Tomatoes', quantity: '6 medium' },
          { name: 'Avocados', quantity: '4 pieces' }
        ]
      },
      {
        category: 'Spices & Herbs',
        items: [
          { name: 'Cumin', quantity: '1 jar' },
          { name: 'Chili powder', quantity: '1 jar' },
          { name: 'Fresh cilantro', quantity: '3 bunches' },
          { name: 'Lime', quantity: '6 pieces' }
        ]
      }
    ];
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cultural meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Meal Plan</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={loadMealPlan} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mealPlan.name}</h1>
              <p className="text-gray-600 mt-1">
                {formatDate(mealPlan.startDate)} - {mealPlan.duration} days
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowShoppingList(!showShoppingList)}
                className="btn-secondary"
              >
                Shopping List
              </button>
              <button className="btn-primary">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Days Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Days</h3>
              <div className="space-y-2">
                {mealPlan.days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedDay === index
                        ? 'bg-orange-50 border-orange-200 text-orange-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{day.dayName}</div>
                    <div className="text-sm text-gray-500">
                      {day.totalNutrition.calories} calories
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Day Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {mealPlan.days[selectedDay].dayName}
                </h2>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Nutrition</div>
                  <div className="font-semibold text-gray-900">
                    {mealPlan.days[selectedDay].totalNutrition.calories} cal
                  </div>
                </div>
              </div>

              {/* Nutrition Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {mealPlan.days[selectedDay].totalNutrition.calories}
                  </div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {mealPlan.days[selectedDay].totalNutrition.protein}g
                  </div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {mealPlan.days[selectedDay].totalNutrition.carbs}g
                  </div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {mealPlan.days[selectedDay].totalNutrition.fat}g
                  </div>
                  <div className="text-sm text-gray-600">Fat</div>
                </div>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-6">
              {Object.entries(mealPlan.days[selectedDay].meals).map(([mealType, recipe]) => {
                if (!recipe) return null;
                
                return (
                  <div key={mealType} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 capitalize">
                          {mealType}
                        </h3>
                        <h4 className="text-lg font-medium text-gray-700 mt-1">
                          {recipe.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {recipe.cookingTime} min
                        </div>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                          {recipe.difficulty}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{recipe.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nutrition Info */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Nutrition per serving</h5>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="font-medium">{recipe.nutritionFacts.calories}</span>
                              <div className="text-gray-500">calories</div>
                            </div>
                            <div>
                              <span className="font-medium">{recipe.nutritionFacts.protein}g</span>
                              <div className="text-gray-500">protein</div>
                            </div>
                            <div>
                              <span className="font-medium">{recipe.nutritionFacts.carbs}g</span>
                              <div className="text-gray-500">carbs</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedMeal(recipe)}
                          className="flex-1 btn-primary"
                        >
                          View Recipe
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          ♡
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMeal.name}</h2>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recipe Details */}
                <div>
                  <div className="mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🕒 {selectedMeal.cookingTime} minutes</span>
                      <span>👥 {selectedMeal.servings} servings</span>
                      <span className={`px-2 py-1 rounded ${getDifficultyColor(selectedMeal.difficulty)}`}>
                        {selectedMeal.difficulty}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                  <ul className="space-y-1 mb-6">
                    {selectedMeal.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedMeal.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-500">
                  Cultural origin: {getCultureName(selectedMeal.culturalOrigin)}
                </div>
                <div className="flex space-x-3">
                  <button className="btn-secondary">
                    Add to Favorites
                  </button>
                  <button className="btn-primary">
                    Start Cooking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
                <button
                  onClick={() => setShowShoppingList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {mealPlan.shoppingList.map((category, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-gray-900 mb-3">{category.category}</h3>
                    <div className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t flex space-x-3">
                <button className="flex-1 btn-secondary">
                  Print List
                </button>
                <button className="flex-1 btn-primary">
                  Export to Phone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlan;