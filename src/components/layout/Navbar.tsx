'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Disclosure, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Activities', href: '/activities' },
  { name: 'Events', href: '/events' },
  { name: 'Resources', href: '/resources' },
  { name: 'Community', href: '/community' },
  { name: 'Contact', href: '/contact' },
]

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Disclosure as="nav" 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg text-gray-900' 
          : 'bg-transparent text-white'
      }`}
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <Image
                  src={isScrolled ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="AGS Logo"
                  width={120}
                  height={40}
                  className="transition-opacity duration-300"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium 
                        border-b-2 transition-colors duration-200 ${
                          isActive 
                            ? 'border-blue-500' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              {/* User Menu & Mobile Menu Button */}
              <div className="flex items-center gap-4">
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${
                      isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <UserCircleIcon className="h-6 w-6" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      >
                        <div className="py-1">
                          <Link
                            href="/login"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign in
                          </Link>
                          <Link
                            href="/signup"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign up
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile menu button */}
                <Disclosure.Button 
                  className="sm:hidden inline-flex items-center justify-center rounded-md p-2
                    hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-inset focus:ring-blue-500"
                >
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={`block py-2 pl-3 pr-4 text-base font-medium border-l-4 ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </Disclosure.Button>
                  )
                })}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
} 

export { Navbar }