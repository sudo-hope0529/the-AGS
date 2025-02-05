import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '@/lib/supabase';

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(request: Request) {
  try {
    const { userId, technologies, difficulty, timeFrame } = await request.json();

    // Get user's skill levels and preferences
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    // Create a detailed prompt for project generation
    const prompt = `
      Generate a detailed coding project with the following requirements:
      Technologies: ${technologies.join(', ')}
      Difficulty Level: ${difficulty}/10
      Time Frame: ${timeFrame}
      User's Current Skills: ${JSON.stringify(userSkills)}

      Please provide a JSON response with the following structure:
      {
        "title": "Project Title",
        "description": "Detailed project description",
        "difficulty": number,
        "technologies": ["tech1", "tech2"],
        "timeEstimate": "estimated time",
        "learningObjectives": ["objective1", "objective2"],
        "codeTemplate": "Starting code template",
        "resources": [{"title": "Resource Title", "url": "URL"}]
      }
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a professional software developer and educator." },
        { role: "user", content: prompt }
      ],
    });

    const projectData = JSON.parse(completion.data.choices[0].message?.content || "{}");

    // Store the generated project
    await supabase
      .from('generated_projects')
      .insert([{
        user_id: userId,
        project_data: projectData,
        technologies,
        difficulty,
        time_frame: timeFrame,
        created_at: new Date().toISOString()
      }]);

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Error generating project:', error);
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    );
  }
}
