'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'

interface Testimonial {
  id: number
  content: string
  author: string
  role: string
  company: string
  image: string
  rating: number
  tags: string[]
  socialLinks?: {
    linkedin?: string
    twitter?: string
    github?: string
  }
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    content: "AGS has been instrumental in my growth as a developer. The mentorship program and community support helped me land my dream job at a top tech company.",
    author: "Sarah Chen",
    role: "Full Stack Developer",
    company: "Tech Innovators",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80",
    rating: 5,
    tags: ['Mentorship', 'Career Growth', 'Community'],
    socialLinks: {
      linkedin: "https://linkedin.com/in/sarahchen",
      github: "https://github.com/sarahchen"
    }
  },
  {
    id: 2,
    content: "The collaborative environment at AGS is unmatched. I've learned more here in months than I did in years of self-study.",
    author: "Michael Rodriguez",
    role: "Software Engineer",
    company: "Cloud Solutions Inc",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
    rating: 5,
    tags: ['Learning', 'Collaboration', 'Community'],
    socialLinks: {
      linkedin: "https://linkedin.com/in/mrodriguez",
      twitter: "https://twitter.com/mrodriguez"
    }
  },
  {
    id: 3,
    content: "AGS provided me with the perfect platform to transition into tech. The support system and resources are incredible.",
    author: "Emma Thompson",
    role: "Product Manager",
    company: "Innovation Labs",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
    rating: 5,
    tags: ['Career Change', 'Resources', 'Support'],
    socialLinks: {
      linkedin: "https://linkedin.com/in/emmathompson",
      twitter: "https://twitter.com/emmathompson"
    }
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [filter, setFilter] = useState<string>('all')
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`h-5 w-5 ${
            index < rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50" ref={ref}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <motion.div variants={cardVariants} className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What Our Members Say
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Hear from our community members about their journey with AGS
          </p>
        </motion.div>

        {/* Filter Tags */}
        <motion.div 
          variants={cardVariants}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {['all', ...new Set(testimonials.flatMap(t => t.tags))].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="mt-16 relative">
          <div className="overflow-hidden">
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="relative bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Author Image */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    <Image
                      src={testimonials[activeIndex].image}
                      alt={testimonials[activeIndex].author}
                      fill
                      className="rounded-full object-cover"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <blockquote className="text-xl text-gray-900">
                      "{testimonials[activeIndex].content}"
                    </blockquote>

                    <div className="mt-4">
                      {renderStars(testimonials[activeIndex].rating)}
                    </div>

                    <div className="mt-6">
                      <div className="font-semibold text-gray-900">
                        {testimonials[activeIndex].author}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {testimonials[activeIndex].tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Social Links */}
                    {testimonials[activeIndex].socialLinks && (
                      <div className="mt-4 flex gap-4">
                        {Object.entries(testimonials[activeIndex].socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">{platform}</span>
                            {/* Add social icons here */}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Dots */}
          <div className="mt-8 flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Testimonials