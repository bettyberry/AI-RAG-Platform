import OpenAI from "openai";
import { getContext } from "../../../lib/context";
import { buildPrompt } from "../../../lib/rag";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const context = await getContext(lastMessage);

    const fullPrompt = buildPrompt(context, lastMessage);

    // 3. Create the completion with streaming enabled
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true, // This is critical
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: fullPrompt }
      ],
    });

    // 4. Convert the SPECIFIC response to a stream (Correct usage)
    const stream = response.toReadableStream();

    return new Response(stream);
  } catch (error) {
    console.error("Chat Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}