import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Star, Users, Globe, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

interface CultureOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
  gradient: string;
  foods: string[];
}

const cultures: CultureOption[] = [
  {
    id: 'latino',
    name: 'Latino',
    displayName: 'Latino & Hispanic',
    description: 'Authentic Mexican, Central & South American cuisines',
    gradient: 'gradient-latino',
    foods: ['Black beans', 'Avocados', 'Cilantro', 'Lime', 'Cumin']
  },
  {
    id: 'somali',
    name: 'Somali',
    displayName: 'Somali & East African',
    description: 'Traditional East African spices and cooking methods',
    gradient: 'gradient-somali',
    foods: ['Injera', 'Berbere spice', 'Lentils', 'Dates', 'Tea']
  },
  {
    id: 'south_asian',
    name: 'South Asian',
    displayName: 'South Asian',
    description: 'Indian, Pakistani, Bengali & Sri Lankan traditions',
    gradient: 'gradient-south-asian',
    foods: ['Turmeric', 'Basmati rice', 'Lentils', 'Yogurt', 'Ginger']
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    displayName: 'Mediterranean',
    description: 'Greek, Turkish, Lebanese & Italian wellness cuisine',
    gradient: 'gradient-mediterranean',
    foods: ['Olive oil', 'Tomatoes', 'Fish', 'Herbs', 'Legumes']
  },
  {
    id: 'caribbean',
    name: 'Caribbean',
    displayName: 'Caribbean',
    description: 'Island flavors from Jamaica, Cuba & Puerto Rico',
    gradient: 'gradient-caribbean',
    foods: ['Plantains', 'Yuca', 'Tropical fruits', 'Fish', 'Coconut']
  },
  {
    id: 'middle_eastern',
    name: 'Middle Eastern',
    displayName: 'Middle Eastern',
    description: 'Persian, Lebanese, Turkish & Moroccan cuisine',
    gradient: 'gradient-middle-eastern',
    foods: ['Tahini', 'Dates', 'Bulgur', 'Nuts', 'Lamb']
  }
];

const testimonials = [
  {
    name: 'Maria Rodriguez',
    culture: 'Latino',
    text: 'Finally, a meal plan that understands my family\'s food traditions! My blood sugar is stable and I\'m eating foods I actually love.',
    rating: 5,
    result: 'Lost 15 lbs, A1C improved from 8.2 to 6.8'
  },
  {
    name: 'Amina Hassan',
    culture: 'Somali',
    text: 'NutriVida included traditional Somali foods like injera and berbere spice in my meal plan. It feels like home while helping my health.',
    rating: 5,
    result: 'Energy levels increased by 80%'
  },
  {
    name: 'Priya Patel',
    culture: 'South Asian',
    text: 'The AI understood my South Asian background perfectly. Every meal includes turmeric, ginger, and foods my grandmother would approve of.',
    rating: 5,
    result: 'Blood pressure normalized in 6 weeks'
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleCultureSelect = (cultureId: string) => {
    setSelectedCulture(cultureId);
  };

  const handleStartQuiz = () => {
    // Store selected culture in localStorage so quiz can access it
    if (selectedCulture) {
      localStorage.setItem('selectedCulture', selectedCulture);
    }
    navigate('/quiz');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    // Implement email capture logic
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gradient">NutriVida</div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">How It Works</a>
                <a href="#cultures" className="text-gray-600 hover:text-primary-600 transition-colors">Cultures</a>
                <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors">Stories</a>
                <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">Pricing</a>
                <button className="btn-primary px-4 py-2">Sign In</button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-primary-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#how-it-works" className="block px-3 py-2 text-gray-600 hover:text-primary-600">How It Works</a>
              <a href="#cultures" className="block px-3 py-2 text-gray-600 hover:text-primary-600">Cultures</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-primary-600">Stories</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-primary-600">Pricing</a>
              <button className="w-full text-left px-3 py-2 text-primary-600 font-medium">Sign In</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-bg pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="text-gradient">Culture-First</span><br />
                Health Plans That<br />
                Actually Work
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Finally, a health platform that honors your cultural food traditions while 
                optimizing for your wellness goals. AI-powered meal plans from Latino to Somali 
                to South Asian cuisines.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={handleStartQuiz}
                  className="btn-cultural gradient-latino flex items-center justify-center"
                >
                  Start Free Health Assessment
                  <ArrowRight className="ml-2" size={20} />
                </button>
                <button className="btn-secondary px-6 py-3">
                  Watch Demo (2 min)
                </button>
              </div>

              <div className="flex items-center gap-6 mt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>7-day money-back guarantee</span>
                </div>
              </div>
            </div>

            <div className="animate-slide-up lg:justify-self-end">
              <div className="relative">
                <div className="absolute inset-0 gradient-latino rounded-3xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Choose Your Culture</h3>
                    <p className="text-gray-600 mt-2">Get personalized meal plans that honor your heritage</p>
                  </div>
                  
                  <div className="space-y-3">
                    {cultures.slice(0, 3).map((culture) => (
                      <button
                        key={culture.id}
                        onClick={() => handleCultureSelect(culture.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedCulture === culture.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">{culture.displayName}</div>
                            <div className="text-sm text-gray-600">{culture.foods.slice(0, 2).join(', ')}</div>
                          </div>
                          {selectedCulture === culture.id && (
                            <CheckCircle className="text-primary-500" size={20} />
                          )}
                        </div>
                      </button>
                    ))}
                    <div className="text-center text-sm text-gray-500 pt-2">
                      + 3 more cultures available
                    </div>
                  </div>

                  {selectedCulture && (
                    <button 
                      onClick={handleStartQuiz}
                      className="w-full mt-6 btn-primary py-3 flex items-center justify-center"
                    >
                      Continue to Health Assessment
                      <ChevronRight className="ml-2" size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary-600">6</div>
              <div className="text-gray-600 mt-2">Cultural Cuisines</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary-600">87%</div>
              <div className="text-gray-600 mt-2">Report Better Health</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary-600">2.3M</div>
              <div className="text-gray-600 mt-2">Meals Generated</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary-600">4.8★</div>
              <div className="text-gray-600 mt-2">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How NutriVida Works</h2>
            <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">
              Our AI understands your cultural background and creates personalized meal plans 
              that honor your traditions while optimizing for your health goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center card p-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cultural Health Assessment</h3>
              <p className="text-gray-600">
                Tell us about your cultural background, health goals, and food preferences. 
                Our quiz understands the nuances of your heritage.
              </p>
            </div>

            <div className="text-center card p-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Meal Planning</h3>
              <p className="text-gray-600">
                Our AI creates 7-day meal plans using authentic ingredients from your culture, 
                optimized for your specific health goals and family size.
              </p>
            </div>

            <div className="text-center card p-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Track & Improve</h3>
              <p className="text-gray-600">
                Monitor your progress with culturally-aware tracking. See improvements in 
                blood sugar, energy, and overall wellness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cultural Cuisines Section */}
      <section id="cultures" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Authentic Cultural Cuisines</h2>
            <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">
              Each meal plan is crafted by AI that understands traditional cooking methods, 
              authentic ingredients, and cultural food patterns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultures.map((culture) => (
              <div key={culture.id} className="card overflow-hidden group cursor-pointer">
                <div className={`h-32 ${culture.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-xl font-bold">{culture.displayName}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{culture.description}</p>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">Traditional Ingredients:</div>
                    <div className="flex flex-wrap gap-2">
                      {culture.foods.map((food) => (
                        <span key={food} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Real Stories, Real Results</h2>
            <p className="text-xl text-gray-600 mt-4">
              See how NutriVida has helped people from diverse backgrounds achieve their health goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={16} />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.text}"
                </blockquote>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.culture} Cuisine</div>
                  <div className="text-sm text-primary-600 font-medium mt-2">{testimonial.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="quiz-section" className="py-20 hero-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free cultural health assessment. Get personalized recommendations 
            based on your heritage and health goals.
          </p>
          
          <div className="max-w-md mx-auto">
            <form onSubmit={handleEmailSubmit} className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus-ring"
                required
              />
              <button type="submit" className="btn-primary px-6 py-3 whitespace-nowrap">
                Start Free
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              Free assessment • No spam • Unsubscribe anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">NutriVida</div>
              <p className="text-gray-400">
                Culture-first health platform honoring your heritage while optimizing wellness.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cultures</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NutriVida. All rights reserved. Made with ❤️ for diverse communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;