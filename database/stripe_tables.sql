-- Stripe Payment Integration Tables for NutriVida

-- Payment Intents Table
CREATE TABLE payment_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd' NOT NULL,
    cultural_background TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, succeeded, failed, canceled
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User Subscriptions Table
CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- blood-sugar-reset, monthly-plan, quarterly-plan
    stripe_payment_intent_id TEXT REFERENCES payment_intents(stripe_payment_intent_id),
    stripe_subscription_id TEXT, -- For recurring subscriptions
    cultural_background TEXT,
    status TEXT DEFAULT 'active' NOT NULL, -- active, inactive, canceled, expired
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE, -- For one-time purchases or subscription end
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Configuration Table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Price in cents
    currency TEXT DEFAULT 'usd' NOT NULL,
    type TEXT DEFAULT 'one_time' NOT NULL, -- one_time, recurring
    interval_type TEXT, -- month, year (for recurring)
    interval_count INTEGER DEFAULT 1, -- Every X months/years
    features JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default products
INSERT INTO products (id, name, description, price, features) VALUES 
(
    'blood-sugar-reset',
    '7-Day Blood Sugar Reset',
    'Culturally-adapted 7-day meal plan to help stabilize blood sugar levels',
    1900, -- $19.00
    '[
        "7-day personalized meal plan",
        "Cultural recipe adaptations", 
        "Shopping list and prep guides",
        "Nutrition tracking dashboard",
        "Email support"
    ]'
),
(
    'monthly-plan',
    'Monthly Cultural Health Plan',
    'Comprehensive monthly subscription with ongoing meal plans and coaching',
    9900, -- $99.00
    '[
        "Weekly meal plan updates",
        "Progress tracking tools",
        "Cultural nutrition coaching",
        "Recipe video tutorials",
        "Community access",
        "Priority email support"
    ]'
),
(
    'quarterly-plan',
    'Quarterly Cultural Health Plan',
    '3-month intensive program with personal coaching and advanced features',
    24900, -- $249.00
    '[
        "Everything in Monthly Plan",
        "One-on-one coaching calls",
        "Custom meal plan adjustments",
        "Health outcome tracking",
        "Family meal planning",
        "Advanced analytics dashboard"
    ]'
);

-- Payment History View
CREATE VIEW payment_history AS
SELECT 
    pi.id,
    pi.user_id,
    u.email,
    u.full_name,
    pi.stripe_payment_intent_id,
    pi.product_id,
    p.name as product_name,
    pi.amount,
    pi.currency,
    pi.cultural_background,
    pi.status,
    pi.created_at,
    pi.completed_at,
    us.start_date as subscription_start,
    us.end_date as subscription_end,
    us.status as subscription_status
FROM payment_intents pi
JOIN users u ON pi.user_id = u.id
LEFT JOIN products p ON pi.product_id = p.id
LEFT JOIN user_subscriptions us ON pi.stripe_payment_intent_id = us.stripe_payment_intent_id
ORDER BY pi.created_at DESC;

-- Indexes for better performance
CREATE INDEX idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_product_id ON user_subscriptions(product_id);

-- Row Level Security
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_intents
CREATE POLICY "Users can view own payment intents" ON payment_intents 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment intents" ON payment_intents 
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_subscriptions  
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions 
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for products (read-only for authenticated users)
CREATE POLICY "Authenticated users can view products" ON products 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage products" ON products 
    FOR ALL USING (auth.role() = 'service_role');

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(user_uuid UUID, product_type TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscription_count
    FROM user_subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND (product_type IS NULL OR product_id = product_type)
    AND (end_date IS NULL OR end_date > NOW());
    
    RETURN subscription_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    product_id TEXT,
    product_name TEXT,
    status TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    cultural_background TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.product_id,
        p.name as product_name,
        us.status,
        us.start_date,
        us.end_date,
        us.cultural_background
    FROM user_subscriptions us
    JOIN products p ON us.product_id = p.id
    WHERE us.user_id = user_uuid
    AND us.status = 'active'
    ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;