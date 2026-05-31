import { summarizeWithOpenAI } from "./openai";

export type SummaryResult = {
  oneLine: string;
  detailed: string;
  keyPoints: string[];
  timeline: string[];
  facts: string[];
  investmentValue: string;
  risks: string[];
  followUps: string[];
  markdown: string;
};

export interface SummarizationProvider {
  summarize(input: {
    title?: string | null;
    text: string;
    promptTemplate?: string | null;
  }): Promise<SummaryResult>;
}

export const summarizationProvider: SummarizationProvider = {
  summarize: summarizeWithOpenAI
};
