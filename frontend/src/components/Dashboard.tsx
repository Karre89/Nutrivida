import React, { useState, useEffect } from 'react';
import { User, Calendar, TrendingUp, Target, LogOut, Settings, ChefHat, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, mealPlanApi } from '../services/api';

interface DashboardData {
  user: any;
  activeMealPlan: any;
  recentProgress: any[];
  dashboardStats: any;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard data (this might fail if backend isn't ready, but that's ok)
      const [dashboardResponse, activeMealPlanResponse] = await Promise.allSettled([
        userApi.getDashboard(),
        mealPlanApi.getActive()
      ]);

      const dashboardStats = dashboardResponse.status === 'fulfilled' ? dashboardResponse.value.data : null;
      const activeMealPlan = activeMealPlanResponse.status === 'fulfilled' ? activeMealPlanResponse.value.data : null;

      setDashboardData({
        user,
        activeMealPlan,
        recentProgress: dashboardStats?.recentProgress || [],
        dashboardStats: dashboardStats || {}
      });
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const generateMealPlan = async () => {
    try {
      setIsLoading(true);
      const response = await mealPlanApi.generate({
        duration: 7,
        culturalTheme: user?.cultural_background
      });
      
      if (response.success) {
        await loadDashboardData(); // Reload dashboard data
      }
    } catch (err: any) {
      setError('Failed to generate meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NutriVida</h1>
                <p className="text-sm text-gray-500">Cultural Nutrition Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700 font-medium">{user?.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Your personalized {user?.cultural_background} nutrition journey continues
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cultural Background</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {user?.cultural_background?.replace('_', ' ')}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Account Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.is_onboarded ? 'Active' : 'Setup Needed'}
                </p>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Email Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.is_email_verified ? 'Verified' : 'Pending'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Meal Plan Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Meal Plan */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Meal Plan</h3>
              <ChefHat className="h-5 w-5 text-emerald-600" />
            </div>

            {dashboardData?.activeMealPlan ? (
              <div>
                <p className="text-2xl font-bold text-emerald-600 mb-2">
                  {dashboardData.activeMealPlan.plan_name}
                </p>
                <p className="text-gray-600 mb-4">
                  {dashboardData.activeMealPlan.duration} days • {dashboardData.activeMealPlan.cultural_theme}
                </p>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                    View Plan
                  </button>
                  <button className="flex-1 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                    Shopping List
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No active meal plan</p>
                <button
                  onClick={generateMealPlan}
                  disabled={isLoading}
                  className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Generate Meal Plan'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <Settings className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Track Progress</p>
                    <p className="text-sm text-gray-500">Log weight, mood, energy</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Shopping List</p>
                    <p className="text-sm text-gray-500">Get ingredients for meals</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Profile Settings</p>
                    <p className="text-sm text-gray-500">Update preferences</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex-shrink-0 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Complete Your Health Profile</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Tell us about your health goals, dietary preferences, and cultural food traditions to get personalized meal plans.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Generate Your First Meal Plan</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get a 7-day culturally-adapted meal plan tailored to your health goals and food preferences.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Track Your Progress</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor your health metrics, energy levels, and how the culturally-adapted meals make you feel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}