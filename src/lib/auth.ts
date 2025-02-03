import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async setupMFA(): Promise<MFASetupResponse> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email!, 'AGS Platform', secret);
    
    // Store the secret in the user's metadata
    await supabase
      .from('user_mfa')
      .upsert({ 
        user_id: user.id,
        secret: secret,
        enabled: false
      });

    return {
      secret,
      qrCode: otpauthUrl
    };
  }

  async verifyMFA(token: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: mfaData } = await supabase
      .from('user_mfa')
      .select('secret')
      .eq('user_id', user.id)
      .single();

    if (!mfaData?.secret) throw new Error('MFA not set up');

    return authenticator.verify({
      token,
      secret: mfaData.secret
    });
  }

  async enableMFA(token: string): Promise<boolean> {
    const isValid = await this.verifyMFA(token);
    if (!isValid) throw new Error('Invalid MFA token');

    const user = await this.getCurrentUser();
    await supabase
      .from('user_mfa')
      .update({ enabled: true })
      .eq('user_id', user!.id);

    return true;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }
}
