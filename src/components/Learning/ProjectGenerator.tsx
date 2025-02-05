import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PersonalizationEngine } from '@/lib/ai/personalization';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTemplate {
  title: string;
  description: string;
  difficulty: number;
  technologies: string[];
  timeEstimate: string;
  learningObjectives: string[];
  codeTemplate: string;
  resources: { title: string; url: string }[];
}

export const ProjectGenerator: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(5);
  const [timeFrame, setTimeFrame] = useState('medium');
  const [generatedProject, setGeneratedProject] = useState<ProjectTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const personalization = PersonalizationEngine.getInstance();

  const technologies = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
    'Machine Learning', 'Data Science', 'Web Development', 'Mobile Development'
  ];

  const generateProject = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          technologies: selectedTech,
          difficulty,
          timeFrame
        })
      });

      const project = await response.json();
      setGeneratedProject(project);
    } catch (error) {
      console.error('Error generating project:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTechSelect = (tech: string) => {
    setSelectedTech(prev => 
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">AI Project Generator</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map(tech => (
                <Badge
                  key={tech}
                  variant={selectedTech.includes(tech) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTechSelect(tech)}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Project Difficulty</h3>
            <Slider
              value={[difficulty]}
              onValueChange={([value]) => setDifficulty(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm mt-2">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Time Frame</h3>
            <Select
              value={timeFrame}
              onValueChange={setTimeFrame}
            >
              <option value="short">Short (1-2 days)</option>
              <option value="medium">Medium (1-2 weeks)</option>
              <option value="long">Long (1+ months)</option>
            </Select>
          </div>

          <Button
            onClick={generateProject}
            disabled={isGenerating || selectedTech.length === 0}
            className="w-full"
          >
            {isGenerating ? 'Generating Project...' : 'Generate Project'}
          </Button>
        </div>
      </Card>

      {generatedProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">{generatedProject.title}</h2>
            
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="template">Code Template</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {generatedProject.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedProject.technologies.map(tech => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Learning Objectives</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {generatedProject.learningObjectives.map((objective, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-300">
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="template">
                <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <code>{generatedProject.codeTemplate}</code>
                </pre>
              </TabsContent>

              <TabsContent value="resources">
                <div className="space-y-3">
                  {generatedProject.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {resource.title}
                    </a>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
