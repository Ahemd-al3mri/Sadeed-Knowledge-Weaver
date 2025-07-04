'use server';

/**
 * @fileOverview An intelligent chunking AI agent.
 *
 * - intelligentChunking - A function that handles the intelligent chunking process.
 * - IntelligentChunkingInput - The input type for the intelligentChunking function.
 * - IntelligentChunkingOutput - The return type for the intelligentChunking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentChunkingInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
  documentType: z.string().describe('The type of the legal document (e.g., law, decree, article).'),
});
export type IntelligentChunkingInput = z.infer<typeof IntelligentChunkingInputSchema>;

const IntelligentChunkingOutputSchema = z.array(z.string()).describe('An array of text chunks representing the segmented legal document.');
export type IntelligentChunkingOutput = z.infer<typeof IntelligentChunkingOutputSchema>;

export async function intelligentChunking(input: IntelligentChunkingInput): Promise<IntelligentChunkingOutput> {
  return intelligentChunkingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentChunkingPrompt',
  input: {schema: IntelligentChunkingInputSchema},
  output: {schema: IntelligentChunkingOutputSchema},
  prompt: `You are an expert in legal document processing.

You will receive a legal document as text, and its identified document type.
Your task is to intelligently chunk the document into meaningful segments based on the document type.
For example, if the document type is "law", you should segment it into articles, sections, and clauses.
If the document type is "decree", you might segment it based on the decree's structure.

Document Type: {{{documentType}}}
Document Text:
{{{documentText}}}

Please provide the chunks as a JSON array of strings.
`,    
});

const intelligentChunkingFlow = ai.defineFlow(
  {
    name: 'intelligentChunkingFlow',
    inputSchema: IntelligentChunkingInputSchema,
    outputSchema: IntelligentChunkingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
