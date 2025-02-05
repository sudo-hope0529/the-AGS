import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '@/lib/supabase';

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    // Get user's current skills and learning history
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    const { data: learningHistory } = await supabase
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Generate personalized assessment questions
    const prompt = `
      Create a skill assessment question based on the following context:
      User's Current Skills: ${JSON.stringify(userSkills)}
      Recent Learning History: ${JSON.stringify(learningHistory)}

      Generate a JSON response with the following structure:
      {
        "question": "The question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct option",
        "explanation": "Detailed explanation",
        "skillArea": "The skill being tested",
        "difficulty": "1-10 scale"
      }
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert technical interviewer and educator." },
        { role: "user", content: prompt }
      ],
    });

    const questionData = JSON.parse(completion.data.choices[0].message?.content || "{}");

    // Store the assessment question
    const { data: assessment } = await supabase
      .from('skill_assessments')
      .insert([{
        user_id: userId,
        question_data: questionData,
        status: 'in_progress',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    // Remove the correct answer before sending to frontend
    const { correctAnswer, explanation, ...questionForUser } = questionData;
    return NextResponse.json({
      ...questionForUser,
      id: assessment?.id,
      totalQuestions: 10 // Fixed number of questions per assessment
    });
  } catch (error) {
    console.error('Error generating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to generate assessment' },
      { status: 500 }
    );
  }
}
