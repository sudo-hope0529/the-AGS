import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalizationEngine } from '@/lib/ai/personalization';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@radix-ui/react-avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'mentor';
  timestamp: Date;
}

export const VirtualMentor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const personalization = PersonalizationEngine.getInstance();

  useEffect(() => {
    if (user) {
      sendWelcomeMessage();
    }
  }, [user]);

  const sendWelcomeMessage = async () => {
    const userProfile = await personalization.getUserProfile(user!.id);
    addMessage({
      id: Date.now().toString(),
      content: `Welcome back ${userProfile?.name}! How can I help you today with your learning journey?`,
      type: 'mentor',
      timestamp: new Date()
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    addMessage({
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date()
    });

    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/virtual-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId: user?.id })
      });

      const data = await response.json();
      
      addMessage({
        id: Date.now().toString(),
        content: data.response,
        type: 'mentor',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="flex items-center p-4 border-b dark:border-gray-700">
        <Avatar className="h-10 w-10 rounded-full bg-primary">
          <img src="/mentor-avatar.png" alt="Virtual Mentor" />
        </Avatar>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Virtual Mentor</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Always here to help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-gray-500"
            >
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor anything..."
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Send
          </Button>
        </div>
      </form>

      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </Card>
  );
};
