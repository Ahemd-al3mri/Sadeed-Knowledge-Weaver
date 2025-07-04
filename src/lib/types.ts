export type ProcessingStatus = 'pending' | 'ocr' | 'identification' | 'chunking' | 'embedding' | 'completed' | 'error';

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
    documentNumber: string;
    date: string;
    title: string;
  };
}
