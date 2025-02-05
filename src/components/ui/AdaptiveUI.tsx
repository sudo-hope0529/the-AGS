import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Configuration, OpenAIApi } from 'openai';

interface UIElement {
  id: string;
  type: string;
  importance: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface EngagementData {
  elementId: string;
  interactionCount: number;
  averageDuration: number;
  lastInteraction: Date;
}

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const AdaptiveUI: React.FC = () => {
  const [uiElements, setUiElements] = useState<UIElement[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    initializeUI();
    setupEngagementTracking();
    setupAutoTheme();
    return () => cleanup();
  }, []);

  const initializeUI = async () => {
    if (!user) return;

    // Load user's UI preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load engagement history
    const { data: history } = await supabase
      .from('ui_engagement')
      .select('*')
      .eq('user_id', user.id);

    // Generate AI-optimized UI layout
    const optimizedLayout = await generateOptimizedLayout(preferences, history);
    setUiElements(optimizedLayout);
  };

  const generateOptimizedLayout = async (preferences: any, history: any) => {
    const prompt = `
      Generate an optimal UI layout based on:
      User Preferences: ${JSON.stringify(preferences)}
      Interaction History: ${JSON.stringify(history)}
      
      Consider:
      1. Most frequently accessed elements
      2. User's reading patterns
      3. Device characteristics
      4. Accessibility needs
      
      Return a JSON array of UI elements with positions and importance scores.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a UI optimization expert." },
        { role: "user", content: prompt }
      ],
    });

    return JSON.parse(completion.data.choices[0].message?.content || "[]");
  };

  const setupEngagementTracking = () => {
    // Track mouse movements and interactions
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);

    // Track focus time
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const setupAutoTheme = () => {
    // Auto theme based on time
    const hours = new Date().getHours();
    if (hours >= 18 || hours < 6) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    // Update theme based on ambient light if supported
    if ('AmbientLightSensor' in window) {
      const sensor = new (window as any).AmbientLightSensor();
      sensor.addEventListener('reading', () => {
        if (sensor.illuminance < 10) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      });
      sensor.start();
    }
  };

  const handleMouseMove = async (e: MouseEvent) => {
    // Track user attention and reading patterns
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      await updateElementEngagement(element.id);
    }
  };

  const handleClick = async (e: MouseEvent) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      await recordInteraction(element.id, 'click');
    }
  };

  const handleScroll = async () => {
    // Track reading progress and adjust UI
    const scrollPosition = window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    const progress = (scrollPosition / pageHeight) * 100;

    await updateReadingProgress(progress);
  };

  const handleVisibilityChange = async () => {
    if (document.hidden) {
      await pauseEngagementTracking();
    } else {
      await resumeEngagementTracking();
    }
  };

  const updateElementEngagement = async (elementId: string) => {
    if (!user) return;

    const timestamp = new Date().toISOString();
    await supabase
      .from('ui_engagement')
      .insert([{
        user_id: user.id,
        element_id: elementId,
        interaction_type: 'hover',
        timestamp
      }]);

    // Update local engagement data
    setEngagementData(prev => {
      const element = prev.find(e => e.elementId === elementId);
      if (element) {
        return prev.map(e => 
          e.elementId === elementId
            ? { ...e, interactionCount: e.interactionCount + 1, lastInteraction: new Date() }
            : e
        );
      }
      return [...prev, {
        elementId,
        interactionCount: 1,
        averageDuration: 0,
        lastInteraction: new Date()
      }];
    });
  };

  const recordInteraction = async (elementId: string, type: string) => {
    if (!user) return;

    await supabase
      .from('ui_interactions')
      .insert([{
        user_id: user.id,
        element_id: elementId,
        interaction_type: type,
        timestamp: new Date().toISOString()
      }]);
  };

  const updateReadingProgress = async (progress: number) => {
    if (!user) return;

    await supabase
      .from('reading_progress')
      .insert([{
        user_id: user.id,
        progress,
        timestamp: new Date().toISOString()
      }]);
  };

  const toggleFocusMode = async () => {
    setFocusMode(prev => !prev);
    
    // Adjust UI elements' visibility based on importance
    const updatedElements = uiElements.map(element => ({
      ...element,
      opacity: focusMode ? 
        element.importance > 0.7 ? 1 : 0.3 :
        1
    }));

    setUiElements(updatedElements);
  };

  const cleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('scroll', handleScroll);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  return (
    <div className={`relative ${focusMode ? 'focus-mode' : ''}`}>
      <AnimatePresence>
        {uiElements.map(element => (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: focusMode ? (element.importance > 0.7 ? 1 : 0.3) : 1,
              scale: 1,
              x: element.position.x,
              y: element.position.y,
              width: element.size.width,
              height: element.size.height
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute"
            style={{
              zIndex: Math.floor(element.importance * 10)
            }}
          >
            {/* Render the actual UI element based on type */}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Focus Mode Toggle */}
      <button
        onClick={toggleFocusMode}
        className="fixed bottom-4 left-4 p-2 rounded-full bg-primary text-white"
      >
        {focusMode ? 'Disable' : 'Enable'} Focus Mode
      </button>

      <style jsx global>{`
        .focus-mode {
          background: ${theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'};
        }
      `}</style>
    </div>
  );
};
