'use server';

/**
 * @fileOverview Performs OCR on a given image or PDF document using Mistral OCR API.
 *
 * - ocrProcessing - A function that handles the OCR process.
 * - OcrProcessingInput - The input type for the ocrProcessing function.
 * - OcrProcessingOutput - The return type for the ocrProcessing function.
 */

import {Mistral} from '@mistralai/mistralai';
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
  const apiKey = process.env.MISTRAL_API_KEY;
  
  // Debug logging
  console.log('=== OCR Processing Debug ===');
  console.log('API Key exists:', !!apiKey);
  console.log('Input data URI length:', input.fileDataUri.length);
  console.log('Input data URI prefix:', input.fileDataUri.substring(0, 50) + '...');
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is required');
  }

  const client = new Mistral({
    apiKey: apiKey,
  });

  try {
    // Determine the document type from the data URI
    const mimeTypeMatch = input.fileDataUri.match(/^data:([^;]+);base64,/);
    if (!mimeTypeMatch) {
      console.error('Invalid data URI format - no MIME type match');
      throw new Error('Invalid data URI format. Expected format: data:<mimetype>;base64,<encoded_data>');
    }

    const mimeType = mimeTypeMatch[1];
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    console.log('Detected MIME type:', mimeType);
    console.log('Is image:', isImage);
    console.log('Is PDF:', isPdf);

    if (!isImage && !isPdf) {
      throw new Error(`Unsupported file type: ${mimeType}. Only images and PDFs are supported.`);
    }

    // Process with Mistral OCR
    console.log('Sending request to Mistral OCR API...');
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: isImage 
        ? {
            type: "image_url" as const,
            imageUrl: input.fileDataUri
          }
        : {
            type: "document_url" as const,
            documentUrl: input.fileDataUri
          },
      includeImageBase64: false
    });

    console.log('OCR Response received');
    console.log('OCR Response keys:', Object.keys(ocrResponse));
    console.log('OCR Response:', JSON.stringify(ocrResponse, null, 2));

    // Extract the text content from the response
    let extractedText = '';
    
    console.log('OCR Response received');
    console.log('OCR Response keys:', Object.keys(ocrResponse));
    console.log('OCR Response pages length:', ocrResponse.pages?.length || 0);
    
    // Extract text from pages array
    if (ocrResponse.pages && Array.isArray(ocrResponse.pages) && ocrResponse.pages.length > 0) {
      extractedText = ocrResponse.pages
        .map((page: any) => page.markdown || page.text || '')
        .join('\n\n')
        .trim();
      console.log('Found text in response.pages');
    } else {
      console.log('No pages found in response');
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 100) + '...');
    console.log('=== End OCR Debug ===');

    return {
      extractedText: extractedText || 'No text could be extracted from the document.'
    };

  } catch (error) {
    console.error('OCR processing error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
