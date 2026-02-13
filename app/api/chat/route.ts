import OpenAI from "openai";
import { getContext } from "../../../lib/context";
import { buildPrompt } from "../../../lib/rag";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;


    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const context = await getContext(lastMessage);
    const fullPrompt = buildPrompt(context, lastMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: fullPrompt }
      ],
    });

    const stream = response.toReadableStream();
    return new Response(stream);
  } catch (error: any) {
    console.error("Chat Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}