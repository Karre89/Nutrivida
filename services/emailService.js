const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SG.placeholder-key') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback SMTP transporter for development
const createSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email', // Use Ethereal for testing
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email', // Replace with actual test credentials
      pass: 'ethereal.pass'
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: {
    subject: '🎉 Welcome to Your Cultural Health Journey!',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 2rem; text-align: center; }
          .content { padding: 2rem; }
          .cta { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
          .feature { background: #f9fafb; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid #ef6820; }
          .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to NutriVida!</h1>
          <p>Your ${data.cultureName} health journey starts now</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.fullName || 'there'}!</h2>
          
          <p>Thank you for completing your cultural health assessment. We're excited to help you achieve your health goals while honoring your ${data.cultureName} heritage.</p>
          
          <div class="feature">
            <h3>🍽️ Your Personalized Plan</h3>
            <p>Your ${data.cultureName} meal plan is being generated with authentic recipes adapted for optimal health outcomes.</p>
          </div>
          
          <div class="feature">
            <h3>🎯 Primary Goal: ${data.primaryGoal}</h3>
            <p>We've tailored everything around your main focus to ensure you see real results.</p>
          </div>
          
          <a href="${process.env.CLIENT_URL}/dashboard" class="cta">Access Your Dashboard</a>
          
          <h3>What happens next?</h3>
          <ul>
            <li>📧 You'll receive your meal plan within 24 hours</li>
            <li>🛒 Get your personalized shopping list</li>
            <li>📱 Track your progress on your dashboard</li>
            <li>💬 Join our supportive community</li>
          </ul>
          
          <p><strong>Questions?</strong> Just reply to this email - we're here to help!</p>
        </div>
        
        <div class="footer">
          <p>NutriVida - Culture-First Health Platform</p>
          <p>Honoring your heritage, optimizing your health</p>
        </div>
      </body>
      </html>
    `
  },

  mealPlanReady: {
    subject: '🍽️ Your Cultural Meal Plan is Ready!',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 2rem; text-align: center; }
          .content { padding: 2rem; }
          .cta { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
          .recipe-preview { background: #f9fafb; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; }
          .day-preview { display: inline-block; margin: 0.5rem; padding: 1rem; background: white; border-radius: 6px; border: 2px solid #ef6820; }
          .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your ${data.cultureName} Meal Plan is Ready! 🎉</h1>
        </div>
        
        <div class="content">
          <h2>Hi ${data.fullName || 'there'}!</h2>
          
          <p>Great news! Your personalized ${data.duration}-day ${data.cultureName} meal plan has been generated and is waiting for you.</p>
          
          <div class="recipe-preview">
            <h3>📅 Your Week Overview</h3>
            <p><strong>Total Recipes:</strong> ${data.totalRecipes || 21} culturally authentic dishes</p>
            <p><strong>Average Calories:</strong> ${data.avgCalories || '1,650'} per day</p>
            <p><strong>Cultural Focus:</strong> ${data.cultureName} flavors with health optimization</p>
            
            <div style="text-align: center; margin: 1rem 0;">
              ${Array.from({length: 7}, (_, i) => `<div class="day-preview">Day ${i+1}</div>`).join('')}
            </div>
          </div>
          
          <a href="${process.env.CLIENT_URL}/meal-plan" class="cta">View Your Meal Plan</a>
          
          <h3>What's Included:</h3>
          <ul>
            <li>🥘 ${data.cultureName} breakfast, lunch & dinner recipes</li>
            <li>🛒 Complete shopping list organized by store section</li>
            <li>⏰ Prep time and cooking instructions</li>
            <li>📊 Nutrition facts for each meal</li>
            <li>💡 Cultural cooking tips and substitutions</li>
          </ul>
          
          <p><strong>Pro Tip:</strong> Start by reviewing your favorite-looking recipes and plan your first shopping trip. Most ingredients can be found at your local grocery store!</p>
        </div>
        
        <div class="footer">
          <p>Questions about your meal plan? Reply to this email!</p>
          <p>NutriVida - Honoring your heritage, optimizing your health</p>
        </div>
      </body>
      </html>
    `
  },

  weeklyCheckIn: {
    subject: '💪 How is your health journey going?',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 2rem; text-align: center; }
          .content { padding: 2rem; }
          .cta { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
          .progress-card { background: #f0fdf4; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid #16a34a; }
          .tip { background: #fff7ed; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Week ${data.weekNumber} Check-In</h1>
          <p>How are you feeling on your ${data.cultureName} health journey?</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.fullName || 'there'}!</h2>
          
          <p>It's been ${data.daysActive || 7} days since you started your cultural health journey. We'd love to hear how it's going!</p>
          
          <div class="progress-card">
            <h3>🎯 Quick Progress Check</h3>
            <p>Take 2 minutes to update your progress and see how you're doing:</p>
            <ul>
              <li>Energy levels compared to when you started</li>
              <li>How you're feeling about the ${data.cultureName} recipes</li>
              <li>Any challenges you're facing</li>
              <li>Favorite meals so far</li>
            </ul>
          </div>
          
          <a href="${process.env.CLIENT_URL}/dashboard?tab=progress" class="cta">Update My Progress</a>
          
          <div class="tip">
            <h3>💡 This Week's Cultural Tip</h3>
            <p><strong>Spice Spotlight:</strong> ${data.culturalTip || 'Try incorporating traditional spices gradually. They not only add authentic flavor but many have anti-inflammatory properties that support your health goals.'}</p>
          </div>
          
          <h3>Need Support?</h3>
          <p>Remember, we're here to help! Common questions at this stage:</p>
          <ul>
            <li>🛒 Where to find specific cultural ingredients</li>
            <li>🥘 Recipe modifications for dietary restrictions</li>
            <li>⏰ Time-saving meal prep strategies</li>
            <li>👨‍👩‍👧‍👦 Adapting recipes for family preferences</li>
          </ul>
          
          <p>Just reply to this email with any questions!</p>
        </div>
        
        <div class="footer">
          <p>Keep up the great work on your health journey!</p>
          <p>NutriVida - Culture-First Health Platform</p>
        </div>
      </body>
      </html>
    `
  },

  paymentConfirmation: {
    subject: '✅ Payment Confirmed - Your Premium Access is Active!',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 2rem; text-align: center; }
          .content { padding: 2rem; }
          .cta { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
          .receipt { background: #f9fafb; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #e5e7eb; }
          .unlock-item { background: #f0fdf4; padding: 1rem; margin: 0.5rem 0; border-radius: 6px; border-left: 4px solid #16a34a; }
          .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Payment Confirmed!</h1>
          <p>Welcome to your premium ${data.cultureName} health experience</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.fullName || 'there'}!</h2>
          
          <p>Thank you for your purchase! Your payment has been processed and your premium access is now active.</p>
          
          <div class="receipt">
            <h3>📄 Purchase Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td><strong>Product:</strong></td><td>${data.productName}</td></tr>
              <tr><td><strong>Amount:</strong></td><td>$${data.amount}</td></tr>
              <tr><td><strong>Cultural Focus:</strong></td><td>${data.cultureName}</td></tr>
              <tr><td><strong>Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
              <tr><td><strong>Transaction ID:</strong></td><td>${data.transactionId || 'Included in receipt'}</td></tr>
            </table>
          </div>
          
          <h3>🔓 You Now Have Access To:</h3>
          
          <div class="unlock-item">
            <strong>✅ Complete ${data.cultureName} Meal Plan</strong><br>
            Full ${data.duration || 7}-day meal plan with authentic recipes
          </div>
          
          <div class="unlock-item">
            <strong>✅ Detailed Recipe Instructions</strong><br>
            Step-by-step cooking guides with cultural tips
          </div>
          
          <div class="unlock-item">
            <strong>✅ Smart Shopping Lists</strong><br>
            Organized by store sections with ingredient substitutions
          </div>
          
          <div class="unlock-item">
            <strong>✅ Nutrition Tracking Dashboard</strong><br>
            Monitor your progress and health outcomes
          </div>
          
          <div class="unlock-item">
            <strong>✅ Email Support</strong><br>
            Direct access to our cultural nutrition experts
          </div>
          
          <a href="${process.env.CLIENT_URL}/meal-plan" class="cta">Access Your Premium Content</a>
          
          <p><strong>🎁 Bonus:</strong> You also get lifetime access to any updates or improvements to your meal plan!</p>
          
          <p><strong>Questions or need help getting started?</strong> Just reply to this email - we're here to support your success.</p>
          
          <div style="text-align: center; margin: 2rem 0; padding: 1rem; background: #fff7ed; border-radius: 8px;">
            <p><strong>💰 30-Day Money-Back Guarantee</strong></p>
            <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Welcome to the NutriVida premium family!</p>
          <p>We're excited to support your cultural health journey.</p>
        </div>
      </body>
      </html>
    `
  },

  abandonedCart: {
    subject: '🛒 Your cultural meal plan is waiting for you',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 2rem; text-align: center; }
          .content { padding: 2rem; }
          .cta { background: linear-gradient(135deg, #ef6820, #f28a33); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
          .urgency { background: #fef3c7; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .testimonial { background: #f0fdf4; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; font-style: italic; }
          .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Don't lose your progress!</h1>
          <p>Your ${data.cultureName} health plan is still available</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.fullName || 'there'}!</h2>
          
          <p>We noticed you were interested in your personalized ${data.cultureName} meal plan but didn't complete your purchase. No worries - it happens!</p>
          
          <div class="urgency">
            <h3>⏰ Your Plan is Reserved for 48 Hours</h3>
            <p>We've temporarily saved your cultural assessment results and personalized recommendations. Complete your purchase now to secure your ${data.cultureName} meal plan.</p>
          </div>
          
          <p><strong>Quick reminder of what you'll get:</strong></p>
          <ul>
            <li>🍽️ 7-day ${data.cultureName} meal plan ($47 value)</li>
            <li>🛒 Smart shopping lists ($15 value)</li>
            <li>📊 Nutrition tracking tools ($25 value)</li>
            <li>💬 Email support ($20 value)</li>
            <li>🎁 Bonus cultural cooking tips (Priceless!)</li>
          </ul>
          
          <div style="text-align: center; margin: 2rem 0;">
            <p style="text-decoration: line-through; color: #6b7280; font-size: 1.2rem;">Total Value: $107</p>
            <p style="font-size: 2rem; font-weight: bold; color: #ef6820;">Your Price: Only $19</p>
          </div>
          
          <a href="${process.env.CLIENT_URL}/payment?product=blood-sugar-reset" class="cta">Complete My Purchase - $19</a>
          
          <div class="testimonial">
            <p>"I was skeptical at first, but the ${data.cultureName || 'cultural'} recipes are amazing! I've lost 8 pounds and my energy is through the roof. My family loves the authentic flavors." - Maria S.</p>
          </div>
          
          <p><strong>Still have questions?</strong> Just reply to this email. We're here to help you succeed with your cultural health goals!</p>
          
          <div style="text-align: center; margin: 2rem 0; padding: 1rem; background: #f0fdf4; border-radius: 8px;">
            <p><strong>💰 30-Day Money-Back Guarantee</strong></p>
            <p>Try it risk-free. If you're not satisfied, get a full refund.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Don't let your health goals wait any longer!</p>
          <p>NutriVida - Culture-First Health Platform</p>
        </div>
      </body>
      </html>
    `
  }
};

// Email service class
class EmailService {
  constructor() {
    this.sgMail = sgMail;
    this.smtpTransporter = null;
    this.useSmtp = !process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'SG.placeholder-key';
    
    if (this.useSmtp) {
      this.smtpTransporter = createSMTPTransporter();
    }
  }

  async sendEmail(to, templateName, data = {}) {
    try {
      const template = emailTemplates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const emailData = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: process.env.FROM_EMAIL || 'noreply@nutrivida.com',
          name: process.env.FROM_NAME || 'NutriVida'
        },
        subject: template.subject,
        html: template.getHtml(data)
      };

      let result;
      
      if (this.useSmtp) {
        // Use SMTP for development/testing
        result = await this.smtpTransporter.sendMail({
          from: `"${emailData.from.name}" <${emailData.from.email}>`,
          to: emailData.to.join(', '),
          subject: emailData.subject,
          html: emailData.html
        });
        
        console.log('📧 Email sent via SMTP:', {
          to: emailData.to,
          subject: emailData.subject,
          messageId: result.messageId
        });
      } else {
        // Use SendGrid for production
        result = await this.sgMail.send(emailData);
        console.log('📧 Email sent via SendGrid:', {
          to: emailData.to,
          subject: emailData.subject
        });
      }

      return {
        success: true,
        messageId: result.messageId || result[0]?.headers?.['x-message-id'],
        provider: this.useSmtp ? 'SMTP' : 'SendGrid'
      };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      
      return {
        success: false,
        error: error.message,
        provider: this.useSmtp ? 'SMTP' : 'SendGrid'
      };
    }
  }

  // Send welcome email after quiz completion
  async sendWelcomeEmail(userEmail, userData) {
    const cultureNames = {
      'latino': 'Latino',
      'somali': 'Somali', 
      'south_asian': 'South Asian',
      'mediterranean': 'Mediterranean',
      'caribbean': 'Caribbean',
      'middle_eastern': 'Middle Eastern'
    };

    return this.sendEmail(userEmail, 'welcome', {
      fullName: userData.fullName,
      cultureName: cultureNames[userData.culturalBackground] || 'Cultural',
      primaryGoal: userData.primaryGoal || 'Better health'
    });
  }

  // Send meal plan ready notification
  async sendMealPlanReadyEmail(userEmail, mealPlanData) {
    const cultureNames = {
      'latino': 'Latino',
      'somali': 'Somali',
      'south_asian': 'South Asian', 
      'mediterranean': 'Mediterranean',
      'caribbean': 'Caribbean',
      'middle_eastern': 'Middle Eastern'
    };

    return this.sendEmail(userEmail, 'mealPlanReady', {
      fullName: mealPlanData.fullName,
      cultureName: cultureNames[mealPlanData.culturalTheme] || 'Cultural',
      duration: mealPlanData.duration || 7,
      totalRecipes: mealPlanData.totalRecipes || 21,
      avgCalories: mealPlanData.avgCalories || '1,650'
    });
  }

  // Send weekly check-in
  async sendWeeklyCheckIn(userEmail, userData) {
    const cultureNames = {
      'latino': 'Latino',
      'somali': 'Somali',
      'south_asian': 'South Asian',
      'mediterranean': 'Mediterranean', 
      'caribbean': 'Caribbean',
      'middle_eastern': 'Middle Eastern'
    };

    const culturalTips = {
      'latino': 'Cumin and chili powder are rich in antioxidants and can help boost metabolism naturally.',
      'somali': 'Cardamom not only adds authentic flavor but aids digestion and has anti-inflammatory properties.',
      'south_asian': 'Turmeric is a powerful anti-inflammatory spice - add it to rice, vegetables, and proteins.',
      'mediterranean': 'Extra virgin olive oil provides healthy fats that support heart health and nutrient absorption.',
      'caribbean': 'Scotch bonnet peppers contain capsaicin which can boost metabolism and reduce inflammation.',
      'middle_eastern': 'Za\'atar contains sumac and thyme which are rich in antioxidants and support immune health.'
    };

    return this.sendEmail(userEmail, 'weeklyCheckIn', {
      fullName: userData.fullName,
      cultureName: cultureNames[userData.culturalBackground] || 'Cultural',
      weekNumber: userData.weekNumber || 1,
      daysActive: userData.daysActive || 7,
      culturalTip: culturalTips[userData.culturalBackground]
    });
  }

  // Send payment confirmation
  async sendPaymentConfirmation(userEmail, paymentData) {
    const cultureNames = {
      'latino': 'Latino',
      'somali': 'Somali',
      'south_asian': 'South Asian',
      'mediterranean': 'Mediterranean',
      'caribbean': 'Caribbean', 
      'middle_eastern': 'Middle Eastern'
    };

    return this.sendEmail(userEmail, 'paymentConfirmation', {
      fullName: paymentData.fullName,
      cultureName: cultureNames[paymentData.culturalBackground] || 'Cultural',
      productName: paymentData.productName,
      amount: (paymentData.amount / 100).toFixed(2), // Convert from cents
      duration: paymentData.duration || 7,
      transactionId: paymentData.transactionId
    });
  }

  // Send abandoned cart email
  async sendAbandonedCartEmail(userEmail, userData) {
    const cultureNames = {
      'latino': 'Latino',
      'somali': 'Somali',
      'south_asian': 'South Asian',
      'mediterranean': 'Mediterranean',
      'caribbean': 'Caribbean',
      'middle_eastern': 'Middle Eastern'
    };

    return this.sendEmail(userEmail, 'abandonedCart', {
      fullName: userData.fullName,
      cultureName: cultureNames[userData.culturalBackground] || 'Cultural'
    });
  }

  // Schedule automated email sequences
  async scheduleEmailSequence(userEmail, sequenceType, userData, delays = {}) {
    console.log(`📅 Scheduling ${sequenceType} email sequence for ${userEmail}`);

    const defaultDelays = {
      welcome: 0, // Immediate
      mealPlanReady: 24 * 60 * 60 * 1000, // 24 hours
      weeklyCheckIn: 7 * 24 * 60 * 60 * 1000, // 7 days
      abandonedCart: 2 * 60 * 60 * 1000 // 2 hours
    };

    const scheduleDelays = { ...defaultDelays, ...delays };

    // In a production environment, you would use a job queue like Bull or Agenda
    // For now, we'll simulate with setTimeout for demo purposes
    
    if (sequenceType === 'onboarding') {
      // Welcome sequence
      setTimeout(async () => {
        await this.sendWelcomeEmail(userEmail, userData);
      }, scheduleDelays.welcome);

      // Meal plan ready (simulated)
      setTimeout(async () => {
        await this.sendMealPlanReadyEmail(userEmail, {
          fullName: userData.fullName,
          culturalTheme: userData.culturalBackground,
          duration: 7
        });
      }, scheduleDelays.mealPlanReady);

      // Weekly check-in
      setTimeout(async () => {
        await this.sendWeeklyCheckIn(userEmail, {
          ...userData,
          weekNumber: 1,
          daysActive: 7
        });
      }, scheduleDelays.weeklyCheckIn);
    }

    if (sequenceType === 'abandonedCart') {
      setTimeout(async () => {
        await this.sendAbandonedCartEmail(userEmail, userData);
      }, scheduleDelays.abandonedCart);
    }

    return {
      success: true,
      message: `${sequenceType} email sequence scheduled for ${userEmail}`,
      delays: scheduleDelays
    };
  }

  // Test email functionality
  async sendTestEmail(to, testData = {}) {
    return this.sendEmail(to, 'welcome', {
      fullName: testData.fullName || 'Test User',
      cultureName: testData.cultureName || 'Latino',
      primaryGoal: testData.primaryGoal || 'Better blood sugar control'
    });
  }
}

module.exports = EmailService;