export type ProcessingStatus = 'pending' | 'ocr' | 'identification' | 'chunking' | 'completed' | 'error';

export interface ProcessedDocument {
  id: string;
  file: File;
  status: ProcessingStatus;
  statusMessage: string;
  extractedText?: string;
  identifiedType?: string;
  typeConfidence?: number;
  chunks?: string[];
  metadata: {
    namespace: string;
    documentNumber: string;
    date: string;
    title: string;
  };
}
