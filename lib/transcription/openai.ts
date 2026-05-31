import fs from "node:fs";
import OpenAI from "openai";

export async function transcribeWithOpenAI(filePath: string) {
  if (!process.env.OPENAI_API_KEY) {
    return "Audio file saved. Set OPENAI_API_KEY in .env to enable OpenAI transcription.";
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1"
  });
  return result.text;
}
