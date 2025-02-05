'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { getScientificUpdates, AIResponse } from '@/services/ai'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [scientificUpdates, setScientificUpdates] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const interestOptions = [
    'Artificial Intelligence',
    'Space Technology',
    'Medical Research',
    'Environmental Science',
    'Quantum Computing',
    'Robotics',
    'Biotechnology',
    'Clean Energy'
  ]

  useEffect(() => {
    if (inView) {
      fetchScientificUpdates()
    }
  }, [inView])

  const fetchScientificUpdates = async () => {
    setLoading(true)
    try {
      const updates = await getScientificUpdates()
      setScientificUpdates(updates)
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Here you would typically call your API to handle the subscription
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      setSubscribed(true)
      setEmail('')
      setInterests([])
    } catch (error) {
      console.error('Error subscribing:', error)
    }
    
    setLoading(false)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Newsletter Form */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Stay Updated with Scientific Breakthroughs
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Subscribe to our newsletter and get personalized updates on the latest developments in science and technology.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                      focus:ring-blue-500 sm:text-sm px-4 py-3"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Select your interests:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                          ${
                            interests.includes(interest)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md 
                      shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {subscribed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-4 bg-green-50 rounded-md"
                  >
                    <p className="text-green-800">
                      Thanks for subscribing! Check your email to confirm your subscription.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Latest Updates */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Latest Scientific Updates
              </h3>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : scientificUpdates?.error ? (
                <div className="text-red-600">
                  {scientificUpdates.error}
                </div>
              ) : scientificUpdates?.content ? (
                <div className="prose prose-blue max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: scientificUpdates.content }} />
                  
                  {scientificUpdates.sources && scientificUpdates.sources.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Sources:</h4>
                      <ul className="mt-2 space-y-1">
                        {scientificUpdates.sources.map((source, index) => (
                          <li key={index}>
                            <a
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              {new URL(source).hostname}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">
                  Loading latest updates...
                </p>
              )}

              <button
                onClick={fetchScientificUpdates}
                disabled={loading}
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <svg
                  className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refresh Updates
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter