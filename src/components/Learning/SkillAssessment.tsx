import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PersonalizationEngine } from '@/lib/ai/personalization';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Radar } from 'react-chartjs-2';

interface SkillData {
  name: string;
  level: number;
  recommendations: string[];
}

export const SkillAssessment: React.FC = () => {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const personalization = PersonalizationEngine.getInstance();

  useEffect(() => {
    if (user) {
      loadUserSkills();
    }
  }, [user]);

  const loadUserSkills = async () => {
    const userSkills = await personalization.getUserSkills(user!.id);
    setSkills(userSkills || []);
  };

  const startAssessment = async () => {
    setIsAssessing(true);
    setProgress(0);
    
    const assessment = await fetch('/api/generate-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id })
    });

    const data = await assessment.json();
    setCurrentAssessment(data);
  };

  const submitAnswer = async (answer: string) => {
    const response = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        assessmentId: currentAssessment.id,
        answer
      })
    });

    const result = await response.json();
    setProgress(prev => prev + (100 / currentAssessment.totalQuestions));

    if (result.isComplete) {
      await loadUserSkills();
      setIsAssessing(false);
      setCurrentAssessment(null);
    } else {
      setCurrentAssessment(result.nextQuestion);
    }
  };

  const getChartData = () => ({
    labels: skills.map(skill => skill.name),
    datasets: [{
      label: 'Skill Level',
      data: skills.map(skill => skill.level),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  });

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 10
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Skill Assessment</h2>
          {!isAssessing ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Take an AI-powered assessment to evaluate your skills and get personalized recommendations.
              </p>
              <Button
                onClick={startAssessment}
                className="w-full bg-primary text-white"
              >
                Start Assessment
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <Progress value={progress} className="w-full" />
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">{currentAssessment?.question}</h3>
                <div className="space-y-2">
                  {currentAssessment?.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      onClick={() => submitAnswer(option)}
                      variant="outline"
                      className="w-full text-left justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Skill Radar</h2>
          <div className="h-[300px]">
            <Radar data={getChartData()} options={chartOptions} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Skill Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <h3 className="font-semibold mb-2">{skill.name}</h3>
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <Progress value={skill.level * 10} className="w-full" />
                </div>
                <span className="ml-2 text-sm">{skill.level}/10</span>
              </div>
              <ul className="text-sm space-y-1">
                {skill.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-300">
                    • {rec}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};
