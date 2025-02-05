'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { Tab } from '@headlessui/react'

const features = [
  {
    title: 'Our Vision',
    description: 'To become the world\'s leading platform for technological innovation and entrepreneurial growth.',
    icon: '🎯',
    stats: { 'Active Members': '500+', 'Countries': '25+', 'Projects': '100+' }
  },
  {
    title: 'Our Mission',
    description: 'Empowering individuals through mentorship, resources, and collaborative opportunities.',
    icon: '🚀',
    stats: { 'Mentors': '50+', 'Success Stories': '200+', 'Events': '30+' }
  },
  {
    title: 'Our Values',
    description: 'Innovation, collaboration, integrity, and commitment to excellence in everything we do.',
    icon: '⭐',
    stats: { 'Communities': '15+', 'Partners': '30+', 'Initiatives': '25+' }
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

function AboutOverview() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

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
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            About AGS
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto"
          >
            Discover how we're building the future of technology and innovation
          </motion.p>
        </motion.div>

        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="mt-16 flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {features.map((feature) => (
              <Tab
                key={feature.title}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400
                  focus:outline-none focus:ring-2 ${
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                {feature.title}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-8">
            <AnimatePresence mode='wait'>
              {features.map((feature, idx) => (
                <Tab.Panel
                  key={feature.title}
                  static
                  className={`rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 
                    ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                    idx === selectedIndex ? 'block' : 'hidden'
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-lg p-6 hover:bg-gray-50"
                  >
                    <div className="text-6xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-medium leading-7">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {feature.description}
                    </p>

                    <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {Object.entries(feature.stats).map(([label, value]) => (
                        <div
                          key={label}
                          className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6"
                        >
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {label}
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                </Tab.Panel>
              ))}
            </AnimatePresence>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </section>
  )
}

export default AboutOverview