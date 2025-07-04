'use server';
/**
 * @fileOverview Generates vector embeddings for text chunks.
 *
 * - generateEmbeddings - A function that generates embeddings for a given text chunk.
 * - GenerateEmbeddingsInput - The input type for the generateEmbeddings function.
 * - GenerateEmbeddingsOutput - The return type for the generateEmbeddings function.
 */

import {ai} from '@/ai/genkit';
import {openai} from '@/ai/openai';
import {z} from 'genkit';

const GenerateEmbeddingsInputSchema = z.object({
  chunks: z.array(z.string()).describe('An array of text chunks to be embedded.'),
});
export type GenerateEmbeddingsInput = z.infer<typeof GenerateEmbeddingsInputSchema>;

const GenerateEmbeddingsOutputSchema = z.array(z.array(z.number())).describe('An array of vector embeddings, one for each input chunk.');
export type GenerateEmbeddingsOutput = z.infer<typeof GenerateEmbeddingsOutputSchema>;

export async function generateEmbeddings(input: GenerateEmbeddingsInput): Promise<GenerateEmbeddingsOutput> {
  const { chunks } = input;
  // استخدم OpenAI Embedding API مع تحديد الأبعاد المطلوبة
  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: chunk,
        dimensions: 1024,
      });
      return response.data[0].embedding;
    })
  );
  return responses;
}
