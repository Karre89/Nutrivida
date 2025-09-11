const express = require('express');
const { body, validationResult } = require('express-validator');
const { getSupabase } = require('../config/supabase');
const { createUserProfile } = require('../utils/supabaseHelpers');

const router = express.Router();

// Validation middleware
const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('culturalBackground')
    .isIn(['latino', 'somali', 'south_asian', 'mediterranean', 'caribbean', 'middle_eastern'])
    .withMessage('Please select a valid cultural background')
];

const validateSignin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
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
 * POST /api/auth/signup
 * Register a new user account
 */
router.post('/signup', validateSignup, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, fullName, culturalBackground, age, timezone } = req.body;
    
    const supabase = getSupabase();
    
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          cultural_background: culturalBackground
        }
      }
    });
    
    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
        code: authError.status
      });
    }
    
    // Create user profile in our database
    if (authData.user && !authError) {
      try {
        await createUserProfile(authData.user.id, {
          email,
          full_name: fullName,
          cultural_background: culturalBackground,
          age: age || null,
          timezone: timezone || 'America/New_York'
        });
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // User is created in auth but profile creation failed
        // This is recoverable - they can complete profile later
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        emailConfirmed: authData.user?.email_confirmed_at ? true : false
      },
      session: authData.session
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
router.post('/signin', validateSignin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: error.status
      });
    }
    
    res.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at ? true : false,
        lastSignIn: data.user.last_sign_in_at
      },
      session: data.session
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign in. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/signout
 * Sign out current user
 */
router.post('/signout', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }
    
    // Set the session for this request
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: req.body.refresh_token
    });
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Signed out successfully'
    });
    
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign out. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Send password reset email
 */
router.post('/reset-password', validatePasswordReset, handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    
    const supabase = getSupabase();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/update-password
 * Update user password (requires valid session)
 */
router.post('/update-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    const supabase = getSupabase();
    
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }
    
    // Set the session for this request
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: req.body.refresh_token
    });
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }
    
    // Set the session for this request
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: req.body.refresh_token || req.headers['x-refresh-token']
    });
    
    if (sessionError || !sessionData.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }
    
    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        health_profiles (*),
        subscriptions (*)
      `)
      .eq('id', sessionData.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
    }
    
    res.json({
      success: true,
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailConfirmed: sessionData.user.email_confirmed_at ? true : false,
        lastSignIn: sessionData.user.last_sign_in_at,
        profile: userData || null
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh user session
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });
    
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Session refreshed successfully',
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at ? true : false
      }
    });
    
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;