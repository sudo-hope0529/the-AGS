import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '@/lib/supabase';

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(request: Request) {
  try {
    const { userId, assessmentId, answer } = await request.json();

    // Get the current assessment question
    const { data: assessment } = await supabase
      .from('skill_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    const questionData = assessment.question_data;
    const isCorrect = answer === questionData.correctAnswer;

    // Store the answer
    await supabase
      .from('assessment_answers')
      .insert([{
        assessment_id: assessmentId,
        user_id: userId,
        question: questionData.question,
        user_answer: answer,
        correct_answer: questionData.correctAnswer,
        is_correct: isCorrect,
        explanation: questionData.explanation,
        skill_area: questionData.skillArea,
        created_at: new Date().toISOString()
      }]);

    // Get all answers for this assessment
    const { count } = await supabase
      .from('assessment_answers')
      .select('*', { count: 'exact' })
      .eq('assessment_id', assessmentId);

    // Check if assessment is complete
    if (count >= 10) { // 10 questions per assessment
      // Calculate final results
      const { data: answers } = await supabase
        .from('assessment_answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      const results = analyzeResults(answers);

      // Update user skills based on assessment results
      await updateUserSkills(userId, results);

      // Mark assessment as complete
      await supabase
        .from('skill_assessments')
        .update({ status: 'completed', results })
        .eq('id', assessmentId);

      return NextResponse.json({
        isComplete: true,
        results
      });
    }

    // Generate next question if assessment is not complete
    const prompt = `
      Generate the next assessment question based on:
      Previous Answer Correct: ${isCorrect}
      Skill Area: ${questionData.skillArea}
      Current Difficulty: ${questionData.difficulty}

      Adjust difficulty based on performance.
      Return in JSON format with:
      {
        "question": "string",
        "options": ["array"],
        "correctAnswer": "string",
        "explanation": "string",
        "skillArea": "string",
        "difficulty": number
      }
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert technical interviewer and educator." },
        { role: "user", content: prompt }
      ],
    });

    const nextQuestionData = JSON.parse(completion.data.choices[0].message?.content || "{}");

    // Store the next question
    await supabase
      .from('skill_assessments')
      .update({ question_data: nextQuestionData })
      .eq('id', assessmentId);

    // Remove correct answer before sending to frontend
    const { correctAnswer, explanation, ...questionForUser } = nextQuestionData;
    return NextResponse.json({
      isComplete: false,
      nextQuestion: {
        ...questionForUser,
        id: assessmentId,
        totalQuestions: 10
      }
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}

function analyzeResults(answers: any[]) {
  const skillAreas = [...new Set(answers.map(a => a.skill_area))];
  const results = {};

  skillAreas.forEach(area => {
    const areaAnswers = answers.filter(a => a.skill_area === area);
    const correctCount = areaAnswers.filter(a => a.is_correct).length;
    const totalCount = areaAnswers.length;
    const score = (correctCount / totalCount) * 10;

    results[area] = {
      score,
      strengths: [],
      weaknesses: [],
      recommendations: []
    };
  });

  return results;
}

async function updateUserSkills(userId: string, results: any) {
  const updates = Object.entries(results).map(([skill, data]) => ({
    user_id: userId,
    skill_name: skill,
    skill_level: data.score,
    updated_at: new Date().toISOString()
  }));

  // Upsert skill levels
  await supabase
    .from('user_skills')
    .upsert(updates, {
      onConflict: 'user_id,skill_name'
    });
}
