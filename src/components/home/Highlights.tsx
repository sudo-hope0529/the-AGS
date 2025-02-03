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
  category: string
  date: string
  stats: Record<string, string>
  link: string
}

const highlights: Highlight[] = [
  {
    id: 1,
    title: "Global Hackathon Champions",
    description: "Our members secured top positions in international hackathons, showcasing innovative solutions for sustainable development.",
    image: "/images/highlights/hackathon.jpg",
    category: "Achievement",
    date: "2024",
    stats: {
      participants: "200+",
      projects: "45",
      countries: "15",
      prizes: "$50K+"
    },
    link: "/events/hackathon-2024"
  },
  {
    id: 2,
    title: "Tech Mentorship Program",
    description: "Successfully launched our flagship mentorship program connecting industry experts with aspiring developers.",
    image: "/images/highlights/mentorship.jpg",
    category: "Program",
    date: "2024",
    stats: {
      mentors: "50+",
      mentees: "150+",
      sessions: "300+",
      satisfaction: "95%"
    },
    link: "/programs/mentorship"
  },
  // Add more highlights...
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

function Highlights() {
  const [activeHighlight, setActiveHighlight] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Auto-rotate highlights unless hovered
  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setActiveHighlight((prev) => (prev + 1) % highlights.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [isHovered])

  return (
    <section className="py-24 bg-gray-900 text-white" ref={ref}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our Highlights
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Celebrating our community's achievements and milestones
          </p>
        </motion.div>

        <div className="mt-16">
          <div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Featured Highlight */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl"
            >
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeHighlight}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-w-16 aspect-h-9"
                >
                  <Image
                    src={highlights[activeHighlight].image}
                    alt={highlights[activeHighlight].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                      {highlights[activeHighlight].category}
                    </span>
                    <h3 className="mt-4 text-2xl font-bold">
                      {highlights[activeHighlight].title}
                    </h3>
                    <p className="mt-2 text-gray-300">
                      {highlights[activeHighlight].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Stats & Navigation */}
            <motion.div variants={itemVariants} className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(highlights[activeHighlight].stats).map(([key, value]) => (
                  <div 
                    key={key}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="text-2xl font-bold text-blue-400">{value}</div>
                    <div className="text-sm text-gray-400 capitalize">{key}</div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <button
                    key={highlight.id}
                    onClick={() => setActiveHighlight(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                      index === activeHighlight 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{highlight.title}</span>
                      <span className="text-sm opacity-75">{highlight.date}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Call to Action */}
              <Link
                href={highlights[activeHighlight].link}
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent 
                  text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                  transition-colors duration-200"
              >
                Learn More
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Highlights