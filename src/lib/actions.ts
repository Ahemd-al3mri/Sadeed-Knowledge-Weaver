'use server';

import { ocrProcessing } from '@/ai/flows/ocr-processing';
import { identifyDocumentType } from '@/ai/flows/auto-document-type-identification';
import { intelligentChunking } from '@/ai/flows/intelligent-chunking';
import { generateEmbeddings } from '@/ai/flows/embedding-generation';

export async function runOcr(fileDataUri: string) {
  try {
    const result = await ocrProcessing({ fileDataUri });
    if (!result.extractedText) {
      throw new Error('OCR process returned no text.');
    }
    return result;
  } catch (e) {
    console.error('OCR Processing failed:', e);
    throw new Error('Failed to extract text from the document.');
  }
}

export async function runDocTypeIdentification(documentText: string) {
  try {
    const result = await identifyDocumentType({ documentText });
    if (!result.documentType) {
        throw new Error('Could not identify document type.');
    }
    return result;
  } catch (e) {
    console.error('Document Type Identification failed:', e);
    throw new Error('Failed to identify document type.');
  }
}

export async function runChunking(documentText: string, documentType: string) {
  try {
    const result = await intelligentChunking({ documentText, documentType });
    if (!result || result.length === 0) {
        throw new Error('Chunking process returned no segments.');
    }
    return result;
  } catch (e) {
    console.error('Intelligent Chunking failed:', e);
    throw new Error('Failed to chunk the document.');
  }
}

export async function runEmbedding(chunks: string[]) {
  try {
    const result = await generateEmbeddings({ chunks });
    if (!result || result.length === 0) {
      throw new Error('Embedding process returned no vectors.');
    }
    return result;
  } catch (e) {
    console.error('Embedding Generation failed:', e);
    throw new Error('Failed to generate embeddings for the document.');
  }
}
