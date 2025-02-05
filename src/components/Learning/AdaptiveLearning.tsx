import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  content: any;
}

interface UserProgress {
  completedCourses: string[];
  skillLevels: Record<string, number>;
}

export const AdaptiveLearning: React.FC = () => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);

  // Fetch user progress
  const { data: progress } = useQuery('userProgress', async () => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .single();
    if (error) throw error;
    return data;
  });

  // Fetch courses
  const { data: courses } = useQuery('courses', async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*');
    if (error) throw error;
    return data;
  });

  useEffect(() => {
    if (progress && courses) {
      // Algorithm to recommend courses based on user progress
      const recommendations = recommendCourses(courses, progress);
      setRecommendedCourses(recommendations);
    }
  }, [progress, courses]);

  const recommendCourses = (courses: Course[], progress: UserProgress) => {
    // Implementation of course recommendation algorithm
    return courses.filter(course => {
      const hasPrerequisites = course.prerequisites.every(prereq => 
        progress.completedCourses.includes(prereq)
      );
      const appropriateDifficulty = determineAppropriateLevel(progress.skillLevels);
      return hasPrerequisites && course.difficulty === appropriateDifficulty;
    });
  };

  const determineAppropriateLevel = (skillLevels: Record<string, number>) => {
    const averageSkill = Object.values(skillLevels).reduce((a, b) => a + b, 0) / 
      Object.values(skillLevels).length;
    if (averageSkill < 3) return 'beginner';
    if (averageSkill < 7) return 'intermediate';
    return 'advanced';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Learning Path</h2>
      
      {/* Progress Overview */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Progress Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          {userProgress && Object.entries(userProgress.skillLevels).map(([skill, level]) => (
            <div key={skill} className="text-center">
              <p className="font-medium">{skill}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(level / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendedCourses.map(course => (
          <div key={course.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
            <span className="inline-block px-2 py-1 text-sm text-white bg-blue-500 rounded">
              {course.difficulty}
            </span>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Start Learning
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdaptiveLearning;
