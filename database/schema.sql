-- NutriVida Database Schema for Supabase
-- This file contains all the SQL commands to set up the database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE cultural_background AS ENUM (
  'latino',
  'somali', 
  'south_asian',
  'mediterranean',
  'caribbean',
  'middle_eastern'
);

CREATE TYPE health_goal AS ENUM (
  'blood_sugar_control',
  'weight_loss',
  'energy_boost',
  'glp1_support',
  'general_health'
);

CREATE TYPE subscription_plan AS ENUM (
  'seven_day_reset',
  'monthly',
  'quarterly'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'trialing'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Profile information
  cultural_background cultural_background,
  age INTEGER,
  is_onboarded BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'America/New_York'
);

-- Health Profiles table
CREATE TABLE public.health_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Health goals and preferences
  primary_goal health_goal NOT NULL,
  secondary_goals health_goal[],
  dietary_restrictions TEXT[],
  allergies TEXT[],
  family_size INTEGER DEFAULT 1,
  cooking_time_preference INTEGER DEFAULT 30, -- minutes
  activity_level TEXT DEFAULT 'moderate',
  
  -- Current health metrics
  current_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  height_feet INTEGER,
  height_inches INTEGER,
  blood_sugar_goal DECIMAL(5,2),
  
  -- Preferences
  preferred_language TEXT DEFAULT 'en'
);

-- Meal Plans table
CREATE TABLE public.meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Plan details
  plan_name TEXT NOT NULL,
  cultural_theme cultural_background NOT NULL,
  duration_days INTEGER DEFAULT 7,
  start_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Generated content
  meals JSONB NOT NULL, -- Stores the complete meal plan structure
  shopping_list JSONB, -- Organized shopping list
  cultural_tips JSONB, -- Cultural cooking tips and modifications
  nutritional_summary JSONB, -- Overall nutritional breakdown
  
  -- AI generation metadata
  openai_cost DECIMAL(8,6), -- Track AI costs for optimization
  generation_time_ms INTEGER,
  prompt_version TEXT DEFAULT 'v1.0'
);

-- Progress Tracking table
CREATE TABLE public.progress_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  entry_date DATE NOT NULL,
  
  -- Health metrics
  weight DECIMAL(5,2),
  blood_sugar_morning DECIMAL(5,2),
  blood_sugar_evening DECIMAL(5,2),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  
  -- Progress photos
  progress_photo_url TEXT,
  
  -- Notes and observations
  notes TEXT,
  meal_satisfaction INTEGER CHECK (meal_satisfaction >= 1 AND meal_satisfaction <= 5),
  cultural_authenticity_rating INTEGER CHECK (cultural_authenticity_rating >= 1 AND cultural_authenticity_rating <= 5)
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Subscription details
  plan_type subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Billing information
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd'
);

-- Quiz Responses table (for lead capture and conversion tracking)
CREATE TABLE public.quiz_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Lead information
  email TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL if not signed up yet
  
  -- Quiz responses
  cultural_background cultural_background NOT NULL,
  primary_goal health_goal NOT NULL,
  responses JSONB NOT NULL, -- Store all quiz answers
  
  -- Conversion tracking
  completed_signup BOOLEAN DEFAULT FALSE,
  converted_to_paid BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  
  -- Marketing attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT
);

-- Cultural Food Database table
CREATE TABLE public.cultural_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Food information
  name TEXT NOT NULL,
  cultural_background cultural_background NOT NULL,
  category TEXT, -- protein, vegetable, grain, spice, etc.
  
  -- Nutritional data
  nutritional_info JSONB,
  
  -- Cultural context
  traditional_uses TEXT[],
  cooking_methods TEXT[],
  substitutions JSONB, -- Alternative ingredients for different cultures
  
  -- Metadata
  is_staple BOOLEAN DEFAULT FALSE,
  difficulty_level INTEGER DEFAULT 1, -- 1-5 cooking difficulty
  availability_regions TEXT[]
);

-- Create indexes for better performance
CREATE INDEX idx_users_cultural_background ON public.users(cultural_background);
CREATE INDEX idx_users_created_at ON public.users(created_at);

CREATE INDEX idx_health_profiles_user_id ON public.health_profiles(user_id);
CREATE INDEX idx_health_profiles_primary_goal ON public.health_profiles(primary_goal);

CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_cultural_theme ON public.meal_plans(cultural_theme);
CREATE INDEX idx_meal_plans_start_date ON public.meal_plans(start_date);
CREATE INDEX idx_meal_plans_is_active ON public.meal_plans(is_active);

CREATE INDEX idx_progress_entries_user_id ON public.progress_entries(user_id);
CREATE INDEX idx_progress_entries_entry_date ON public.progress_entries(entry_date);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX idx_quiz_responses_email ON public.quiz_responses(email);
CREATE INDEX idx_quiz_responses_cultural_background ON public.quiz_responses(cultural_background);
CREATE INDEX idx_quiz_responses_created_at ON public.quiz_responses(created_at);

CREATE INDEX idx_cultural_foods_cultural_background ON public.cultural_foods(cultural_background);
CREATE INDEX idx_cultural_foods_category ON public.cultural_foods(category);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own health profile" ON public.health_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON public.progress_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for cultural foods (everyone can see the food database)
CREATE POLICY "Anyone can view cultural foods" ON public.cultural_foods
  FOR SELECT USING (true);

-- Quiz responses are insert-only for anonymous users, full access for authenticated users
CREATE POLICY "Anyone can create quiz responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own quiz responses" ON public.quiz_responses
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON public.health_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample cultural foods data
INSERT INTO public.cultural_foods (name, cultural_background, category, traditional_uses, cooking_methods, is_staple) VALUES
  ('Black Beans', 'latino', 'protein', ARRAY['main dishes', 'side dishes', 'soups'], ARRAY['boiling', 'slow cooking', 'pressure cooking'], true),
  ('Cumin', 'latino', 'spice', ARRAY['seasoning', 'marinades'], ARRAY['grinding', 'toasting'], true),
  ('Basmati Rice', 'south_asian', 'grain', ARRAY['main dishes', 'biryanis'], ARRAY['steaming', 'boiling'], true),
  ('Turmeric', 'south_asian', 'spice', ARRAY['curries', 'health drinks'], ARRAY['grinding', 'fresh grating'], true),
  ('Berbere Spice', 'somali', 'spice', ARRAY['stews', 'meat dishes'], ARRAY['grinding', 'mixing'], true),
  ('Injera', 'somali', 'grain', ARRAY['bread', 'base for dishes'], ARRAY['fermentation', 'griddling'], true);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.health_profiles IS 'Health goals, preferences, and current metrics for each user';
COMMENT ON TABLE public.meal_plans IS 'AI-generated culturally-adapted meal plans';
COMMENT ON TABLE public.progress_entries IS 'Daily health and progress tracking entries';
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription management';
COMMENT ON TABLE public.quiz_responses IS 'Lead capture and conversion tracking from health assessment quiz';
COMMENT ON TABLE public.cultural_foods IS 'Database of authentic cultural ingredients and cooking methods';