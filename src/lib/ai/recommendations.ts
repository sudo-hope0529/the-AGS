import { supabase } from '../supabase';
import { Configuration, OpenAIApi } from 'openai';

interface UserInteraction {
  contentId: string;
  contentType: 'course' | 'article' | 'project';
  interactionType: 'view' | 'complete' | 'like' | 'share';
  timestamp: Date;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'course' | 'article' | 'project';
}

export class RecommendationEngine {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async getUserProfile(userId: string) {
    // Get user's skills and interests
    const { data: skills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    // Get user's learning history
    const { data: history } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId);

    return {
      skills,
      history
    };
  }

  async getContentEmbedding(content: ContentItem) {
    const response = await this.openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: `${content.title} ${content.description} ${content.tags.join(' ')}`
    });

    return response.data.data[0].embedding;
  }

  async generatePersonalizedRecommendations(userId: string) {
    const userProfile = await this.getUserProfile(userId);
    
    // Get all available content
    const { data: allContent } = await supabase
      .from('content')
      .select('*');

    // Generate embeddings for user profile and content
    const userProfileText = this.generateUserProfileText(userProfile);
    const userEmbedding = await this.getContentEmbedding({ 
      id: 'user',
      title: 'User Profile',
      description: userProfileText,
      tags: [],
      difficulty: 'intermediate',
      type: 'course'
    });

    // Calculate similarity scores
    const recommendations = await Promise.all(
      allContent.map(async (content) => {
        const contentEmbedding = await this.getContentEmbedding(content);
        const similarity = this.calculateCosineSimilarity(userEmbedding, contentEmbedding);
        return { content, similarity };
      })
    );

    // Sort by similarity and return top recommendations
    return recommendations
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(r => r.content);
  }

  private generateUserProfileText(userProfile: any): string {
    const skills = userProfile.skills
      .map((s: any) => `${s.skill_name} (Level: ${s.proficiency_level})`)
      .join(', ');

    const history = userProfile.history
      .map((h: any) => `Completed: ${h.course_title}`)
      .join(', ');

    return `Skills: ${skills}. Learning History: ${history}`;
  }

  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  async trackUserInteraction(userId: string, interaction: UserInteraction) {
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: userId,
        ...interaction
      }]);

    // Update recommendations cache
    await this.updateRecommendationsCache(userId);
  }

  private async updateRecommendationsCache(userId: string) {
    const recommendations = await this.generatePersonalizedRecommendations(userId);
    await supabase
      .from('recommendation_cache')
      .upsert({
        user_id: userId,
        recommendations: recommendations,
        updated_at: new Date().toISOString()
      });
  }
}
