const { getSupabase } = require('../config/supabase');

/**
 * Helper functions for common Supabase operations
 */

// User management helpers
const createUserProfile = async (userId, profileData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const getUserProfile = async (userId) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      health_profiles (*),
      subscriptions (*)
    `)
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

// Health profile helpers
const createHealthProfile = async (userId, healthData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('health_profiles')
    .insert({
      user_id: userId,
      ...healthData
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const updateHealthProfile = async (userId, healthData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('health_profiles')
    .update({
      ...healthData,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Meal plan helpers
const createMealPlan = async (userId, mealPlanData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      ...mealPlanData
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const getUserMealPlans = async (userId, limit = 10) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data;
};

const getActiveMealPlan = async (userId) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Progress tracking helpers
const addProgressEntry = async (userId, progressData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('progress_entries')
    .insert({
      user_id: userId,
      ...progressData
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const getUserProgress = async (userId, days = 30) => {
  const supabase = getSupabase();
  
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', fromDate.toISOString().split('T')[0])
    .order('entry_date', { ascending: false });
    
  if (error) throw error;
  return data;
};

// Quiz response helpers
const saveQuizResponse = async (quizData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .insert(quizData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const getQuizResponse = async (email) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Cultural foods helpers
const getCulturalFoods = async (culturalBackground, category = null) => {
  const supabase = getSupabase();
  
  let query = supabase
    .from('cultural_foods')
    .select('*')
    .eq('cultural_background', culturalBackground);
    
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return data;
};

const getStapleFoods = async (culturalBackground) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('cultural_foods')
    .select('*')
    .eq('cultural_background', culturalBackground)
    .eq('is_staple', true)
    .order('name');
    
  if (error) throw error;
  return data;
};

// Subscription helpers
const createSubscription = async (userId, subscriptionData) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      ...subscriptionData
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

const getUserSubscription = async (userId) => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Analytics helpers
const getConversionMetrics = async (days = 30) => {
  const supabase = getSupabase();
  
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  // Get quiz responses in date range
  const { data: quizData, error: quizError } = await supabase
    .from('quiz_responses')
    .select('*')
    .gte('created_at', fromDate.toISOString());
    
  if (quizError) throw quizError;
  
  // Calculate conversion rates
  const totalQuizzes = quizData.length;
  const signups = quizData.filter(q => q.completed_signup).length;
  const conversions = quizData.filter(q => q.converted_to_paid).length;
  
  return {
    total_quizzes: totalQuizzes,
    signups: signups,
    conversions: conversions,
    signup_rate: totalQuizzes > 0 ? (signups / totalQuizzes * 100).toFixed(2) : 0,
    conversion_rate: signups > 0 ? (conversions / signups * 100).toFixed(2) : 0
  };
};

module.exports = {
  // User management
  createUserProfile,
  getUserProfile,
  
  // Health profiles
  createHealthProfile,
  updateHealthProfile,
  
  // Meal plans
  createMealPlan,
  getUserMealPlans,
  getActiveMealPlan,
  
  // Progress tracking
  addProgressEntry,
  getUserProgress,
  
  // Quiz responses
  saveQuizResponse,
  getQuizResponse,
  
  // Cultural foods
  getCulturalFoods,
  getStapleFoods,
  
  // Subscriptions
  createSubscription,
  getUserSubscription,
  
  // Analytics
  getConversionMetrics
};