'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { format, addMonths, subMonths } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string
  date: Date
  type: 'workshop' | 'hackathon' | 'meetup' | 'conference'
  image: string
  location: string
  speakers: Array<{
    name: string
    role: string
    avatar: string
  }>
  tags: string[]
  registrationLink: string
  capacity: number
  registered: number
}

const EventsCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15])
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15])

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const CalendarGrid = () => {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)
    
    // Generate calendar days
    const days = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      events: generateEventsForDay(i + 1) // Helper function to generate sample events
    }))

    return (
      <div className="grid grid-cols-7 gap-px p-4">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map(({ day, events }) => (
          <motion.div
            key={day}
            initial={{ scale: 1 }}
            whileHover={{ 
              scale: 1.1,
              zIndex: 10,
              transformStyle: "preserve-3d",
              rotateX: 10,
              rotateY: 10
            }}
            onHoverStart={() => setHoveredDay(day)}
            onHoverEnd={() => setHoveredDay(null)}
            className="relative p-2 bg-white rounded-lg cursor-pointer group"
          >
            <div className="text-center">
              <span className="text-sm font-medium">{day}</span>
              {events.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {events.map((event, index) => (
                    <motion.div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        getEventTypeColor(event.type)
                      }`}
                      whileHover={{ scale: 1.5 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Hover Preview */}
            <AnimatePresence>
              {hoveredDay === day && events.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl p-4 z-20"
                >
                  <div className="space-y-3">
                    {events.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`} />
                        <div>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600">{event.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50" ref={ref}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* 3D Calendar Card */}
        <motion.div
          style={{
            rotateX: isHovered ? rotateX : 0,
            rotateY: isHovered ? rotateY : 0,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden perspective-1000"
        >
          {/* Calendar Navigation */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            <CalendarGrid />
          </div>

          {/* Selected Event Details */}
          <AnimatePresence>
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 border-t border-gray-200"
              >
                <div className="flex gap-6">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={selectedEvent.image}
                      alt={selectedEvent.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                    <p className="text-gray-600 mt-2">{selectedEvent.description}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {selectedEvent.speakers.map((speaker) => (
                          <div
                            key={speaker.name}
                            className="relative w-8 h-8 rounded-full border-2 border-white"
                          >
                            <Image
                              src={speaker.avatar}
                              alt={speaker.name}
                              fill
                              className="rounded-full"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedEvent.speakers.length} speakers
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {selectedEvent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Upcoming Events Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event cards with 3D hover effect */}
        </div>
      </motion.div>
    </section>
  )
}

export default EventsCalendar 