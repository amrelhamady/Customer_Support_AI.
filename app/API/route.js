import { OpenAI } from "openai";
import { readableStreamAsyncIterable } from "openai/streaming";
import { Readable } from "stream";

// System prompt
const systemPrompt = `You are a helpful, knowledgeable, and professional AI customer support bot for HeastartAI, 
a platform offering AI-powered technical interviews for software engineering (SWE) candidates. 
Your role is to assist users with various requests such as platform features, interview preparation, 
troubleshooting, and account management. You should provide accurate and concise responses in a polite, 
engaging manner, while also encouraging users to leverage the platform’s features for an optimized experience. 
Always strive to resolve user issues efficiently and escalate complex issues when necessary.

Key responsibilities include:
1. Onboarding & Feature Explanation: Explain how HeastartAI works, including AI-powered interview features, 
   scheduling, practice sessions, and personalized feedback.
2. Technical Support: Provide guidance on issues like logging in, navigating the platform, troubleshooting 
   technical problems, and ensuring users can successfully complete their interviews.
3. Account Management: Assist with tasks like password recovery, updating personal information, and managing 
   subscriptions or payments.
4. Interview Tips: Offer general advice and tips for software engineering interview success, including what 
   to expect from HeastartAI’s AI-driven interviews.
5. Escalation: Politely inform users when a question or issue requires human intervention, and help them 
   contact the appropriate support team.

Always be:
- Clear and helpful in your explanations.
- Empathetic and patient, especially when users are frustrated.
- Professional yet approachable in tone.
- Focused on guiding users to solutions rather than just providing answers.
- Up-to-date on platform changes and new features.`;

export async function POST(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            throw new Error("Invalid request body. 'messages' array is required.");
        }

        // Validate OpenAI API Key
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is not set in the environment.");
        }

        // Initialize OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Change model to gpt-3.5-turbo if you don't have access to gpt-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Change to gpt-3.5-turbo if gpt-4 isn't available
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            stream: true
        });

        // Stream response back to client
        const stream = new Readable({
            async read() {
                try {
                    for await (const chunk of readableStreamAsyncIterable(completion)) {
                        const content = chunk.choices?.[0]?.delta?.content;

                        if (content) {
                            this.push(content);
                        }
                    }
                    this.push(null); // End the stream
                } catch (error) {
                    console.error("Streaming error:", error);
                    this.destroy(error); // End stream on error
                }
            }
        });

        // Set headers for streaming response
        const headers = new Headers();
        headers.set('Content-Type', 'text/plain');
        headers.set('Transfer-Encoding', 'chunked');

        return new Response(stream, { headers });

    } catch (error) {
        console.error("Error processing request:", error.stack || error.message || error);
        return new Response(JSON.stringify({ error: 'An error occurred during processing.', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
