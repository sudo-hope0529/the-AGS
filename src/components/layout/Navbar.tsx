'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Disclosure, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Membership', href: '/membership' },
  { name: 'Activities', href: '/activities' },
  { name: 'Events', href: '/events' },
  { name: 'Resources', href: '/resources' },
  { name: 'Community', href: '/community' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Disclosure as="nav" 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-blue-600 shadow-lg' : 'bg-transparent'
      }`}
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link href="/" className="flex flex-shrink-0 items-center">
                  <Image
                    className="h-8 w-auto"
                    src="/static/logos/theAGS-logo.png"
                    alt="AGS Logo"
                    width={32}
                    height={32}
                    priority
                  />
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium 
                          ${isActive 
                            ? 'text-white border-b-2 border-white' 
                            : 'text-gray-200 hover:text-white hover:border-b-2 hover:border-gray-300'
                          }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Right side buttons */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                <Link
                  href="/login"
                  className="text-white hover:text-gray-200"
                >
                  Login
                </Link>
                <Link
                  href="/apply"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 
                    shadow-sm hover:bg-gray-100 transition-colors duration-200"
                >
                  Apply Now
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 
                  text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
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
            <Disclosure.Panel className="sm:hidden bg-blue-600">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={`block py-2 pl-3 pr-4 text-base font-medium ${
                        isActive 
                          ? 'bg-blue-700 text-white' 
                          : 'text-gray-200 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Disclosure.Button>
                  )
                })}
                <div className="mt-4 flex flex-col space-y-4 px-3">
                  <Link
                    href="/login"
                    className="text-white hover:text-gray-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/apply"
                    className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 
                      shadow-sm hover:bg-gray-100 text-center"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
} 