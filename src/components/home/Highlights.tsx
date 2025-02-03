'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import Link from 'next/link'

interface Highlight {
  id: number
  title: string
  description: string
  image: string
  link: string
  stats: {
    [key: string]: string
  }
}

const highlights: Highlight[] = [
  {
    id: 1,
    title: "Annual Hackathon",
    description: "Join our flagship 48-hour hackathon where innovators come together to build amazing projects. Network with industry experts and win exciting prizes!",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    link: "/events/hackathon",
    stats: {
      "Participants": "500+",
      "Projects": "100+",
      "Prize Pool": "$50K+"
    }
  },
  {
    id: 2,
    title: "Mentorship Program",
    description: "Get personalized guidance from industry veterans. Our mentorship program connects you with experienced professionals who help shape your career.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    link: "/mentorship",
    stats: {
      "Mentors": "50+",
      "Success Rate": "90%",
      "Hours/Month": "20+"
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

function Highlights() {
  const [activeHighlight, setActiveHighlight] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % highlights.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center"
        >
          <motion.h2 
            variants={cardVariants}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Program Highlights
          </motion.h2>
          <motion.p 
            variants={cardVariants}
            className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto"
          >
            Discover our signature programs and events that make AGS unique
          </motion.p>
        </motion.div>

        <div className="mt-16">
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeHighlight}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
            >
              {/* Image */}
              <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden">
                <Image
                  src={highlights[activeHighlight].image}
                  alt={highlights[activeHighlight].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900">
                  {highlights[activeHighlight].title}
                </h3>
                <p className="mt-4 text-lg text-gray-600">
                  {highlights[activeHighlight].description}
                </p>

                <dl className="mt-8 grid grid-cols-3 gap-4">
                  {Object.entries(highlights[activeHighlight].stats).map(([label, value]) => (
                    <div key={label} className="text-center">
                      <dt className="text-sm font-medium text-gray-500">{label}</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8">
                  <Link
                    href={highlights[activeHighlight].link}
                    className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-base 
                      font-semibold text-white shadow-sm hover:bg-blue-500 transition-all duration-300"
                  >
                    Learn More
                    <svg className="ml-2 -mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="mt-8 flex justify-center space-x-2">
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveHighlight(index)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === activeHighlight ? 'bg-blue-600 w-4' : 'bg-gray-300'
                }`}
              >
                <span className="sr-only">View highlight {index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Highlights