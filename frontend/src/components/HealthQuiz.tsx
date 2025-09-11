import React, { useState } from 'react';
import { quizApi } from '../services/api';

interface QuizData {
  email: string;
  culturalBackground: string;
  primaryGoal: string;
  responses: Record<string, any>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

interface QuizStep {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'input' | 'scale';
  question: string;
  options?: { value: string; label: string; description?: string }[];
  min?: number;
  max?: number;
  required?: boolean;
}

const HealthQuiz: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    // Pre-populate cultural background if selected on landing page
    const selectedCulture = localStorage.getItem('selectedCulture');
    return selectedCulture ? { cultural_background: selectedCulture } : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizSteps: QuizStep[] = [
    {
      id: 'email',
      title: 'Get Your Personalized Plan',
      subtitle: 'Let\'s start with your contact information',
      type: 'input',
      question: 'What\'s your email address?',
      required: true
    },
    {
      id: 'cultural_background',
      title: 'Your Cultural Heritage',
      subtitle: 'We honor your cultural food traditions',
      type: 'single',
      question: 'Which cultural background best represents your heritage?',
      options: [
        { value: 'latino', label: 'Latino/Hispanic', description: 'Mexican, Central/South American cuisines' },
        { value: 'somali', label: 'Somali/East African', description: 'Traditional East African dishes' },
        { value: 'south_asian', label: 'South Asian', description: 'Indian, Pakistani, Bengali cuisines' },
        { value: 'mediterranean', label: 'Mediterranean', description: 'Greek, Italian, Middle Eastern' },
        { value: 'caribbean', label: 'Caribbean', description: 'Jamaican, Haitian, Puerto Rican' },
        { value: 'middle_eastern', label: 'Middle Eastern', description: 'Lebanese, Syrian, Persian cuisines' }
      ],
      required: true
    },
    {
      id: 'primary_goal',
      title: 'Your Health Goals',
      subtitle: 'What\'s most important to you right now?',
      type: 'single',
      question: 'What is your primary health goal?',
      options: [
        { value: 'blood_sugar', label: 'Better Blood Sugar Control', description: 'Stabilize energy and reduce spikes' },
        { value: 'weight_loss', label: 'Healthy Weight Loss', description: 'Lose weight while honoring culture' },
        { value: 'energy', label: 'More Energy', description: 'Feel energized throughout the day' },
        { value: 'digestion', label: 'Better Digestion', description: 'Improve gut health naturally' },
        { value: 'family_health', label: 'Family Wellness', description: 'Healthy meals for the whole family' }
      ],
      required: true
    },
    {
      id: 'current_challenges',
      title: 'Current Challenges',
      subtitle: 'Help us understand your situation',
      type: 'multiple',
      question: 'What challenges are you facing? (Select all that apply)',
      options: [
        { value: 'time', label: 'Not enough time to cook' },
        { value: 'knowledge', label: 'Don\'t know which foods are healthy' },
        { value: 'cultural_conflict', label: 'Healthy eating conflicts with cultural foods' },
        { value: 'family_resistance', label: 'Family doesn\'t like healthy changes' },
        { value: 'cost', label: 'Healthy foods are too expensive' },
        { value: 'cravings', label: 'Hard to control cravings' },
        { value: 'consistency', label: 'Struggling to stay consistent' }
      ]
    },
    {
      id: 'cooking_experience',
      title: 'Cooking Experience',
      subtitle: 'We\'ll match recipes to your skill level',
      type: 'single',
      question: 'How would you describe your cooking experience?',
      options: [
        { value: 'beginner', label: 'Beginner', description: 'Basic cooking skills, simple recipes' },
        { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with most techniques' },
        { value: 'advanced', label: 'Advanced', description: 'Experienced cook, enjoy complex recipes' },
        { value: 'expert', label: 'Expert', description: 'Professional level cooking skills' }
      ],
      required: true
    },
    {
      id: 'meal_prep_time',
      title: 'Time Available',
      subtitle: 'How much time can you dedicate to cooking?',
      type: 'single',
      question: 'How much time do you typically have for meal preparation?',
      options: [
        { value: '15', label: '15 minutes or less', description: 'Quick and simple meals' },
        { value: '30', label: '15-30 minutes', description: 'Moderate preparation time' },
        { value: '45', label: '30-45 minutes', description: 'Can spend time on cooking' },
        { value: '60+', label: '45+ minutes', description: 'Love to cook, no time constraints' }
      ],
      required: true
    },
    {
      id: 'family_size',
      title: 'Household Size',
      subtitle: 'We\'ll adjust portions accordingly',
      type: 'single',
      question: 'How many people are you typically cooking for?',
      options: [
        { value: '1', label: 'Just myself' },
        { value: '2', label: '2 people' },
        { value: '3-4', label: '3-4 people' },
        { value: '5+', label: '5 or more people' }
      ],
      required: true
    },
    {
      id: 'dietary_restrictions',
      title: 'Dietary Considerations',
      subtitle: 'Any restrictions we should know about?',
      type: 'multiple',
      question: 'Do you have any dietary restrictions or preferences?',
      options: [
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'vegan', label: 'Vegan' },
        { value: 'gluten_free', label: 'Gluten-free' },
        { value: 'dairy_free', label: 'Dairy-free' },
        { value: 'low_sodium', label: 'Low sodium' },
        { value: 'diabetic', label: 'Diabetic diet' },
        { value: 'halal', label: 'Halal' },
        { value: 'kosher', label: 'Kosher' },
        { value: 'none', label: 'No restrictions' }
      ]
    },
    {
      id: 'motivation_level',
      title: 'Motivation Assessment',
      subtitle: 'How ready are you to make changes?',
      type: 'scale',
      question: 'On a scale of 1-10, how motivated are you to improve your health?',
      min: 1,
      max: 10,
      required: true
    }
  ];

  const currentStepData = quizSteps[currentStep];
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  const handleAnswer = (value: any) => {
    if (currentStepData.type === 'multiple') {
      const currentAnswers = answers[currentStepData.id] || [];
      if (currentAnswers.includes(value)) {
        setAnswers({
          ...answers,
          [currentStepData.id]: currentAnswers.filter((v: any) => v !== value)
        });
      } else {
        setAnswers({
          ...answers,
          [currentStepData.id]: [...currentAnswers, value]
        });
      }
    } else {
      setAnswers({
        ...answers,
        [currentStepData.id]: value
      });
    }
  };

  const nextStep = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuiz();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const answer = answers[currentStepData.id];
    if (currentStepData.required) {
      if (currentStepData.type === 'multiple') {
        return answer && answer.length > 0;
      }
      return answer !== undefined && answer !== '';
    }
    return true;
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const quizData: QuizData = {
        email: answers.email,
        culturalBackground: answers.cultural_background,
        primaryGoal: answers.primary_goal,
        responses: answers,
        utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
        referrer: document.referrer || undefined
      };

      await quizApi.submit(quizData);
      setIsComplete(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your personalized {answers.cultural_background} meal plan is being created. 
            Check your email for your cultural health assessment results and next steps.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="btn-primary w-full py-3 text-lg"
          >
            View Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {quizSteps.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            {currentStepData.subtitle && (
              <p className="text-lg text-gray-600">
                {currentStepData.subtitle}
              </p>
            )}
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {currentStepData.question}
            </h2>

            {/* Input Field */}
            {currentStepData.type === 'input' && (
              <input
                type="email"
                value={answers[currentStepData.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
            )}

            {/* Single Choice Options */}
            {currentStepData.type === 'single' && currentStepData.options && (
              <div className="space-y-3">
                {currentStepData.options.map((option) => (
                  <label
                    key={option.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentStepData.id] === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={currentStepData.id}
                        value={option.value}
                        checked={answers[currentStepData.id] === option.value}
                        onChange={() => handleAnswer(option.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        answers[currentStepData.id] === option.value
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentStepData.id] === option.value && (
                          <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Multiple Choice Options */}
            {currentStepData.type === 'multiple' && currentStepData.options && (
              <div className="space-y-3">
                {currentStepData.options.map((option) => (
                  <label
                    key={option.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      (answers[currentStepData.id] || []).includes(option.value)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={(answers[currentStepData.id] || []).includes(option.value)}
                        onChange={() => handleAnswer(option.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded border-2 ${
                        (answers[currentStepData.id] || []).includes(option.value)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {(answers[currentStepData.id] || []).includes(option.value) && (
                          <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Scale Input */}
            {currentStepData.type === 'scale' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Not motivated</span>
                  <span>Extremely motivated</span>
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleAnswer(num)}
                      className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                        answers[currentStepData.id] === num
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <button
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !canProceed() || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-primary hover:transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  Submitting...
                </div>
              ) : currentStep === quizSteps.length - 1 ? (
                'Get My Plan'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthQuiz;