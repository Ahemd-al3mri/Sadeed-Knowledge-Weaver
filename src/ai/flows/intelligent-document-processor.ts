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
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const decreeNumber = this.extractDecreeNumber(content);
    const decreeTitle = this.extractDecreeTitle(content);
    const issuingAuthority = this.extractIssuingAuthority(content);
    const issueDate = this.extractDate(content);
    const articles = this.extractArticles(content);
    
    if (articles.length > 0) {
      // Create separate chunks for each article
      articles.forEach((article, index) => {
        const chunk: DocumentChunk = {
          id: this.generateChunkId('royal_decree_article', index),
          type: 'royal_decrees',
          namespace: 'royal_decrees',
          content: article.text,
          metadata: {
            decree_number: decreeNumber,
            decree_title: decreeTitle,
            article_number: article.number,
            issuing_authority: issuingAuthority,
            issue_date: issueDate,
            keywords: this.extractKeywords(article.text),
            language: 'ar',
            ocr_confidence: ocrConfidence,
            source: 'الجريدة الرسمية - سلطنة عمان'
          }
        };
        chunks.push(chunk);
      });
      notes.push(`Processed ${articles.length} royal decree articles`);
    } else {
      // Create single chunk for entire decree
      const chunk: DocumentChunk = {
        id: this.generateChunkId('royal_decree', 0),
        type: 'royal_decrees',
        namespace: 'royal_decrees',
        content: content,
        metadata: {
          decree_number: decreeNumber,
          decree_title: decreeTitle,
          issuing_authority: issuingAuthority,
          issue_date: issueDate,
          keywords: this.extractKeywords(content),
          language: 'ar',
          ocr_confidence: ocrConfidence,
          source: 'الجريدة الرسمية - سلطنة عمان'
        }
      };
      chunks.push(chunk);
      notes.push('Processed as single royal decree chunk');
    }
    
    const metadata: DocumentMetadata = {
      type: 'royal_decrees',
      namespace: 'royal_decrees',
      source: 'الجريدة الرسمية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      decreeNumber,
      decreeTitle,
      issuingAuthority,
      issueDate
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractDecreeNumber(content: string): string {
    const match = content.match(/مرسوم سلطاني رقم\s+(\d+\/\d+)/i);
    return match ? match[1] : '';
  }
  
  private extractDecreeTitle(content: string): string {
    const match = content.match(/مرسوم سلطاني[^:]*:([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractIssuingAuthority(content: string): string {
    return 'جلالة السلطان';
  }
  
  private extractArticles(content: string): Array<{number: string, text: string}> {
    const articles: Array<{number: string, text: string}> = [];
    const articleMatches = content.match(/المادة\s+(\d+)[^:]*:([^المادة]*)/g);
    
    articleMatches?.forEach(match => {
      const numberMatch = match.match(/المادة\s+(\d+)/);
      const number = numberMatch ? numberMatch[1] : '';
      const text = match.replace(/المادة\s+\d+[^:]*:/, '').trim();
      articles.push({ number, text });
    });
    
    return articles;
  }
  
  private extractDate(content: string): string {
    const dateMatch = content.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
    return dateMatch ? dateMatch[0] : '';
  }
}

class JudicialCivilProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const caseNumber = this.extractCaseNumber(content);
    const caseTitle = this.extractCaseTitle(content);
    const court = this.extractCourt(content);
    const judgmentDate = this.extractJudgmentDate(content);
    const parties = this.extractParties(content);
    const legalPrinciple = this.extractLegalPrinciple(content);
    
    // Create chunk for the judicial ruling
    const chunk: DocumentChunk = {
      id: this.generateChunkId('judicial_civil', 0),
      type: 'judicial_civil',
      namespace: 'judicial_civil',
      content: content,
      metadata: {
        case_number: caseNumber,
        case_title: caseTitle,
        court: court,
        judgment_date: judgmentDate,
        parties: parties,
        legal_principle: legalPrinciple,
        keywords: this.extractKeywords(content),
        language: 'ar',
        ocr_confidence: ocrConfidence,
        source: 'المحاكم المدنية - سلطنة عمان'
      }
    };
    
    chunks.push(chunk);
    notes.push('Processed civil judicial case');
    
    const metadata: DocumentMetadata = {
      type: 'judicial_civil',
      namespace: 'judicial_civil',
      source: 'المحاكم المدنية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      caseNumber,
      court,
      judgmentDate
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractCaseNumber(content: string): string {
    const match = content.match(/دعوى رقم\s+(\d+\/\d+)|القضية رقم\s+(\d+\/\d+)/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractCaseTitle(content: string): string {
    const match = content.match(/في الدعوى\s+([^،]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractCourt(content: string): string {
    const match = content.match(/المحكمة\s+([^،]+)/i);
    return match ? match[1].trim() : 'المحكمة المدنية';
  }
  
  private extractJudgmentDate(content: string): string {
    const match = content.match(/بتاريخ\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? match[1] : '';
  }
  
  private extractParties(content: string): string[] {
    const parties: string[] = [];
    const plaintiffMatch = content.match(/المدعي[:\s]+([^،\n]+)/i);
    const defendantMatch = content.match(/المدعى عليه[:\s]+([^،\n]+)/i);
    
    if (plaintiffMatch) parties.push(`المدعي: ${plaintiffMatch[1].trim()}`);
    if (defendantMatch) parties.push(`المدعى عليه: ${defendantMatch[1].trim()}`);
    
    return parties;
  }
  
  private extractLegalPrinciple(content: string): string {
    const match = content.match(/المبدأ القانوني[:\s]+([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
}

class JudicialCriminalProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const caseNumber = this.extractCaseNumber(content);
    const crime = this.extractCrime(content);
    const court = this.extractCourt(content);
    const judgmentDate = this.extractJudgmentDate(content);
    const accused = this.extractAccused(content);
    const verdict = this.extractVerdict(content);
    const legalBasis = this.extractLegalBasis(content);
    
    // Create chunk for the criminal ruling
    const chunk: DocumentChunk = {
      id: this.generateChunkId('judicial_criminal', 0),
      type: 'judicial_criminal',
      namespace: 'judicial_criminal',
      content: content,
      metadata: {
        case_number: caseNumber,
        crime: crime,
        court: court,
        judgment_date: judgmentDate,
        accused: accused,
        verdict: verdict,
        legal_basis: legalBasis,
        keywords: this.extractKeywords(content),
        language: 'ar',
        ocr_confidence: ocrConfidence,
        source: 'المحاكم الجنائية - سلطنة عمان'
      }
    };
    
    chunks.push(chunk);
    notes.push('Processed criminal judicial case');
    
    const metadata: DocumentMetadata = {
      type: 'judicial_criminal',
      namespace: 'judicial_criminal',
      source: 'المحاكم الجنائية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      caseNumber,
      court,
      judgmentDate,
      crime
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractCaseNumber(content: string): string {
    const match = content.match(/القضية الجنائية رقم\s+(\d+\/\d+)|الدعوى الجنائية رقم\s+(\d+\/\d+)/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractCrime(content: string): string {
    const match = content.match(/جريمة\s+([^،\n]+)|التهمة\s+([^،\n]+)/i);
    return match ? (match[1] || match[2]).trim() : '';
  }
  
  private extractCourt(content: string): string {
    const match = content.match(/المحكمة\s+([^،]+)/i);
    return match ? match[1].trim() : 'المحكمة الجنائية';
  }
  
  private extractJudgmentDate(content: string): string {
    const match = content.match(/بتاريخ\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? match[1] : '';
  }
  
  private extractAccused(content: string): string {
    const match = content.match(/المتهم[:\s]+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractVerdict(content: string): string {
    const match = content.match(/الحكم[:\s]+([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractLegalBasis(content: string): string[] {
    const matches = content.match(/المادة\s+\d+|القانون رقم\s+\d+\/\d+/g);
    return matches || [];
  }
}

class MinisterialDecisionProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const decisionNumber = this.extractDecisionNumber(content);
    const decisionTitle = this.extractDecisionTitle(content);
    const ministry = this.extractMinistry(content);
    const issueDate = this.extractIssueDate(content);
    const legalBasis = this.extractLegalBasis(content);
    const articles = this.extractArticles(content);
    
    if (articles.length > 0) {
      // Create separate chunks for each article
      articles.forEach((article, index) => {
        const chunk: DocumentChunk = {
          id: this.generateChunkId('ministerial_article', index),
          type: 'ministerial_decisions',
          namespace: 'ministerial_decisions',
          content: article.text,
          metadata: {
            decision_number: decisionNumber,
            decision_title: decisionTitle,
            ministry: ministry,
            issue_date: issueDate,
            article_number: article.number,
            legal_basis: legalBasis,
            keywords: this.extractKeywords(article.text),
            language: 'ar',
            ocr_confidence: ocrConfidence,
            source: 'القرارات الوزارية - سلطنة عمان'
          }
        };
        chunks.push(chunk);
      });
      notes.push(`Processed ${articles.length} ministerial decision articles`);
    } else {
      // Create single chunk for entire decision
      const chunk: DocumentChunk = {
        id: this.generateChunkId('ministerial_decision', 0),
        type: 'ministerial_decisions',
        namespace: 'ministerial_decisions',
        content: content,
        metadata: {
          decision_number: decisionNumber,
          decision_title: decisionTitle,
          ministry: ministry,
          issue_date: issueDate,
          legal_basis: legalBasis,
          keywords: this.extractKeywords(content),
          language: 'ar',
          ocr_confidence: ocrConfidence,
          source: 'القرارات الوزارية - سلطنة عمان'
        }
      };
      chunks.push(chunk);
      notes.push('Processed as single ministerial decision chunk');
    }
    
    const metadata: DocumentMetadata = {
      type: 'ministerial_decisions',
      namespace: 'ministerial_decisions',
      source: 'القرارات الوزارية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      decisionNumber,
      ministry,
      issueDate
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractDecisionNumber(content: string): string {
    const match = content.match(/قرار وزاري رقم\s+(\d+\/\d+)|قرار رقم\s+(\d+\/\d+)/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractDecisionTitle(content: string): string {
    const match = content.match(/قرار[^:]*:([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractMinistry(content: string): string {
    const match = content.match(/وزارة\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractIssueDate(content: string): string {
    const match = content.match(/صدر في\s+(\d{1,2}\/\d{1,2}\/\d{4})|بتاريخ\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractLegalBasis(content: string): string[] {
    const matches = content.match(/المادة\s+\d+|القانون رقم\s+\d+\/\d+|اللائحة التنفيذية/g);
    return matches || [];
  }
  
  private extractArticles(content: string): Array<{number: string, text: string}> {
    const articles: Array<{number: string, text: string}> = [];
    const articleMatches = content.match(/المادة\s+(\d+)[^:]*:([^المادة]*)/g);
    
    articleMatches?.forEach(match => {
      const numberMatch = match.match(/المادة\s+(\d+)/);
      const number = numberMatch ? numberMatch[1] : '';
      const text = match.replace(/المادة\s+\d+[^:]*:/, '').trim();
      articles.push({ number, text });
    });
    
    return articles;
  }
}

class RegulationProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const regulationTitle = this.extractRegulationTitle(content);
    const regulationNumber = this.extractRegulationNumber(content);
    const issuingAuthority = this.extractIssuingAuthority(content);
    const issueDate = this.extractIssueDate(content);
    const articles = this.extractArticles(content);
    
    if (articles.length > 0) {
      // Create separate chunks for each article
      articles.forEach((article, index) => {
        const chunk: DocumentChunk = {
          id: this.generateChunkId('regulation_article', index),
          type: 'regulations',
          namespace: 'regulations',
          content: article.text,
          metadata: {
            regulation_title: regulationTitle,
            regulation_number: regulationNumber,
            issuing_authority: issuingAuthority,
            issue_date: issueDate,
            article_number: article.number,
            section: article.section,
            keywords: this.extractKeywords(article.text),
            language: 'ar',
            ocr_confidence: ocrConfidence,
            source: 'اللوائح التنفيذية - سلطنة عمان'
          }
        };
        chunks.push(chunk);
      });
      notes.push(`Processed ${articles.length} regulation articles`);
    } else {
      // Create single chunk for entire regulation
      const chunk: DocumentChunk = {
        id: this.generateChunkId('regulation', 0),
        type: 'regulations',
        namespace: 'regulations',
        content: content,
        metadata: {
          regulation_title: regulationTitle,
          regulation_number: regulationNumber,
          issuing_authority: issuingAuthority,
          issue_date: issueDate,
          keywords: this.extractKeywords(content),
          language: 'ar',
          ocr_confidence: ocrConfidence,
          source: 'اللوائح التنفيذية - سلطنة عمان'
        }
      };
      chunks.push(chunk);
      notes.push('Processed as single regulation chunk');
    }
    
    const metadata: DocumentMetadata = {
      type: 'regulations',
      namespace: 'regulations',
      source: 'اللوائح التنفيذية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      regulationTitle,
      regulationNumber,
      issuingAuthority
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractRegulationTitle(content: string): string {
    const match = content.match(/لائحة\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractRegulationNumber(content: string): string {
    const match = content.match(/لائحة رقم\s+(\d+\/\d+)/i);
    return match ? match[1] : '';
  }
  
  private extractIssuingAuthority(content: string): string {
    const match = content.match(/صادرة عن\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractIssueDate(content: string): string {
    const match = content.match(/صدرت في\s+(\d{1,2}\/\d{1,2}\/\d{4})|بتاريخ\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? (match[1] || match[2]) : '';
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
}

class RoyalOrderProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const orderNumber = this.extractOrderNumber(content);
    const orderTitle = this.extractOrderTitle(content);
    const recipientAuthority = this.extractRecipientAuthority(content);
    const issueDate = this.extractIssueDate(content);
    const orderContent = this.extractOrderContent(content);
    
    // Create chunk for the royal order
    const chunk: DocumentChunk = {
      id: this.generateChunkId('royal_order', 0),
      type: 'royal_orders',
      namespace: 'royal_orders',
      content: orderContent || content,
      metadata: {
        order_number: orderNumber,
        order_title: orderTitle,
        recipient_authority: recipientAuthority,
        issue_date: issueDate,
        keywords: this.extractKeywords(content),
        language: 'ar',
        ocr_confidence: ocrConfidence,
        source: 'الأوامر السلطانية - سلطنة عمان'
      }
    };
    
    chunks.push(chunk);
    notes.push('Processed royal order');
    
    const metadata: DocumentMetadata = {
      type: 'royal_orders',
      namespace: 'royal_orders',
      source: 'الأوامر السلطانية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      orderNumber,
      recipientAuthority,
      issueDate
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractOrderNumber(content: string): string {
    const match = content.match(/أمر سلطاني رقم\s+(\d+\/\d+)/i);
    return match ? match[1] : '';
  }
  
  private extractOrderTitle(content: string): string {
    const match = content.match(/أمر سلطاني[^:]*:([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractRecipientAuthority(content: string): string {
    const match = content.match(/إلى\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractIssueDate(content: string): string {
    const match = content.match(/صدر في\s+(\d{1,2}\/\d{1,2}\/\d{4})|بتاريخ\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractOrderContent(content: string): string {
    const match = content.match(/نأمر بما يلي[:\s]*([^]*)/i);
    return match ? match[1].trim() : '';
  }
}

class JudicialPrincipleProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const principleNumber = this.extractPrincipleNumber(content);
    const principleTitle = this.extractPrincipleTitle(content);
    const court = this.extractCourt(content);
    const caseNumbers = this.extractCaseNumbers(content);
    const legalPrinciple = this.extractLegalPrinciple(content);
    const legalBasis = this.extractLegalBasis(content);
    
    // Create chunk for the judicial principle
    const chunk: DocumentChunk = {
      id: this.generateChunkId('judicial_principle', 0),
      type: 'judicial_principles',
      namespace: 'judicial_principles',
      content: legalPrinciple || content,
      metadata: {
        principle_number: principleNumber,
        principle_title: principleTitle,
        court: court,
        case_numbers: caseNumbers,
        legal_principle: legalPrinciple,
        legal_basis: legalBasis,
        keywords: this.extractKeywords(content),
        language: 'ar',
        ocr_confidence: ocrConfidence,
        source: 'المبادئ القضائية - سلطنة عمان'
      }
    };
    
    chunks.push(chunk);
    notes.push('Processed judicial principle');
    
    const metadata: DocumentMetadata = {
      type: 'judicial_principles',
      namespace: 'judicial_principles',
      source: 'المبادئ القضائية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      principleNumber,
      court,
      caseNumbers
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractPrincipleNumber(content: string): string {
    const match = content.match(/مبدأ رقم\s+(\d+)|المبدأ رقم\s+(\d+)/i);
    return match ? (match[1] || match[2]) : '';
  }
  
  private extractPrincipleTitle(content: string): string {
    const match = content.match(/مبدأ[^:]*:([^\.]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractCourt(content: string): string {
    const match = content.match(/المحكمة العليا|محكمة الاستئناف|المحكمة الابتدائية/i);
    return match ? match[0] : 'المحكمة العليا';
  }
  
  private extractCaseNumbers(content: string): string[] {
    const matches = content.match(/القضية رقم\s+(\d+\/\d+)/g);
    return matches ? matches.map(m => m.replace(/القضية رقم\s+/, '')) : [];
  }
  
  private extractLegalPrinciple(content: string): string {
    const match = content.match(/المبدأ[:\s]+([^]*?)(?=الأساس القانوني|$)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractLegalBasis(content: string): string[] {
    const matches = content.match(/المادة\s+\d+|القانون رقم\s+\d+\/\d+/g);
    return matches || [];
  }
}

class IndexProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const indexTitle = this.extractIndexTitle(content);
    const indexEntries = this.extractIndexEntries(content);
    
    if (indexEntries.length > 0) {
      // Create separate chunks for each index entry
      indexEntries.forEach((entry, index) => {
        const chunk: DocumentChunk = {
          id: this.generateChunkId('index_entry', index),
          type: 'indexes',
          namespace: 'indexes',
          content: entry.content,
          metadata: {
            index_title: indexTitle,
            entry_title: entry.title,
            page_reference: entry.pageRef,
            keywords: this.extractKeywords(entry.content),
            language: 'ar',
            ocr_confidence: ocrConfidence,
            source: 'فهارس قانونية - سلطنة عمان'
          }
        };
        chunks.push(chunk);
      });
      notes.push(`Processed ${indexEntries.length} index entries`);
    } else {
      // Create single chunk for entire index
      const chunk: DocumentChunk = {
        id: this.generateChunkId('index', 0),
        type: 'indexes',
        namespace: 'indexes',
        content: content,
        metadata: {
          index_title: indexTitle,
          keywords: this.extractKeywords(content),
          language: 'ar',
          ocr_confidence: ocrConfidence,
          source: 'فهارس قانونية - سلطنة عمان'
        }
      };
      chunks.push(chunk);
      notes.push('Processed as single index chunk');
    }
    
    const metadata: DocumentMetadata = {
      type: 'indexes',
      namespace: 'indexes',
      source: 'فهارس قانونية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      indexTitle,
      totalEntries: indexEntries.length
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractIndexTitle(content: string): string {
    const match = content.match(/فهرس\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractIndexEntries(content: string): Array<{title: string, content: string, pageRef: string}> {
    const entries: Array<{title: string, content: string, pageRef: string}> = [];
    const entryMatches = content.match(/([^،\n]+)\s+\.{2,}\s*(\d+)/g);
    
    entryMatches?.forEach(match => {
      const parts = match.split(/\.{2,}/);
      if (parts.length === 2) {
        const title = parts[0].trim();
        const pageRef = parts[1].trim();
        entries.push({ title, content: title, pageRef });
      }
    });
    
    return entries;
  }
}

class TemplateProcessor extends DocumentTypeProcessor {
  async process(content: string, ocrConfidence?: number) {
    const chunks: DocumentChunk[] = [];
    const notes: string[] = [];
    
    const templateTitle = this.extractTemplateTitle(content);
    const templateType = this.extractTemplateType(content);
    const sections = this.extractSections(content);
    
    if (sections.length > 0) {
      // Create separate chunks for each template section
      sections.forEach((section, index) => {
        const chunk: DocumentChunk = {
          id: this.generateChunkId('template_section', index),
          type: 'templates',
          namespace: 'templates',
          content: section.content,
          metadata: {
            template_title: templateTitle,
            template_type: templateType,
            section_title: section.title,
            keywords: this.extractKeywords(section.content),
            language: 'ar',
            ocr_confidence: ocrConfidence,
            source: 'نماذج قانونية - سلطنة عمان'
          }
        };
        chunks.push(chunk);
      });
      notes.push(`Processed ${sections.length} template sections`);
    } else {
      // Create single chunk for entire template
      const chunk: DocumentChunk = {
        id: this.generateChunkId('template', 0),
        type: 'templates',
        namespace: 'templates',
        content: content,
        metadata: {
          template_title: templateTitle,
          template_type: templateType,
          keywords: this.extractKeywords(content),
          language: 'ar',
          ocr_confidence: ocrConfidence,
          source: 'نماذج قانونية - سلطنة عمان'
        }
      };
      chunks.push(chunk);
      notes.push('Processed as single template chunk');
    }
    
    const metadata: DocumentMetadata = {
      type: 'templates',
      namespace: 'templates',
      source: 'نماذج قانونية - سلطنة عمان',
      language: 'ar',
      processingDate: new Date().toISOString(),
      ocrConfidence,
      verified: (ocrConfidence || 0.95) > 0.9,
      templateTitle,
      templateType,
      totalSections: sections.length
    };
    
    return { chunks, metadata, notes };
  }
  
  private extractTemplateTitle(content: string): string {
    const match = content.match(/نموذج\s+([^،\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  private extractTemplateType(content: string): string {
    const match = content.match(/عقد|اتفاقية|طلب|تظلم|شكوى|استمارة/i);
    return match ? match[0] : 'نموذج';
  }
  
  private extractSections(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    const sectionMatches = content.match(/(البند|الفقرة|القسم)\s+\d+[^:]*:([^(البند|الفقرة|القسم)]*)/g);
    
    sectionMatches?.forEach(match => {
      const titleMatch = match.match(/(البند|الفقرة|القسم)\s+\d+[^:]*/);
      const title = titleMatch ? titleMatch[0] : '';
      const content = match.replace(/^[^:]*:/, '').trim();
      sections.push({ title, content });
    });
    
    return sections;
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
