const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');
const { authenticateUser } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const emailService = new EmailService();

// Send welcome email after quiz completion
router.post('/welcome', authenticateUser, async (req, res) => {
  try {
    const { email, fullName, culturalBackground } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required'
      });
    }

    await emailService.sendWelcomeEmail(email, fullName, culturalBackground);
    
    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
});

// Send meal plan ready notification
router.post('/meal-plan-ready', authenticateUser, async (req, res) => {
  try {
    const { email, fullName, culturalBackground } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required'
      });
    }

    await emailService.sendMealPlanReady(email, fullName, culturalBackground);
    
    res.json({
      success: true,
      message: 'Meal plan ready email sent successfully'
    });
  } catch (error) {
    console.error('Error sending meal plan ready email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send meal plan ready email',
      error: error.message
    });
  }
});

// Send weekly check-in email
router.post('/weekly-checkin', authenticateUser, async (req, res) => {
  try {
    const { email, fullName, culturalBackground } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required'
      });
    }

    await emailService.sendWeeklyCheckIn(email, fullName, culturalBackground);
    
    res.json({
      success: true,
      message: 'Weekly check-in email sent successfully'
    });
  } catch (error) {
    console.error('Error sending weekly check-in email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send weekly check-in email',
      error: error.message
    });
  }
});

// Send payment confirmation
router.post('/payment-confirmation', authenticateUser, async (req, res) => {
  try {
    const { email, fullName, productName, amount, culturalBackground } = req.body;
    
    if (!email || !fullName || !productName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, product name, and amount are required'
      });
    }

    await emailService.sendPaymentConfirmation(
      email, 
      fullName, 
      productName, 
      amount, 
      culturalBackground
    );
    
    res.json({
      success: true,
      message: 'Payment confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment confirmation email',
      error: error.message
    });
  }
});

// Send abandoned cart recovery email
router.post('/abandoned-cart', async (req, res) => {
  try {
    const { email, fullName, culturalBackground } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required'
      });
    }

    await emailService.sendAbandonedCartEmail(email, fullName, culturalBackground);
    
    res.json({
      success: true,
      message: 'Abandoned cart email sent successfully'
    });
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send abandoned cart email',
      error: error.message
    });
  }
});

// Schedule email sequence for new user
router.post('/schedule-sequence', authenticateUser, async (req, res) => {
  try {
    const { userId, email, fullName, culturalBackground } = req.body;
    
    if (!userId || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'User ID, email, and full name are required'
      });
    }

    // Schedule welcome email immediately
    await emailService.sendWelcomeEmail(email, fullName, culturalBackground);
    
    // Schedule meal plan ready email after 5 minutes (for demo - would be hours in production)
    setTimeout(async () => {
      try {
        await emailService.sendMealPlanReady(email, fullName, culturalBackground);
      } catch (error) {
        console.error('Error sending scheduled meal plan email:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Schedule first weekly check-in after 3 days (for demo - 3 minutes)
    setTimeout(async () => {
      try {
        await emailService.sendWeeklyCheckIn(email, fullName, culturalBackground);
      } catch (error) {
        console.error('Error sending scheduled check-in email:', error);
      }
    }, 3 * 60 * 1000); // 3 minutes
    
    res.json({
      success: true,
      message: 'Email sequence scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling email sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule email sequence',
      error: error.message
    });
  }
});

// Get email templates (for testing/preview)
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      welcome: 'Welcome email template',
      mealPlanReady: 'Meal plan ready template',
      weeklyCheckIn: 'Weekly check-in template',
      paymentConfirmation: 'Payment confirmation template',
      abandonedCart: 'Abandoned cart template'
    };
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email templates',
      error: error.message
    });
  }
});

module.exports = router;