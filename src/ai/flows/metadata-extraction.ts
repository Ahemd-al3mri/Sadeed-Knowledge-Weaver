'use server';
/**
 * @fileOverview Extracts structured metadata from a legal document text.
 *
 * - extractMetadata - A function that extracts metadata from document text.
 * - ExtractMetadataInput - The input type for the extractMetadata function.
 * - ExtractMetadataOutput - The return type for the extractMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMetadataInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
});
export type ExtractMetadataInput = z.infer<typeof ExtractMetadataInputSchema>;

const ExtractMetadataOutputSchema = z.object({
  title: z.string().optional().describe('The official title of the document.'),
  articleNumber: z.string().optional().describe('The law or article number (e.g., "Law No. 123", "Article 5").'),
  date: z.string().optional().describe('The issuance date of the document in YYYY-MM-DD format.'),
  section: z.string().optional().describe('The section or chapter the document belongs to.'),
  issuedBy: z.string().optional().describe('The entity that issued the document (e.g., "Ministry of Justice").'),
  keywords: z.array(z.string()).optional().describe('A list of relevant keywords for the document.'),
});
export type ExtractMetadataOutput = z.infer<typeof ExtractMetadataOutputSchema>;

export async function extractMetadata(input: ExtractMetadataInput): Promise<ExtractMetadataOutput> {
  return extractMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMetadataPrompt',
  input: {schema: ExtractMetadataInputSchema},
  output: {schema: ExtractMetadataOutputSchema},
  prompt: `You are an expert in analyzing Arabic legal documents. Your task is to extract structured metadata from the provided document text.

Please extract the following information:
- The official title of the document.
- The law or article number (e.g., "Law No. 123", "Article 5").
- The issuance date of the document. If you find a date, format it as YYYY-MM-DD.
- The section or chapter, if applicable.
- The issuing authority or entity.
- A list of 3-5 relevant keywords that summarize the main topics of the document.

Document Text:
{{{documentText}}}

Provide the output in a structured JSON format. If a piece of information is not present, omit the field or leave it as an empty string.
`,
});

const extractMetadataFlow = ai.defineFlow(
  {
    name: 'extractMetadataFlow',
    inputSchema: ExtractMetadataInputSchema,
    outputSchema: ExtractMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
