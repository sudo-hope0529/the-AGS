import HeroSection from '@/components/home/HeroSection'
import AboutOverview from '@/components/home/AboutOverview'
import Highlights from '@/components/home/Highlights'
import Testimonials from '@/components/home/Testimonials'
import Newsletter from '@/components/home/Newsletter'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <AboutOverview />
      <Highlights />
      <Testimonials />
      <Newsletter />
    </div>
  )
} 