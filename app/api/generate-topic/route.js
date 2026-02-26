import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { context } = await req.json();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You generate business meeting topics.',
        },
        {
          role: 'user',
          content: `Generate 5 business networking meeting topic ideas.\nContext: ${context}`,
        },
      ],
    });

    const text = completion.choices[0].message.content;

    return NextResponse.json({ text });
  } catch (error) {
    console.error('AI ERROR:', error);
    return NextResponse.json({ error: 'AI failed' }, { status: 500 });
  }
}
