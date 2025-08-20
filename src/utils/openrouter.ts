import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'SShield Dashboard',
    'Content-Type': 'application/json',
  },
});

export async function getLogSummary(logs: string[], userPrompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-20b:free',
      messages: [
        {
          role: 'system',
          content: `You are an expert cybersecurity log analyst and threat hunter. Your task is to analyze logs and system metrics to identify security incidents, suspicious activities, and potential threats. 

When analyzing, consider:
- Login attempts and authentication patterns
- Command execution and system access
- Network connections and data transfers
- System resource usage anomalies
- Correlation between different events
- Potential indicators of compromise

Provide detailed analysis with specific examples from the logs. Be short and sweet`
        },
        {
          role: 'user',
          content: `Here are the current system logs and metrics to analyze:\n\n${logs.join('\n')}\n\nQuestion: ${userPrompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response received from AI');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}