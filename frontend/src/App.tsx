import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/LandingPage';
import HealthQuiz from './components/HealthQuiz';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/quiz" element={<HealthQuiz />} />
            
            {/* Auth routes - redirect if already logged in */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requiresAuth={false}>
                  <LoginForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <ProtectedRoute requiresAuth={false}>
                  <SignUpForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiresAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Additional auth pages */}
            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requiresAuth={false}>
                  <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                      <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Reset Password</h2>
                      <p className="text-center text-gray-600">Password reset functionality coming soon.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/terms" 
              element={
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Terms of Service</h2>
                    <p className="text-center text-gray-600">Terms of Service page coming soon.</p>
                  </div>
                </div>
              } 
            />
            <Route 
              path="/privacy" 
              element={
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Privacy Policy</h2>
                    <p className="text-center text-gray-600">Privacy Policy page coming soon.</p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
