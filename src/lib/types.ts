export type ProcessingStatus = 'pending' | 'ocr' | 'identification' | 'metadata' | 'chunking' | 'embedding' | 'completed' | 'error';

// Annotation interfaces for Mistral Document AI
export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TextSegment {
  text: string;
  bbox?: BoundingBox;
  confidence?: number;
}

export interface DocumentAnnotation {
  type: 'title' | 'header' | 'paragraph' | 'list' | 'table' | 'figure' | 'signature' | 'date' | 'article' | 'section' | 'clause' | 'decree_number' | 'issuing_authority';
  content: string;
  bbox?: BoundingBox;
  metadata?: Record<string, any>;
  children?: DocumentAnnotation[];
  // Enhanced for quality assurance
  rawText?: string; // النص الأصلي قبل المعالجة
  confidence?: number; // درجة الثقة في الاستخراج
}

export interface LegalStructureAnnotation {
  documentTitle?: TextSegment;
  decreeNumber?: TextSegment;
  issuingAuthority?: TextSegment;
  issueDate?: TextSegment;
  articles?: DocumentAnnotation[];
  sections?: DocumentAnnotation[];
  clauses?: DocumentAnnotation[];
  signatures?: TextSegment[];
  attachments?: DocumentAnnotation[];
}

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
  // Enhanced with annotation data
  annotations?: DocumentAnnotation[];
  legalStructure?: LegalStructureAnnotation;
  boundingBoxes?: BoundingBox[];
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
