require('dotenv').config();
const { getSupabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🗄️  Initializing NutriVida database...\n');
  
  const supabase = getSupabase();
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('❌ Tables do not exist. Please run the schema in Supabase dashboard.');
      console.log('📋 Steps to create schema:');
      console.log('   1. Go to https://supabase.com/dashboard/projects');
      console.log('   2. Select your nutrivida project');
      console.log('   3. Go to SQL Editor → New Query');
      console.log('   4. Copy and paste the contents of database/schema.sql');
      console.log('   5. Click RUN to execute the schema');
      console.log('   6. Run this script again to verify');
      return false;
    } else if (testError) {
      console.log('❌ Database connection error:', testError.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test each table exists
    console.log('\n2. Checking database schema...');
    
    const tables = [
      'users',
      'health_profiles', 
      'meal_plans',
      'progress_entries',
      'subscriptions',
      'quiz_responses',
      'cultural_foods'
    ];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table '${table}' check failed:`, error.message);
          return false;
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
        return false;
      }
    }
    
    // Check if cultural foods have sample data
    console.log('\n3. Checking sample data...');
    const { data: culturalFoods, error: foodsError } = await supabase
      .from('cultural_foods')
      .select('*')
      .limit(5);
      
    if (foodsError) {
      console.log('❌ Error checking cultural foods:', foodsError.message);
      return false;
    }
    
    if (culturalFoods && culturalFoods.length > 0) {
      console.log(`✅ Sample cultural foods loaded (${culturalFoods.length} items)`);
      console.log('   Sample foods:', culturalFoods.map(f => f.name).join(', '));
    } else {
      console.log('⚠️  No sample cultural foods found (this is OK for fresh setup)');
    }
    
    // Test RLS policies (basic check)
    console.log('\n4. Testing Row Level Security...');
    try {
      // This should work even without auth since cultural_foods allows public read
      const { data: publicData, error: publicError } = await supabase
        .from('cultural_foods')
        .select('name')
        .limit(1);
        
      if (!publicError) {
        console.log('✅ RLS policies appear to be working');
      } else {
        console.log('⚠️  RLS test inconclusive:', publicError.message);
      }
    } catch (err) {
      console.log('⚠️  RLS test failed:', err.message);
    }
    
    console.log('\n🎉 Database initialization complete!');
    console.log('🚀 NutriVida database is ready for development.');
    
    return true;
    
  } catch (error) {
    console.log('❌ Unexpected error during database initialization:', error.message);
    return false;
  }
}

// Helper function to display schema instructions
function displaySchemaInstructions() {
  console.log('\n📋 SCHEMA SETUP INSTRUCTIONS:');
  console.log('===============================');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: nutrivida');
  console.log('3. Navigate to: SQL Editor → New Query');
  console.log('4. Copy the entire contents of: database/schema.sql');
  console.log('5. Paste into the SQL editor');
  console.log('6. Click the "RUN" button');
  console.log('7. Wait for "Success" message');
  console.log('8. Run this script again: npm run db:init');
  console.log('===============================\n');
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (!success) {
        displaySchemaInstructions();
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      displaySchemaInstructions();
      process.exit(1);
    });
}

module.exports = { initializeDatabase, displaySchemaInstructions };