import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      // You might want to redirect to login page here
    }
    return Promise.reject(error);
  }
);

// Types
export interface QuizSubmission {
  email: string;
  culturalBackground: string;
  primaryGoal: string;
  responses: Record<string, any>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Quiz API
export const quizApi = {
  submit: async (data: QuizSubmission) => {
    const response = await api.post('/quiz/submit', data);
    return response.data;
  },
  
  getResponse: async (email: string) => {
    const response = await api.get(`/quiz/response/${email}`);
    return response.data;
  },
  
  trackConversion: async (email: string) => {
    const response = await api.post('/quiz/track-conversion', { email });
    return response.data;
  },
  
  trackSignup: async (email: string) => {
    const response = await api.post('/quiz/track-signup', { email });
    return response.data;
  }
};

// Auth API
export const authApi = {
  signup: async (userData: {
    email: string;
    password: string;
    fullName: string;
    culturalBackground: string;
    age?: number;
    timezone?: string;
  }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  
  signin: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/signin', credentials);
    return response.data;
  },
  
  signout: async (refreshToken: string) => {
    const response = await api.post('/auth/signout', { refresh_token: refreshToken });
    return response.data;
  },
  
  resetPassword: async (email: string) => {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  }
};

// Users API
export const userApi = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (profileData: {
    fullName?: string;
    culturalBackground?: string;
    age?: number;
    timezone?: string;
  }) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  
  createHealthProfile: async (healthData: {
    primaryGoal: string;
    secondaryGoals?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    familySize?: number;
    cookingTimePreference?: number;
    activityLevel?: string;
    currentWeight?: number;
    targetWeight?: number;
    heightFeet?: number;
    heightInches?: number;
    bloodSugarGoal?: number;
    preferredLanguage?: string;
  }) => {
    const response = await api.post('/users/health-profile', healthData);
    return response.data;
  },
  
  getHealthProfile: async () => {
    const response = await api.get('/users/health-profile');
    return response.data;
  },
  
  addProgressEntry: async (progressData: {
    entryDate: string;
    weight?: number;
    bloodSugarMorning?: number;
    bloodSugarEvening?: number;
    energyLevel?: number;
    moodRating?: number;
    progressPhotoUrl?: string;
    notes?: string;
    mealSatisfaction?: number;
    culturalAuthenticityRating?: number;
  }) => {
    const response = await api.post('/users/progress', progressData);
    return response.data;
  },
  
  getProgress: async (days = 30) => {
    const response = await api.get(`/users/progress?days=${days}`);
    return response.data;
  },
  
  getDashboard: async () => {
    const response = await api.get('/users/dashboard');
    return response.data;
  }
};

// Meal Plans API
export const mealPlanApi = {
  generate: async (planData: {
    duration?: number;
    startDate?: string;
    culturalTheme?: string;
    planName?: string;
  }) => {
    const response = await api.post('/mealplans/generate', planData);
    return response.data;
  },
  
  getAll: async (limit = 10, offset = 0) => {
    const response = await api.get(`/mealplans?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  getActive: async () => {
    const response = await api.get('/mealplans/active');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/mealplans/${id}`);
    return response.data;
  },
  
  update: async (id: string, updateData: {
    isActive?: boolean;
    planName?: string;
  }) => {
    const response = await api.put(`/mealplans/${id}`, updateData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/mealplans/${id}`);
    return response.data;
  },
  
  getShoppingList: async (id: string) => {
    const response = await api.get(`/mealplans/${id}/shopping-list`);
    return response.data;
  },
  
  getPreview: async (culturalTheme?: string) => {
    const response = await api.post('/mealplans/preview', { culturalTheme });
    return response.data;
  },
  
  getCulturalFoods: async (culturalBackground: string) => {
    const response = await api.get(`/mealplans/cultural-foods/${culturalBackground}`);
    return response.data;
  }
};

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem('refreshToken', token);
};

export const clearTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default api;