'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useLegal } from '../context/LegalContext';

interface FormState {
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

// Rate limiting - one submission per 30 seconds
const SUBMISSION_COOLDOWN = 30000;

export default function Hero() {
  const [formState, setFormState] = useState<FormState>({
    state: 'idle',
    message: '',
  });
  const [email, setEmail] = useState('');
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const { openDialog } = useLegal();

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const now = Date.now();
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      const waitTime = Math.ceil((SUBMISSION_COOLDOWN - (now - lastSubmissionTime)) / 1000);
      setFormState({
        state: 'error',
        message: `Please wait ${waitTime} seconds before trying again.`,
      });
      return;
    }

    // Validate email
    if (!email) {
      setFormState({
        state: 'error',
        message: 'Please enter your email address.',
      });
      return;
    }

    if (!validateEmail(email)) {
      setFormState({
        state: 'error',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setFormState({ state: 'loading', message: 'Submitting your request...' });
    setLastSubmissionTime(now);

    try {
      const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
      if (!formId) {
        throw new Error('Form configuration error. Please try again later.');
      }

      // Create an AbortController for the timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          _replyto: email,
          email: email,
          subject: 'New Proventa Waitlist Signup',
          message: `New signup from ${email}`
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist. Please try again.');
      }

      if (data.ok) {
        setFormState({
          state: 'success',
          message: '🎉 Welcome to the Proventa community!\n\n' +
            '✓ Confirmation email sent\n' +
            '✓ Early access invitation reserved\n' +
            '✓ Development updates enabled\n' +
            '✓ Product feedback access granted\n\n' +
            'Check your inbox for next steps!'
        });
        setEmail('');

        // Reset form state after 10 seconds of success
        setTimeout(() => {
          setFormState({ state: 'idle', message: '' });
        }, 10000);
      } else {
        throw new Error('Failed to process your request. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      let errorMessage = 'Something went wrong. Please try again later.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('rate limit') || error.message.toLowerCase().includes('too many')) {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setFormState({
        state: 'error',
        message: errorMessage
      });

      // Reset error state after 5 seconds
      setTimeout(() => {
        setFormState({ state: 'idle', message: '' });
      }, 5000);
    }
  };

  const isDisabled = formState.state === 'loading' || formState.state === 'success';

  return (
    <section className="relative pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-white" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          {/* Pre-launch Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-700/10 mb-8"
          >
            Pre-launch • Beta Q3 2026 • Join the waitlist →
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Your Personal Health
              <span className="text-primary-600"> Intelligence Platform</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Proventa analyzes your health data from wearables and environmental sources to provide personalized insights and recommendations for optimal health outcomes.
            </p>

            {/* CTA Section */}
            <div id="waitlist" className="max-w-md mx-auto">
              <form 
                onSubmit={handleSubmit} 
                className="flex flex-col sm:flex-row gap-4"
                aria-live="polite"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full min-w-0 rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                      formState.state === 'error' ? 'ring-red-300' : 'ring-gray-300'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600`}
                    required
                    disabled={isDisabled}
                    aria-invalid={formState.state === 'error'}
                    aria-describedby={formState.message ? 'form-feedback' : undefined}
                  />
                  {formState.state === 'success' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    formState.state === 'loading'
                      ? 'bg-primary-400'
                      : formState.state === 'success'
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-primary-600 hover:bg-primary-500'
                  }`}
                  aria-busy={formState.state === 'loading'}
                >
                  {formState.state === 'loading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : formState.state === 'success' ? (
                    'Joined!'
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
              
              {formState.message && (
                <div 
                  id="form-feedback"
                  className={`mt-4 p-4 rounded-lg ${
                    formState.state === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  } transition-all duration-200`}
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-sm whitespace-pre-line">
                    {formState.message}
                  </p>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-500">
                By joining, you agree to our{' '}
                <button
                  onClick={() => openDialog('terms')}
                  className="text-primary-600 hover:text-primary-500"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  onClick={() => openDialog('privacy')}
                  className="text-primary-600 hover:text-primary-500"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 