import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export interface AIResponse {
  content: string
  sources?: string[]
  error?: string
}

export async function getScientificUpdates(): Promise<AIResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `Provide a brief summary of the latest major scientific and technological developments in the past week. 
    Focus on breakthroughs in:
    1. Technology and AI
    2. Space Exploration
    3. Medical Research
    4. Environmental Science
    Format the response in markdown with clear sections and include source links where available.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return {
      content: text,
      sources: extractSourceLinks(text)
    }
  } catch (error) {
    console.error('Error fetching scientific updates:', error)
    return {
      content: '',
      error: 'Failed to fetch scientific updates. Please try again later.'
    }
  }
}

export async function getPersonalizedLearningContent(
  userInterests: string[],
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<AIResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `Generate personalized learning content for a ${skillLevel} level user interested in ${userInterests.join(', ')}.
    Include:
    1. Recommended learning path
    2. Key concepts to focus on
    3. Practical projects to try
    4. Useful resources and tools
    Format the response in markdown with clear sections.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    
    return {
      content: response.text()
    }
  } catch (error) {
    console.error('Error generating learning content:', error)
    return {
      content: '',
      error: 'Failed to generate personalized content. Please try again later.'
    }
  }
}

export async function getProjectFeedback(
  projectDescription: string,
  techStack: string[]
): Promise<AIResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `Analyze this project and provide constructive feedback:
    Project: ${projectDescription}
    Tech Stack: ${techStack.join(', ')}
    
    Provide feedback on:
    1. Technical architecture
    2. Best practices
    3. Potential improvements
    4. Security considerations
    Format the response in markdown with clear sections.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    
    return {
      content: response.text()
    }
  } catch (error) {
    console.error('Error generating project feedback:', error)
    return {
      content: '',
      error: 'Failed to generate project feedback. Please try again later.'
    }
  }
}

function extractSourceLinks(text: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    links.push(match[2])
  }

  return links
}
