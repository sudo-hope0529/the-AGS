import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '../supabase';

export class PersonalizationEngine {
  private static instance: PersonalizationEngine;
  private openai: OpenAIApi;

  private constructor() {
    const configuration = new Configuration({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  static getInstance(): PersonalizationEngine {
    if (!PersonalizationEngine.instance) {
      PersonalizationEngine.instance = new PersonalizationEngine();
    }
    return PersonalizationEngine.instance;
  }

  async generateLearningPath(userId: string) {
    const userProfile = await this.getUserProfile(userId);
    const userGoals = await this.getUserGoals(userId);
    
    const prompt = `Create a personalized learning path for a user with the following profile:
      ${JSON.stringify(userProfile)}
      Their goals are: ${JSON.stringify(userGoals)}
      Provide a structured learning path with milestones and estimated completion times.`;

    const response = await this.openai.createCompletion({
      model: "gpt-4",
      prompt,
      max_tokens: 1000,
    });

    return this.parseLearningPath(response.data.choices[0].text || "");
  }

  async suggestPeerConnections(userId: string) {
    const userSkills = await this.getUserSkills(userId);
    const userInterests = await this.getUserInterests(userId);

    const { data: peers } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('id', userId)
      .limit(20);

    return this.rankPeersByCompatibility(peers, userSkills, userInterests);
  }

  async generatePersonalizedContent(userId: string, contentType: 'article' | 'exercise' | 'project') {
    const userLevel = await this.getUserProficiencyLevel(userId);
    const userPreferences = await this.getUserPreferences(userId);

    return this.openai.createCompletion({
      model: "gpt-4",
      prompt: `Generate a personalized ${contentType} for a user at ${userLevel} level with preferences: ${JSON.stringify(userPreferences)}`,
      max_tokens: 1500,
    });
  }

  private async getUserProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }

  private async getUserGoals(userId: string) {
    const { data } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId);
    return data;
  }

  private async getUserSkills(userId: string) {
    const { data } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);
    return data;
  }

  private async getUserInterests(userId: string) {
    const { data } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId);
    return data;
  }

  private async getUserProficiencyLevel(userId: string) {
    const { data } = await supabase
      .from('user_proficiency')
      .select('level')
      .eq('user_id', userId)
      .single();
    return data?.level || 'beginner';
  }

  private async getUserPreferences(userId: string) {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }

  private parseLearningPath(aiResponse: string) {
    try {
      return JSON.parse(aiResponse);
    } catch {
      return {
        milestones: aiResponse.split('\n').filter(Boolean),
        estimatedTime: '3 months'
      };
    }
  }

  private rankPeersByCompatibility(peers: any[], userSkills: any[], userInterests: any[]) {
    return peers.map(peer => ({
      ...peer,
      compatibilityScore: this.calculateCompatibilityScore(peer, userSkills, userInterests)
    })).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  private calculateCompatibilityScore(peer: any, userSkills: any[], userInterests: any[]) {
    // Implement compatibility scoring logic
    return Math.random(); // Placeholder
  }
}
