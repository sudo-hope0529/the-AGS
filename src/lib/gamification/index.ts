import { supabase } from '../supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  criteria: AchievementCriteria;
}

interface AchievementCriteria {
  type: 'course_completion' | 'contribution' | 'engagement' | 'skill_level';
  requirement: number;
  additionalParams?: Record<string, any>;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirements: Achievement[];
}

export class GamificationSystem {
  private static instance: GamificationSystem;

  private constructor() {}

  static getInstance(): GamificationSystem {
    if (!GamificationSystem.instance) {
      GamificationSystem.instance = new GamificationSystem();
    }
    return GamificationSystem.instance;
  }

  async trackActivity(userId: string, activity: {
    type: string;
    metadata: Record<string, any>;
  }) {
    // Record the activity
    await supabase
      .from('user_activities')
      .insert([{
        user_id: userId,
        activity_type: activity.type,
        metadata: activity.metadata,
      }]);

    // Check for achievements
    await this.checkAchievements(userId);
    
    // Update user level
    await this.updateUserLevel(userId);
  }

  async checkAchievements(userId: string) {
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    const { data: userActivities } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId);

    for (const achievement of achievements) {
      const isCompleted = await this.checkAchievementCriteria(
        achievement.criteria,
        userActivities
      );

      if (isCompleted) {
        await this.awardAchievement(userId, achievement.id);
      }
    }
  }

  private async checkAchievementCriteria(
    criteria: AchievementCriteria,
    activities: any[]
  ): Promise<boolean> {
    switch (criteria.type) {
      case 'course_completion':
        return activities.filter(
          a => a.activity_type === 'course_completion'
        ).length >= criteria.requirement;

      case 'contribution':
        return activities.filter(
          a => a.activity_type === 'contribution'
        ).length >= criteria.requirement;

      case 'engagement':
        return activities.filter(
          a => a.activity_type === 'engagement'
        ).length >= criteria.requirement;

      case 'skill_level':
        const { data: skills } = await supabase
          .from('user_skills')
          .select('proficiency_level')
          .gte('proficiency_level', criteria.requirement);
        return (skills?.length || 0) > 0;

      default:
        return false;
    }
  }

  private async awardAchievement(userId: string, achievementId: string) {
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (!existing) {
      await supabase
        .from('user_achievements')
        .insert([{
          user_id: userId,
          achievement_id: achievementId,
          awarded_at: new Date().toISOString(),
        }]);

      // Notify user
      await this.notifyUser(userId, 'achievement_unlocked', { achievementId });
    }
  }

  async updateUserLevel(userId: string) {
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievements (*)')
      .eq('user_id', userId);

    const totalPoints = achievements?.reduce(
      (sum, a) => sum + a.achievements.points,
      0
    ) || 0;

    const newLevel = this.calculateLevel(totalPoints);

    await supabase
      .from('users')
      .update({ level: newLevel })
      .eq('id', userId);

    // Check for level-up rewards
    await this.checkLevelRewards(userId, newLevel);
  }

  private calculateLevel(points: number): number {
    // Level calculation formula: level = floor(sqrt(points / 100))
    return Math.floor(Math.sqrt(points / 100));
  }

  private async checkLevelRewards(userId: string, level: number) {
    const { data: rewards } = await supabase
      .from('level_rewards')
      .select('*')
      .eq('level', level)
      .single();

    if (rewards) {
      await this.awardReward(userId, rewards);
    }
  }

  private async awardReward(userId: string, reward: any) {
    // Implement reward distribution logic
    await supabase
      .from('user_rewards')
      .insert([{
        user_id: userId,
        reward_id: reward.id,
        awarded_at: new Date().toISOString(),
      }]);

    // Notify user
    await this.notifyUser(userId, 'reward_earned', { rewardId: reward.id });
  }

  private async notifyUser(userId: string, type: string, data: any) {
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        data,
        created_at: new Date().toISOString(),
      }]);
  }

  async getLeaderboard(timeRange: 'daily' | 'weekly' | 'monthly' | 'all-time') {
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        level,
        user_achievements (count),
        user_activities (count)
      `)
      .order('level', { ascending: false })
      .limit(100);

    if (timeRange !== 'all-time') {
      const startDate = this.getStartDate(timeRange);
      query = query.gte('user_activities.created_at', startDate);
    }

    const { data } = await query;
    return data;
  }

  private getStartDate(timeRange: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    switch (timeRange) {
      case 'daily':
        return new Date(now.setDate(now.getDate() - 1)).toISOString();
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }
}
