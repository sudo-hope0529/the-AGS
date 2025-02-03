'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'

const highlights = [
  {
    id: 1,
    title: 'Global Hackathon Success',
    description: 'Our members secured top positions in international hackathons, showcasing innovative solutions.',
    image: '/static/images/highlights/hackathon.jpg',
    stats: { participants: '200+', projects: '45', winners: '12' }
  },
  {
    id: 2,
    title: 'Tech Mentorship Program',
    description: 'Launched successful mentorship programs connecting industry experts with aspiring developers.',
    image: '/static/images/highlights/mentorship.jpg',
    stats: { mentors: '50+', mentees: '150+', sessions: '300+' }
  },
  {
    id: 3,
    title: 'Innovation Projects',
    description: 'Members collaborated on groundbreaking projects in AI, blockchain, and sustainable tech.',
    image: '/static/images/highlights/innovation.jpg',
    stats: { projects: '75+', technologies: '15+', impact: '10K+' }
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 }
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

export default function Highlights() {
  const [activeHighlight, setActiveHighlight] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section className="py-24 bg-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Our Highlights
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto"
          >
            Celebrating our community's achievements and milestones in technology and innovation.
          </motion.p>
        </motion.div>

        <div className="mt-20">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {/* Image Showcase */}
            <motion.div 
              className="relative h-[400px] rounded-2xl overflow-hidden"
              variants={itemVariants}
            >
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeHighlight}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={highlights[activeHighlight].image}
                    alt={highlights[activeHighlight].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold">{highlights[activeHighlight].title}</h3>
                    <p className="mt-2">{highlights[activeHighlight].description}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Interactive Controls & Stats */}
            <motion.div 
              className="space-y-8"
              variants={itemVariants}
            >
              {/* Navigation Buttons */}
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <button
                    key={highlight.id}
                    onClick={() => setActiveHighlight(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                      index === activeHighlight 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-semibold">{highlight.title}</h3>
                    {index === activeHighlight && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 text-sm"
                      >
                        {highlight.description}
                      </motion.p>
                    )}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-4 p-6 bg-white rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={activeHighlight}
              >
                {Object.entries(highlights[activeHighlight].stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{value}</div>
                    <div className="text-sm text-gray-500 capitalize">{key}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div 
          className="mt-20"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-between">
              {['2021', '2022', '2023', '2024'].map((year, index) => (
                <motion.div
                  key={year}
                  variants={itemVariants}
                  className="bg-gray-50 px-4"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                    {year.slice(2)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 