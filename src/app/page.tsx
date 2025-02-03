import { 
  HeroSection, 
  AboutOverview, 
  Highlights, 
  Testimonials, 
  Newsletter 
} from '@/components/home'

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