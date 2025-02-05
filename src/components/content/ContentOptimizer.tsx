import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Configuration, OpenAIApi } from 'openai';
import { debounce } from 'lodash';

interface ContentSection {
  id: string;
  content: string;
  importance: number;
  summary?: string;
  highlights?: string[];
}

interface UserAttention {
  timestamp: number;
  scrollPosition: number;
  dwellTime: number;
  section: string;
}

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const ContentOptimizer: React.FC<{ content: string }> = ({ content }) => {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [attentionData, setAttentionData] = useState<UserAttention[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    initializeContent();
    loadUserPreferences();
    setupAttentionTracking();
    return () => cleanup();
  }, [content]);

  const initializeContent = async () => {
    // Split content into semantic sections using AI
    const sections = await splitIntoSections(content);
    setSections(sections);

    // Generate initial summaries and highlights
    sections.forEach(async (section) => {
      const [summary, highlights] = await Promise.all([
        generateSummary(section.content),
        generateHighlights(section.content)
      ]);

      updateSection(section.id, { summary, highlights });
    });
  };

  const splitIntoSections = async (content: string) => {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Split the following content into logical sections, assigning importance scores."
        },
        {
          role: "user",
          content
        }
      ],
    });

    return JSON.parse(response.data.choices[0].message?.content || "[]");
  };

  const generateSummary = async (content: string) => {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate a concise summary of the following content."
        },
        {
          role: "user",
          content
        }
      ],
    });

    return response.data.choices[0].message?.content;
  };

  const generateHighlights = async (content: string) => {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Extract key points and important phrases from the following content."
        },
        {
          role: "user",
          content
        }
      ],
    });

    return JSON.parse(response.data.choices[0].message?.content || "[]");
  };

  const loadUserPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setUserPreferences(data);
  };

  const setupAttentionTracking = () => {
    if (!contentRef.current) return;

    // Track scroll position
    window.addEventListener('scroll', handleScroll);

    // Track mouse movement
    contentRef.current.addEventListener('mousemove', handleMouseMove);

    // Track visibility
    const observer = new IntersectionObserver(handleVisibility, {
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
  };

  const handleScroll = debounce(() => {
    if (!contentRef.current) return;

    const scrollPosition = window.scrollY;
    const timestamp = Date.now();

    // Find visible sections
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

        if (isVisible) {
          recordAttention({
            timestamp,
            scrollPosition,
            dwellTime: 0,
            section: section.id
          });
        }
      }
    });
  }, 100);

  const handleMouseMove = debounce((e: MouseEvent) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const sectionId = findParentSectionId(element);
      if (sectionId) {
        recordAttention({
          timestamp: Date.now(),
          scrollPosition: window.scrollY,
          dwellTime: 0,
          section: sectionId
        });
      }
    }
  }, 100);

  const handleVisibility = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        recordAttention({
          timestamp: Date.now(),
          scrollPosition: window.scrollY,
          dwellTime: 0,
          section: sectionId
        });
      }
    });
  };

  const recordAttention = async (attention: UserAttention) => {
    if (!user) return;

    setAttentionData(prev => [...prev, attention]);

    await supabase
      .from('content_attention')
      .insert([{
        user_id: user.id,
        ...attention
      }]);

    // Analyze attention patterns and update content
    if (attentionData.length > 10) {
      analyzeAttentionPatterns();
    }
  };

  const analyzeAttentionPatterns = async () => {
    const patterns = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze user attention patterns and suggest content optimizations."
        },
        {
          role: "user",
          content: JSON.stringify(attentionData)
        }
      ],
    });

    const optimizations = JSON.parse(patterns.data.choices[0].message?.content || "{}");
    applyOptimizations(optimizations);
  };

  const applyOptimizations = (optimizations: any) => {
    setSections(prev => prev.map(section => ({
      ...section,
      importance: optimizations[section.id]?.importance || section.importance
    })));
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const findParentSectionId = (element: Element): string | null => {
    let current = element;
    while (current && current !== contentRef.current) {
      if (current.id && sections.some(s => s.id === current.id)) {
        return current.id;
      }
      current = current.parentElement!;
    }
    return null;
  };

  const cleanup = () => {
    window.removeEventListener('scroll', handleScroll);
    if (contentRef.current) {
      contentRef.current.removeEventListener('mousemove', handleMouseMove);
    }
  };

  return (
    <div ref={contentRef} className="relative">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left"
        style={{ scaleX }}
      />

      {/* Content Sections */}
      {sections.map((section) => (
        <motion.div
          key={section.id}
          id={section.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          {/* Section Content */}
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </div>

          {/* Section Summary (Expandable) */}
          {section.summary && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <h4 className="font-semibold mb-2">Summary</h4>
              <p>{section.summary}</p>
            </motion.div>
          )}

          {/* Section Highlights */}
          {section.highlights && section.highlights.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Key Points</h4>
              <ul className="list-disc list-inside">
                {section.highlights.map((highlight, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ))}

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsGeneratingSummary(true)}
        className="fixed bottom-4 right-4 p-3 bg-primary text-white rounded-full shadow-lg"
      >
        {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
      </motion.button>
    </div>
  );
};
