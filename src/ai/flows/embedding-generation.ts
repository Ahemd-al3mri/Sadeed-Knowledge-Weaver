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
    // The gemini-embedding-001 model only supports one piece of content per request.
    // We use Promise.all to process all chunks in parallel.
    const embeddingPromises = chunks.map(chunk => 
      embed({
        embedder: 'googleai/gemini-embedding-001',
        content: chunk,
        taskType: 'RETRIEVAL_DOCUMENT',
      })
    );
    
    const embeddings = await Promise.all(embeddingPromises);
    return embeddings;
  }
);
