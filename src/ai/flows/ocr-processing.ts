'use server';

/**
 * @fileOverview Performs OCR on a given image or PDF document.
 *
 * - ocrProcessing - A function that handles the OCR process.
 * - OcrProcessingInput - The input type for the ocrProcessing function.
 * - OcrProcessingOutput - The return type for the ocrProcessing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OcrProcessingInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The document (image or PDF) to be OCR'd, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OcrProcessingInput = z.infer<typeof OcrProcessingInputSchema>;

const OcrProcessingOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text content from the OCR process.'),
});
export type OcrProcessingOutput = z.infer<typeof OcrProcessingOutputSchema>;

export async function ocrProcessing(input: OcrProcessingInput): Promise<OcrProcessingOutput> {
  return ocrProcessingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ocrProcessingPrompt',
  input: {schema: OcrProcessingInputSchema},
  output: {schema: OcrProcessingOutputSchema},
  prompt: `You are an expert OCR processor. Extract the text from the following document:

Document: {{media url=fileDataUri}}

Extracted Text:`,
});

const ocrProcessingFlow = ai.defineFlow(
  {
    name: 'ocrProcessingFlow',
    inputSchema: OcrProcessingInputSchema,
    outputSchema: OcrProcessingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
