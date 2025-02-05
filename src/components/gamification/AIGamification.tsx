import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Configuration, OpenAIApi } from 'openai';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: number;
  category: string;
  requirements: any;
  isUnlocked: boolean;
  progress: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: number;
  deadline: Date;
  requirements: any;
  isCompleted: boolean;
  progress: number;
}

interface UserStats {
  level: number;
  experience: number;
  streakDays: number;
  totalPoints: number;
  achievements: string[];
  completedChallenges: string[];
}

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const AIGamification: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [motivationLevel, setMotivationLevel] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeGamification();
      startMotivationTracking();
    }
  }, [user]);

  const initializeGamification = async () => {
    await Promise.all([
      loadUserStats(),
      generateAchievements(),
      generateChallenges(),
    ]);
  };

  const loadUserStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setUserStats(data);
  };

  const generateAchievements = async () => {
    if (!user || !userStats) return;

    // Get user's learning history and preferences
    const { data: learningHistory } = await supabase
      .from('learning_history')
      .select('*')
      .eq('user_id', user.id);

    // Generate personalized achievements using AI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate personalized achievements based on user's learning history and current level."
        },
        {
          role: "user",
          content: `
            User Level: ${userStats.level}
            Learning History: ${JSON.stringify(learningHistory)}
            Current Achievements: ${JSON.stringify(userStats.achievements)}
          `
        }
      ],
    });

    const newAchievements = JSON.parse(response.data.choices[0].message?.content || "[]");
    setAchievements(newAchievements);
  };

  const generateChallenges = async () => {
    if (!user || !userStats) return;

    // Analyze user's motivation level and learning patterns
    const motivationScore = await analyzeMotivation();

    // Generate personalized challenges using AI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate personalized challenges based on user's motivation level and learning progress."
        },
        {
          role: "user",
          content: `
            User Level: ${userStats.level}
            Motivation Score: ${motivationScore}
            Completed Challenges: ${JSON.stringify(userStats.completedChallenges)}
          `
        }
      ],
    });

    const newChallenges = JSON.parse(response.data.choices[0].message?.content || "[]");
    setChallenges(newChallenges);
  };

  const startMotivationTracking = () => {
    // Track various engagement metrics
    trackEngagementMetrics();

    // Periodically analyze motivation
    setInterval(async () => {
      const score = await analyzeMotivation();
      setMotivationLevel(score);

      // Adjust challenges and rewards based on motivation
      if (score < 0.5) {
        await generateEasierChallenges();
      } else if (score > 0.8) {
        await generateHarderChallenges();
      }
    }, 300000); // Every 5 minutes
  };

  const trackEngagementMetrics = () => {
    // Track time spent on platform
    let startTime = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const duration = Date.now() - startTime;
        recordEngagement('session_duration', duration);
      } else {
        startTime = Date.now();
      }
    });

    // Track interactions
    document.addEventListener('click', () => {
      recordEngagement('interaction', 1);
    });

    // Track progress
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      recordEngagement('scroll_depth', scrollPercent);
    });
  };

  const recordEngagement = async (metric: string, value: number) => {
    if (!user) return;

    await supabase
      .from('engagement_metrics')
      .insert([{
        user_id: user.id,
        metric,
        value,
        timestamp: new Date().toISOString()
      }]);
  };

  const analyzeMotivation = async (): Promise<number> => {
    if (!user) return 0;

    // Get recent engagement metrics
    const { data: metrics } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    // Analyze metrics using AI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze user engagement metrics and determine motivation level (0-1)."
        },
        {
          role: "user",
          content: JSON.stringify(metrics)
        }
      ],
    });

    return parseFloat(response.data.choices[0].message?.content || "0.5");
  };

  const generateEasierChallenges = async () => {
    if (!user || !userStats) return;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate easier, more achievable challenges to boost user motivation."
        },
        {
          role: "user",
          content: `
            User Level: ${userStats.level}
            Current Challenges: ${JSON.stringify(challenges)}
          `
        }
      ],
    });

    const newChallenges = JSON.parse(response.data.choices[0].message?.content || "[]");
    setChallenges(newChallenges);
  };

  const generateHarderChallenges = async () => {
    if (!user || !userStats) return;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate more challenging tasks to maintain user engagement."
        },
        {
          role: "user",
          content: `
            User Level: ${userStats.level}
            Current Challenges: ${JSON.stringify(challenges)}
          `
        }
      ],
    });

    const newChallenges = JSON.parse(response.data.choices[0].message?.content || "[]");
    setChallenges(newChallenges);
  };

  const unlockAchievement = async (achievementId: string) => {
    if (!user || !userStats) return;

    // Update user stats
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const updatedStats = {
      ...userStats,
      experience: userStats.experience + achievement.points,
      achievements: [...userStats.achievements, achievementId]
    };

    // Check for level up
    const newLevel = Math.floor(updatedStats.experience / 1000);
    if (newLevel > userStats.level) {
      updatedStats.level = newLevel;
      celebrateLevelUp(newLevel);
    }

    // Update database
    await supabase
      .from('user_stats')
      .update(updatedStats)
      .eq('user_id', user.id);

    setUserStats(updatedStats);
    
    // Show celebration animation
    celebrateAchievement(achievement);
  };

  const celebrateAchievement = (achievement: Achievement) => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const celebrateLevelUp = (level: number) => {
    // Trigger special level up animation
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500']
    });
  };

  return (
    <div className="p-6 space-y-8">
      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{userStats.level}</div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{userStats.experience}</div>
              <div className="text-sm text-gray-500">XP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{userStats.streakDays}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{userStats.totalPoints}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Active Challenges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Active Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {challenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-2">{challenge.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{challenge.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Reward: {challenge.reward} XP
                  </div>
                  <div className="text-sm text-gray-500">
                    Difficulty: {challenge.difficulty}/10
                  </div>
                </div>
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div className="text-xs font-semibold inline-block text-primary">
                        {Math.round(challenge.progress)}% Complete
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${challenge.progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${
                  achievement.isUnlocked ? 'border-2 border-primary' : 'opacity-75'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{achievement.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {achievement.description}
                </p>
                <div className="text-sm text-gray-500">
                  {achievement.points} Points
                </div>
                {!achievement.isUnlocked && achievement.progress > 0 && (
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
