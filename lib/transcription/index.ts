import { transcribeWithOpenAI } from "./openai";

export interface TranscriptionProvider {
  transcribe(filePath: string): Promise<string>;
}

export const transcriptionProvider: TranscriptionProvider = {
  transcribe: transcribeWithOpenAI
};
