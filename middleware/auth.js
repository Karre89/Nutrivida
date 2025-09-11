const { getSupabase } = require('../config/supabase');
const { getUserProfile } = require('../utils/supabaseHelpers');

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabase();
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to optionally authenticate user (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      req.userId = null;
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabase();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Invalid token, continue without authentication
      req.user = null;
      req.userId = null;
      return next();
    }
    
    req.user = user;
    req.userId = user.id;
    
    next();
    
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without authentication in case of error
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * Middleware to check if user has an active subscription
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const supabase = getSupabase();
    
    // Check for active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .single();
    
    if (error || !subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }
    
    // Check if subscription is not expired
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    
    if (periodEnd < now) {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    req.subscription = subscription;
    next();
    
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify subscription status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to check if user has completed onboarding
 */
const requireOnboarding = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userProfile = await getUserProfile(req.userId);
    
    if (!userProfile || !userProfile.is_onboarded) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile setup first',
        code: 'ONBOARDING_REQUIRED'
      });
    }
    
    req.userProfile = userProfile;
    next();
    
  } catch (error) {
    console.error('Onboarding check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify onboarding status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to verify email is confirmed
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (!req.user.email_confirmed_at) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware to check user has specific cultural access
 * Useful for culture-specific content or features
 */
const requireCulturalAccess = (allowedCultures) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userProfile = await getUserProfile(req.userId);
      
      if (!userProfile || !userProfile.cultural_background) {
        return res.status(403).json({
          success: false,
          message: 'Cultural background not set',
          code: 'CULTURAL_BACKGROUND_REQUIRED'
        });
      }
      
      if (!allowedCultures.includes(userProfile.cultural_background)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for your cultural background',
          code: 'CULTURAL_ACCESS_DENIED'
        });
      }
      
      req.userProfile = userProfile;
      next();
      
    } catch (error) {
      console.error('Cultural access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify cultural access',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireActiveSubscription,
  requireOnboarding,
  requireEmailVerification,
  requireCulturalAccess
};