// src/ai/flows/auto-document-type-identification.ts
'use server';
/**
 * @fileOverview Automatically identifies the type of legal document uploaded by the user.
 *
 * - identifyDocumentType - A function that identifies the document type.
 * - IdentifyDocumentTypeInput - The input type for the identifyDocumentType function.
 * - IdentifyDocumentTypeOutput - The return type for the identifyDocumentType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyDocumentTypeInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
});
export type IdentifyDocumentTypeInput = z.infer<typeof IdentifyDocumentTypeInputSchema>;

const IdentifyDocumentTypeOutputSchema = z.object({
  documentType: z.string().describe('The identified type of the legal document (e.g., law, decree).'),
  confidence: z.number().describe('A confidence score (0-1) indicating the certainty of the document type identification.'),
});
export type IdentifyDocumentTypeOutput = z.infer<typeof IdentifyDocumentTypeOutputSchema>;

export async function identifyDocumentType(input: IdentifyDocumentTypeInput): Promise<IdentifyDocumentTypeOutput> {
  return identifyDocumentTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyDocumentTypePrompt',
  input: {schema: IdentifyDocumentTypeInputSchema},
  output: {schema: IdentifyDocumentTypeOutputSchema},
  prompt: `You are an expert in legal document classification. Given the text content of a legal document, identify its type (e.g., law, decree, regulation, judgment, contract). Also, provide a confidence score between 0 and 1 (0 being least confident, 1 being most confident) for your identification.

Document Text: {{{documentText}}}

Format your response as a JSON object conforming to the schema:
\n{{outputSchema}}`,
});

const identifyDocumentTypeFlow = ai.defineFlow(
  {
    name: 'identifyDocumentTypeFlow',
    inputSchema: IdentifyDocumentTypeInputSchema,
    outputSchema: IdentifyDocumentTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
