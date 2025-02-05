import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Configuration, OpenAIApi } from 'openai';
import { debounce } from 'lodash';
import { FaMicrophone, FaSearch, FaSpinner } from 'react-icons/fa';

interface SearchResult {
  id: string;
  type: 'course' | 'article' | 'video' | 'exercise';
  title: string;
  description: string;
  relevanceScore: number;
  confidence: number;
  metadata: any;
}

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const AISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { user } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadSearchHistory();
    initializeSpeechRecognition();
    return () => cleanup();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');

        setQuery(transcript);
        if (event.results[0].isFinal) {
          performSearch(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  };

  const loadSearchHistory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setSearchHistory(data?.map(item => item.query) || []);
  };

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // Generate search embedding using OpenAI
      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: searchQuery,
      });
      
      const searchEmbedding = embeddingResponse.data.data[0].embedding;

      // Perform semantic search
      const { data: semanticResults } = await supabase
        .rpc('match_documents', {
          query_embedding: searchEmbedding,
          match_threshold: 0.7,
          match_count: 10
        });

      // Natural language query understanding
      const nlpResponse = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a search query analyzer. Extract key information and intent from the query."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
      });

      const queryAnalysis = JSON.parse(nlpResponse.data.choices[0].message?.content || "{}");

      // Combine and rank results
      const enhancedResults = await enhanceSearchResults(semanticResults, queryAnalysis);
      setResults(enhancedResults);

      // Store search history
      if (user) {
        await supabase
          .from('search_history')
          .insert([{
            user_id: user.id,
            query: searchQuery,
            results_count: enhancedResults.length,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceSearchResults = async (results: any[], queryAnalysis: any) => {
    // Get user preferences and history
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    // Rerank results based on user preferences and query intent
    return results.map(result => ({
      ...result,
      relevanceScore: calculateRelevanceScore(result, queryAnalysis, userProfile),
      confidence: calculateConfidenceScore(result, queryAnalysis)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const calculateRelevanceScore = (result: any, queryAnalysis: any, userProfile: any) => {
    let score = result.similarity;

    // Adjust score based on user preferences
    if (userProfile?.preferred_content_types?.includes(result.type)) {
      score *= 1.2;
    }

    // Adjust based on query intent
    if (queryAnalysis.intent === result.content_category) {
      score *= 1.3;
    }

    return score;
  };

  const calculateConfidenceScore = (result: any, queryAnalysis: any) => {
    // Implement confidence scoring logic
    return 0.9; // Placeholder
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const generateSuggestions = debounce(async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a search suggestion generator. Provide relevant search suggestions based on the partial input."
          },
          {
            role: "user",
            content: `Generate 5 search suggestions for: ${input}`
          }
        ],
      });

      const suggestedQueries = JSON.parse(response.data.choices[0].message?.content || "[]");
      setSuggestions(suggestedQueries);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  }, 300);

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                generateSuggestions(e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && performSearch(query)}
              placeholder="Search using natural language..."
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary"
            />
            {isLoading && (
              <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>
          <button
            onClick={toggleVoiceSearch}
            className={`p-2 rounded-full ${
              isListening ? 'bg-red-500' : 'bg-primary'
            } text-white`}
          >
            <FaMicrophone />
          </button>
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                    setSuggestions([]);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <div className="mt-8 space-y-4">
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{result.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {result.description}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <div>Relevance: {Math.round(result.relevanceScore * 100)}%</div>
                  <div>Confidence: {Math.round(result.confidence * 100)}%</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(query);
                  performSearch(query);
                }}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
