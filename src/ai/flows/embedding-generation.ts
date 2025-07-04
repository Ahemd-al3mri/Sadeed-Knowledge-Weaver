'use server';
/**
 * @fileOverview Generates vector embeddings for text chunks.
 *
 * - generateEmbeddings - A function that generates embeddings for a given text chunk.
 * - GenerateEmbeddingsInput - The input type for the generateEmbeddings function.
 * - GenerateEmbeddingsOutput - The return type for the generateEmbeddings function.
 */

import {ai} from '@/ai/genkit';
import {embed, z} from 'genkit';

const GenerateEmbeddingsInputSchema = z.object({
  chunks: z.array(z.string()).describe('An array of text chunks to be embedded.'),
});
export type GenerateEmbeddingsInput = z.infer<typeof GenerateEmbeddingsInputSchema>;

const GenerateEmbeddingsOutputSchema = z.array(z.array(z.number())).describe('An array of vector embeddings, one for each input chunk.');
export type GenerateEmbeddingsOutput = z.infer<typeof GenerateEmbeddingsOutputSchema>;

export async function generateEmbeddings(input: GenerateEmbeddingsInput): Promise<GenerateEmbeddingsOutput> {
  return generateEmbeddingsFlow(input);
}

const generateEmbeddingsFlow = ai.defineFlow(
  {
    name: 'generateEmbeddingsFlow',
    inputSchema: GenerateEmbeddingsInputSchema,
    outputSchema: GenerateEmbeddingsOutputSchema,
  },
  async ({ chunks }) => {
    const embeddings = await embed({
      embedder: 'googleai/text-embedding-004',
      content: chunks,
    });
    
    return embeddings;
  }
);
