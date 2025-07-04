export type ProcessingStatus = 'pending' | 'ocr' | 'identification' | 'metadata' | 'chunking' | 'embedding' | 'completed' | 'error';

export interface ProcessedDocument {
  id: string;
  file: File;
  status: ProcessingStatus;
  statusMessage: string;
  extractedText?: string;
  identifiedType?: string;
  typeConfidence?: number;
  chunks?: string[];
  embeddings?: number[][];
  metadata: {
    namespace: string;
    articleNumber: string;
    date: string;
    title: string;
    section: string;
    issuedBy: string;
    keywords: string[];
  };
}
