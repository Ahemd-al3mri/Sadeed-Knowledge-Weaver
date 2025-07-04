import { createHash } from 'crypto';
import { DocumentClassifier, DocumentType, validateDocumentClassification } from './document-classification';

// Custom error for duplicate documents
export class DuplicateDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateDocumentError';
  }
}

// AI Processing Pipeline that uses the data_instructions for document classification
export class IntelligentDocumentProcessor {
  
  /**
   * Process a document using the appropriate instruction template
   * @param documentContent - Raw document text
   * @param existingHashes - A set of existing content hashes to check for duplicates
   * @param ocrConfidence - OCR confidence score if applicable
   * @returns Processed document with metadata and chunks
   */
  static async processDocument(
    documentContent: string, 
    existingHashes: Set<string>,
    ocrConfidence?: number
  ): Promise<{
    classification: DocumentType;
    confidence: number;
    chunks: DocumentChunk[];
    metadata: DocumentMetadata;
    processingNotes: string[];
    contentHash: string;
  }> {
    
    // Step 1: Clean and hash the content for deduplication
    const cleanedContent = this.cleanContent(documentContent);
    const contentHash = this.generateContentHash(cleanedContent);

    if (existingHashes.has(contentHash)) {
      throw new DuplicateDocumentError(`Document with hash ${contentHash} has already been processed.`);
    }
    
    // Step 2: Classify the document
    const classificationResult = DocumentClassifier.classifyDocument(cleanedContent);
    const validation = validateDocumentClassification(cleanedContent);
    
    // Step 3: Apply type-specific processing rules
    const processor = this.getProcessorForType(classificationResult.type);
    const processedResult = await processor.process(cleanedContent, ocrConfidence);
    
    return {
      classification: classificationResult.type,
      confidence: classificationResult.confidence,
      chunks: processedResult.chunks,
      metadata: processedResult.metadata,
      processingNotes: [
        `Document classified as: ${classificationResult.type}`,
        `Matched patterns: ${classificationResult.matchedPatterns.join(', ')}`,
        `Confidence: ${(classificationResult.confidence * 100).toFixed(1)}%`,
        ...validation.recommendations,
        ...processedResult.notes
      ],
      contentHash // Return the hash so it can be stored
    };
  }

  /**
   * Cleans the content by removing extra whitespace and normalizing line breaks.
   * @param content - The raw string content.
   * @returns Cleaned string.
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with a single space
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to a maximum of two
      .trim(); // Trim leading/trailing whitespace
  }

  /**
   * Generates a SHA-256 hash for the given content.
   * @param content - The string content to hash.
   * @returns A SHA-256 hash string.
   */
  private static generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
  
  private static getProcessorForType(type: DocumentType): DocumentTypeProcessor {
    switch (type) {
      case 'fatwas':
        return new FatwaProcessor();
      case 'laws':
        return new LawProcessor();
      case 'royal_decrees':
        return new RoyalDecreeProcessor();
      case 'judicial_civil':
        return new JudicialCivilProcessor();
      case 'judicial_criminal':
        return new JudicialCriminalProcessor();
      case 'ministerial_decisions':
        return new MinisterialDecisionProcessor();
      case 'regulations':
        return new RegulationProcessor();
      case 'royal_orders':
        return new RoyalOrderProcessor();
      case 'judicial_principles':
        return new JudicialPrincipleProcessor();
      case 'indexes':
        return new IndexProcessor();
      case 'templates':
        return new TemplateProcessor();
      default:
        return new OtherProcessor();
    }
  }
}

// Base interfaces
interface DocumentChunk {
  id: string;
  type: string;
  namespace: string;
  content: string;
  metadata: Record<string, any>;
}

interface DocumentMetadata {
  type: string;
  namespace: string;
  source: string;
  language: string;
  processingDate: string;
  ocrConfidence?: number;
  verified: boolean;
  [key: string]: any;
}

// Base processor class
abstract class DocumentTypeProcessor {
  abstract process(content: string, ocrConfidence?: number): Promise<{
    chunks: DocumentChunk[];
    metadata: DocumentMetadata;
    notes: string[];
  }>;
  
  protected generateChunkId(type: string, index: number): string {
    return `${type}_${Date.now()}_${index}`;
  }
  
  protected extractKeywords(content: string): string[] {
    // Simple keyword extraction - in real implementation, use NLP
    const arabicWords = content.match(/[\u0600-\u06FF]+/g) || [];
    return [...new Set(arabicWords.filter(word => word.length > 2))].slice(0, 10);
  }
}

// Fatwa Processor - following fatwas_instructions.md
class FatwaProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    // Extract fatwa components based on fatwas_instructions.md
    const fatwaNumber = this.extractFatwaNumber(content);
    const title = this.extractTitle(content);
    const question = this.extractQuestion(content);
    const answer = this.extractAnswer(content);
    const legalBasis = this.extractLegalBasis(content);
    const date = this.extractDate(content);
    
    // Create single chunk per fatwa (as per instructions)
    const chunk: DocumentChunk = {
      id: this.generateChunkId('fatwa', 0),
      type: 'fatwas',
      namespace: 'fatwas',
      content: this.formatFatwaContent(question, answer, legalBasis),
      metadata: {
        fatwa_number: fatwaNumber,
        title: title,
        date: date,
        issued_by: 'وزارة العدل والشؤون القانونية',
        question: question,
        answer: answer,
        legal_basis: legalBasis,
        keywords: this.extractKeywords(content),
        source: 'كتاب المبادئ القانونية – وزارة العدل والشؤون القانونية',
        language: 'ar',
        ocr_confidence: ocrConfidence || 0.95,
        verified: (ocrConfidence || 0.95) > 0.9,
        attachments: []
      }
    };
    
    chunks.push(chunk);
    notes.push('Processed as single fatwa chunk with Q&A structure');
    
    const metadata: DocumentMetadata = {
      type: 'fatwas',
      namespace: 'fatwas',
      source: 'وزارة العدل والشؤون القانونية',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      totalFatwas: 1
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractFatwaNumber(content: string): string {
    const match = content.match(/(\d+\/\d+)/);
    return match ? match[1] : '';
  }
  
  private extractTitle(content: string): string {
    // Extract title after fatwa number or from context
    const lines = content.split('\n').filter(line => line.trim());
    return lines.find(line => line.includes('الإجازة') || line.includes('الشهادة')) || '';
  }
  
  private extractQuestion(content: string): string {
    const questionStart = content.indexOf('ما مدى') || content.indexOf('هل يجوز') || content.indexOf('السؤال');
    if (questionStart === -1) return '';
    
    const questionEnd = content.indexOf('الجواب') || content.indexOf('لا يجوز') || content.indexOf('يجوز');
    return questionStart !== -1 && questionEnd !== -1 ? 
      content.substring(questionStart, questionEnd).trim() : '';
  }
  
  private extractAnswer(content: string): string {
    const answerStart = content.indexOf('لا يجوز') || content.indexOf('يجوز') || content.indexOf('الجواب');
    if (answerStart === -1) return '';
    
    const nextSection = content.indexOf('المادة') || content.indexOf('القانون');
    return answerStart !== -1 ? 
      content.substring(answerStart, nextSection !== -1 ? nextSection : undefined).trim() : '';
  }
  
  private extractLegalBasis(content: string): string[] {
    const basis: string[] = [];
    const matches = content.match(/المادة \d+|اللائحة التنفيذية|قانون \w+/g);
    return matches || [];
  }
  
  private extractDate(content: string): string {
    const dateMatch = content.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
    return dateMatch ? dateMatch[0] : '';
  }
  
  private formatFatwaContent(question: string, answer: string, legalBasis: string[]): string {
    return `السؤال: ${question}\n\nالجواب: ${answer}\n\nالأساس القانوني: ${legalBasis.join(', ')}`;
  }
}

// Law Processor - following laws_instructions.md
class LawProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const lawTitle = this.extractLawTitle(content);
    const lawReference = this.extractLawReference(content);
    const articles = this.extractArticles(content);
    
    // Each article = separate chunk (as per instructions)
    articles.forEach((article, index) => {
      const chunk: DocumentChunk = {
        id: this.generateChunkId('law_article', index),
        type: 'laws',
        namespace: 'laws',
        content: article.text,
        metadata: {
          law_title: lawTitle,
          law_reference: lawReference,
          article_number: article.number,
          section: article.section,
          date: this.extractDate(content),
          source: 'سلطان عمان – الجريدة الرسمية',
          keywords: this.extractKeywords(article.text),
          language: 'ar',
          ocr_confidence: ocrConfidence
        }
      };
      chunks.push(chunk);
    });
    
    notes.push(`Processed ${articles.length} law articles as separate chunks`);
    
    const metadata: DocumentMetadata = {
      type: 'laws',
      namespace: 'laws',
      source: 'الجريدة الرسمية',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      totalArticles: articles.length,
      lawTitle,
      lawReference
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractLawTitle(content: string): string {
    const match = content.match(/قانون\s+([^\n]+)/);
    return match ? match[1].trim() : '';
  }
  
  private extractLawReference(content: string): string {
    const match = content.match(/مرسوم سلطاني رقم\s+(\d+\/\d+)/);
    return match ? `مرسوم سلطاني رقم ${match[1]}` : '';
  }
  
  private extractArticles(content: string): Array<{number: string, text: string, section: string}> {
    const articles: Array<{number: string, text: string, section: string}> = [];
    const articleMatches = content.match(/المادة\s+(\d+)[^:]*:([^المادة]*)/g);
    
    articleMatches?.forEach(match => {
      const numberMatch = match.match(/المادة\s+(\d+)/);
      const number = numberMatch ? numberMatch[1] : '';
      const text = match.replace(/المادة\s+\d+[^:]*:/, '').trim();
      const section = this.findSection(content, match);
      
      articles.push({ number, text, section });
    });
    
    return articles;
  }
  
  private findSection(content: string, articleText: string): string {
    const position = content.indexOf(articleText);
    const beforeText = content.substring(0, position);
    const sectionMatch = beforeText.match(/(الباب|الفصل)\s+[^:]+/g);
    return sectionMatch ? sectionMatch[sectionMatch.length - 1] : '';
  }
  
  private extractDate(content: string): string {
    const dateMatch = content.match(/\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : '';
  }
}

// Placeholder processors for other types
class RoyalDecreeProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    // Implementation following royal_decrees_instructions.md
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Royal decree processing not yet implemented'] };
  }
}

class JudicialCivilProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    // Implementation following judicial_civil_instructions.md
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Judicial civil processing not yet implemented'] };
  }
}

class JudicialCriminalProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Judicial criminal processing not yet implemented'] };
  }
}

class MinisterialDecisionProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Ministerial decision processing not yet implemented'] };
  }
}

class RegulationProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Regulation processing not yet implemented'] };
  }
}

class RoyalOrderProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Royal order processing not yet implemented'] };
  }
}

class JudicialPrincipleProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Judicial principle processing not yet implemented'] };
  }
}

class IndexProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Index processing not yet implemented'] };
  }
}

class TemplateProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    return { chunks: [], metadata: {} as DocumentMetadata, notes: ['Template processing not yet implemented'] };
  }
}

class OtherProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [{
      id: this.generateChunkId('other', 0),
      type: 'others',
      namespace: 'others',
      content: content,
      metadata: {
        keywords: this.extractKeywords(content),
        language: 'ar',
        ocr_confidence: ocrConfidence
      }
    }];
    
    const metadata: DocumentMetadata = {
      type: 'others',
      namespace: 'others',
      source: 'Unknown',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: false
    };
    
    return { chunks, metadata, notes: ['Processed as generic document due to unclear classification'] };
  }
}
