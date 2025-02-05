'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const heroContent = [
  {
    title: "Innovate Together",
    subtitle: "Join a community of tech enthusiasts and innovators",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80"
  },
  {
    title: "Learn & Grow",
    subtitle: "Access exclusive resources and mentorship",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2000&q=80"
  },
  {
    title: "Build the Future",
    subtitle: "Participate in cutting-edge projects and hackathons",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=80"
  }
]

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroContent.length)
        setIsVisible(true)
      }, 500)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-screen">
      {/* Background Video/Slider */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <Image
              src={heroContent[currentSlide].image}
              alt="Hero background"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence mode='wait'>
              <motion.h1
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-4xl md:text-6xl font-bold tracking-tight"
              >
                {heroContent[currentSlide].title}
              </motion.h1>
              <motion.p
                key={`${currentSlide}-subtitle`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 text-xl md:text-2xl max-w-3xl mx-auto"
              >
                {heroContent[currentSlide].subtitle}
              </motion.p>
            </AnimatePresence>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/apply"
                className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white 
                  shadow-lg hover:bg-blue-500 transition-all duration-300 transform hover:scale-105"
              >
                Join AGS
              </Link>
              <Link
                href="/about"
                className="rounded-full bg-white/10 backdrop-blur-sm px-8 py-3 text-lg font-semibold 
                  text-white shadow-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Slide Indicators */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {heroContent.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(() => {
                    setCurrentSlide(index)
                    setIsVisible(true)
                  }, 500)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection