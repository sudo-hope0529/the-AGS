import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { cache } from 'react'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export interface AIResponse {
  content: string
  sources?: string[]
  error?: string
  timestamp?: number
}

interface CacheItem {
  data: AIResponse
  timestamp: number
}

const responseCache = new Map<string, CacheItem>()

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryWithDelay(fn, retries - 1, delay * 2)
  }
}

function getCachedResponse(cacheKey: string): AIResponse | null {
  const cached = responseCache.get(cacheKey)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > CACHE_DURATION) {
    responseCache.delete(cacheKey)
    return null
  }
  
  return cached.data
}

function setCachedResponse(cacheKey: string, response: AIResponse) {
  responseCache.set(cacheKey, {
    data: response,
    timestamp: Date.now(),
  })
}

export const getScientificUpdates = cache(async (): Promise<AIResponse> => {
  const cacheKey = 'scientific_updates'
  const cached = getCachedResponse(cacheKey)
  if (cached) return cached

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
    })
    
    const prompt = `Provide a brief summary of the latest major scientific and technological developments in the past week. 
    Focus on breakthroughs in:
    1. Technology and AI
    2. Space Exploration
    3. Medical Research
    4. Environmental Science
    Format the response in markdown with clear sections and include source links where available.
    Ensure the response is engaging and accessible to a general audience while maintaining technical accuracy.`

    const result = await retryWithDelay(async () => {
      const generationResult = await model.generateContent(prompt)
      return generationResult.response
    })

    const response = {
      content: result.text(),
      sources: extractSourceLinks(result.text()),
      timestamp: Date.now(),
    }

    setCachedResponse(cacheKey, response)
    return response
  } catch (error) {
    console.error('Error fetching scientific updates:', error)
    return {
      content: '',
      error: 'Failed to fetch scientific updates. Please try again later.',
      timestamp: Date.now(),
    }
  }
})

export const getPersonalizedLearningContent = cache(async (
  userInterests: string[],
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<AIResponse> => {
  const cacheKey = `learning_${skillLevel}_${userInterests.sort().join('_')}`
  const cached = getCachedResponse(cacheKey)
  if (cached) return cached

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
    })
    
    const prompt = `Generate personalized learning content for a ${skillLevel} level user interested in ${userInterests.join(', ')}.
    Include:
    1. Recommended learning path with clear milestones
    2. Key concepts to focus on, explained in an engaging way
    3. Practical projects to try, with increasing complexity
    4. Useful resources, tools, and communities
    Format the response in markdown with clear sections.
    Make the content engaging and actionable.`

    const result = await retryWithDelay(async () => {
      const generationResult = await model.generateContent(prompt)
      return generationResult.response
    })

    const response = {
      content: result.text(),
      timestamp: Date.now(),
    }

    setCachedResponse(cacheKey, response)
    return response
  } catch (error) {
    console.error('Error generating learning content:', error)
    return {
      content: '',
      error: 'Failed to generate personalized content. Please try again later.',
      timestamp: Date.now(),
    }
  }
})

export const getProjectFeedback = cache(async (
  projectDescription: string,
  techStack: string[]
): Promise<AIResponse> => {
  const cacheKey = `feedback_${hashString(projectDescription)}_${techStack.sort().join('_')}`
  const cached = getCachedResponse(cacheKey)
  if (cached) return cached

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
    })
    
    const prompt = `Analyze this project and provide constructive feedback:
    Project: ${projectDescription}
    Tech Stack: ${techStack.join(', ')}
    
    Provide detailed feedback on:
    1. Technical architecture and design patterns
    2. Best practices and industry standards
    3. Potential improvements and optimizations
    4. Security considerations and recommendations
    5. Scalability and maintenance aspects
    Format the response in markdown with clear sections.
    Be constructive and provide specific, actionable recommendations.`

    const result = await retryWithDelay(async () => {
      const generationResult = await model.generateContent(prompt)
      return generationResult.response
    })

    const response = {
      content: result.text(),
      timestamp: Date.now(),
    }

    setCachedResponse(cacheKey, response)
    return response
  } catch (error) {
    console.error('Error generating project feedback:', error)
    return {
      content: '',
      error: 'Failed to generate project feedback. Please try again later.',
      timestamp: Date.now(),
    }
  }
})

function extractSourceLinks(text: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    if (isValidUrl(match[2])) {
      links.push(match[2])
    }
  }

  return [...new Set(links)] // Remove duplicates
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
