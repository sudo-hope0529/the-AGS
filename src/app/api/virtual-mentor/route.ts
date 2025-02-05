import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '@/lib/supabase';

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    // Get user context
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    const { data: learningPath } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create context-aware prompt
    const prompt = `
      As an AI mentor, consider the following context:
      User Profile: ${JSON.stringify(userProfile)}
      User Skills: ${JSON.stringify(userSkills)}
      Current Learning Path: ${JSON.stringify(learningPath)}
      
      User Message: "${message}"
      
      Provide a helpful, encouraging, and personalized response that takes into account the user's background and goals.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a knowledgeable and supportive virtual mentor." },
        { role: "user", content: prompt }
      ],
    });

    const response = completion.data.choices[0].message?.content || "I apologize, but I couldn't generate a response at this time.";

    // Log the interaction
    await supabase
      .from('mentor_interactions')
      .insert([{
        user_id: userId,
        user_message: message,
        mentor_response: response,
        timestamp: new Date().toISOString()
      }]);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in virtual mentor:', error);
    return NextResponse.json(
      { error: 'Failed to process mentor response' },
      { status: 500 }
    );
  }
}
