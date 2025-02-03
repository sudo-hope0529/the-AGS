'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'

interface NewsletterFeature {
  icon: string
  title: string
  description: string
}

const features: NewsletterFeature[] = [
  {
    icon: '📚',
    title: 'Weekly Tech Insights',
    description: 'Get curated content about latest technologies and industry trends'
  },
  {
    icon: '🎯',
    title: 'Exclusive Updates',
    description: 'Be the first to know about events, hackathons, and opportunities'
  },
  {
    icon: '🤝',
    title: 'Community Stories',
    description: 'Read success stories and experiences from our community members'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      // TODO: Implement newsletter signup logic
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulated API call
      setStatus('success')
      setEmail('')
      setSelectedPreferences([])
    } catch (error) {
      setStatus('error')
    }

    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000)
  }

  const togglePreference = (preference: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    )
  }

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50" ref={ref}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-4 -top-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply opacity-10 animate-blob" />
            <div className="absolute -right-4 -bottom-4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply opacity-10 animate-blob animation-delay-2000" />
          </div>

          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <motion.div
                variants={itemVariants}
                className="text-center"
              >
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Stay Updated with AGS
                </h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                  Join our newsletter to receive the latest updates about tech innovations, 
                  events, and opportunities in our community.
                </p>
              </motion.div>

              <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="mt-10 max-w-xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 
                        focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent 
                      text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
                      ${status === 'loading' ? 'cursor-wait' : ''}`}
                  >
                    {status === 'loading' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </motion.div>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>

                {/* Preferences */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">Select your interests (optional):</p>
                  <div className="flex flex-wrap gap-2">
                    {['Events', 'Tech News', 'Job Opportunities', 'Community Updates'].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => togglePreference(pref)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                          selectedPreferences.includes(pref)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.form>

              {/* Status Messages */}
              <AnimatePresence mode='wait'>
                {status !== 'idle' && status !== 'loading' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`mt-4 text-center text-sm ${
                      status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {status === 'success' ? (
                      <p>Thank you for subscribing! Check your email to confirm. 🎉</p>
                    ) : (
                      <p>Oops! Something went wrong. Please try again.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features */}
              <motion.div 
                variants={containerVariants}
                className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3"
              >
                {features.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Privacy Note */}
              <motion.p
                variants={itemVariants}
                className="mt-8 text-center text-sm text-gray-500"
              >
                By subscribing, you agree to our{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
                . You can unsubscribe at any time.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
} 