const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabase } = require('../config/supabase');
const supabase = getSupabase();
const { authenticateUser } = require('../middleware/auth');
const EmailService = require('../services/emailService');

const router = express.Router();

// Initialize email service
const emailService = new EmailService();

// Products configuration
const PRODUCTS = {
  'blood-sugar-reset': {
    name: '7-Day Blood Sugar Reset',
    price: 1900, // $19.00 in cents
    description: 'Culturally-adapted 7-day meal plan to help stabilize blood sugar levels',
    features: [
      '7-day personalized meal plan',
      'Cultural recipe adaptations',
      'Shopping list and prep guides',
      'Nutrition tracking dashboard',
      'Email support'
    ]
  },
  'monthly-plan': {
    name: 'Monthly Cultural Health Plan',
    price: 9900, // $99.00 in cents
    description: 'Comprehensive monthly subscription with ongoing meal plans and coaching',
    features: [
      'Weekly meal plan updates',
      'Progress tracking tools',
      'Cultural nutrition coaching',
      'Recipe video tutorials',
      'Community access',
      'Priority email support'
    ]
  },
  'quarterly-plan': {
    name: 'Quarterly Cultural Health Plan',
    price: 24900, // $249.00 in cents
    description: '3-month intensive program with personal coaching and advanced features',
    features: [
      'Everything in Monthly Plan',
      'One-on-one coaching calls',
      'Custom meal plan adjustments',
      'Health outcome tracking',
      'Family meal planning',
      'Advanced analytics dashboard'
    ]
  }
};

// Create payment intent
router.post('/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    const { productId, culturalBackground, email } = req.body;

    if (!PRODUCTS[productId]) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = PRODUCTS[productId];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'usd',
      metadata: {
        productId,
        culturalBackground: culturalBackground || 'unknown',
        userEmail: email || req.user.email,
        userId: req.user.id
      },
      description: `${product.name} - ${culturalBackground || 'Cultural'} Adaptation`
    });

    // Store payment intent in database
    const { error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        user_id: req.user.id,
        stripe_payment_intent_id: paymentIntent.id,
        product_id: productId,
        amount: product.price,
        cultural_background: culturalBackground,
        status: 'pending',
        created_at: new Date()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if database logging fails
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: product.price,
      productName: product.name
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get product information
router.get('/products/:productId', (req, res) => {
  const { productId } = req.params;
  
  if (!PRODUCTS[productId]) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = PRODUCTS[productId];
  res.json({
    id: productId,
    name: product.name,
    price: product.price,
    priceDisplay: `$${(product.price / 100).toFixed(2)}`,
    description: product.description,
    features: product.features
  });
});

// Get all products
router.get('/products', (req, res) => {
  const products = Object.keys(PRODUCTS).map(id => ({
    id,
    name: PRODUCTS[id].name,
    price: PRODUCTS[id].price,
    priceDisplay: `$${(PRODUCTS[id].price / 100).toFixed(2)}`,
    description: PRODUCTS[id].description,
    features: PRODUCTS[id].features
  }));

  res.json({ products });
});

// Handle successful payment
router.post('/payment-success', authenticateUser, async (req, res) => {
  try {
    const { paymentIntentId, culturalBackground } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const productId = paymentIntent.metadata.productId;
    const userId = req.user.id;

    // Update payment intent status in database
    const { error: updateError } = await supabase
      .from('payment_intents')
      .update({ 
        status: 'succeeded',
        completed_at: new Date()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating payment intent:', updateError);
    }

    // Create user subscription/purchase record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        stripe_payment_intent_id: paymentIntentId,
        cultural_background: culturalBackground,
        status: 'active',
        start_date: new Date(),
        created_at: new Date()
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return res.status(500).json({ error: 'Failed to activate subscription' });
    }

    // Generate initial meal plan for the user
    try {
      // This would trigger meal plan generation
      // For now, we'll just mark it as pending
      await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          cultural_theme: culturalBackground,
          duration: productId === 'blood-sugar-reset' ? 7 : 30,
          status: 'generating',
          created_at: new Date()
        });
    } catch (mealPlanError) {
      console.error('Error creating initial meal plan:', mealPlanError);
      // Don't fail the payment success if meal plan creation fails
    }

    // Get user details for email
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Send payment confirmation email
    if (user) {
      const productName = PRODUCTS[productId].name;
      const amount = PRODUCTS[productId].price / 100; // Convert cents to dollars
      
      emailService.sendPaymentConfirmation(
        user.email,
        user.full_name || 'Customer',
        productName,
        amount,
        culturalBackground
      )
      .then(() => {
        console.log(`Payment confirmation email sent to ${user.email}`);
      })
      .catch((emailError) => {
        console.error(`Failed to send payment confirmation email:`, emailError);
      });

      // Schedule first weekly check-in email for next week (for demo - 2 minutes)
      setTimeout(async () => {
        try {
          await emailService.sendWeeklyCheckIn(
            user.email,
            user.full_name || 'Customer',
            culturalBackground
          );
          console.log(`First weekly check-in email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send weekly check-in email:`, emailError);
        }
      }, 2 * 60 * 1000); // 2 minutes for demo
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      productId,
      subscriptionStatus: 'active',
      nextSteps: {
        mealPlan: 'Your cultural meal plan is being generated',
        dashboard: 'Access your dashboard to track progress',
        support: 'Check your email for getting started guide'
      }
    });

  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ error: 'Failed to process payment completion' });
  }
});

// Track abandoned cart (user created payment intent but didn't complete)
router.post('/track-abandoned-cart', authenticateUser, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Get cultural background from most recent quiz response
    const { data: quizResponse } = await supabase
      .from('quiz_responses')
      .select('cultural_background')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const culturalBackground = quizResponse?.cultural_background || 'latino';

    // Send abandoned cart recovery email after 1 hour (for demo - 1 minute)
    setTimeout(async () => {
      try {
        await emailService.sendAbandonedCartEmail(
          user.email,
          user.full_name || 'Friend',
          culturalBackground
        );
        console.log(`Abandoned cart email sent to ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send abandoned cart email:`, emailError);
      }
    }, 1 * 60 * 1000); // 1 minute for demo

    res.json({
      success: true,
      message: 'Abandoned cart tracking initiated'
    });

  } catch (error) {
    console.error('Error tracking abandoned cart:', error);
    res.status(500).json({ error: 'Failed to track abandoned cart' });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`Payment for ${paymentIntent.amount} succeeded!`);
      
      // Update database
      await supabase
        .from('payment_intents')
        .update({ 
          status: 'succeeded',
          completed_at: new Date()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);
      
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`Payment for ${failedPayment.amount} failed!`);
      
      await supabase
        .from('payment_intents')
        .update({ 
          status: 'failed',
          completed_at: new Date()
        })
        .eq('stripe_payment_intent_id', failedPayment.id);
      
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get user's active subscriptions
router.get('/subscriptions', authenticateUser, async (req, res) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Add product details to each subscription
    const enrichedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      product: PRODUCTS[sub.product_id] || null
    }));

    res.json({ subscriptions: enrichedSubscriptions });

  } catch (error) {
    console.error('Error in subscriptions endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

module.exports = router;