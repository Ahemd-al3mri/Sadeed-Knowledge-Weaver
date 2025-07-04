import { z } from 'zod';
import { parseArabicTable } from './arabic-table-parser';

// Document classification schemas based on data_instructions folder
export const DocumentTypeSchema = z.enum([
  'legal_fatwa',
  'law_article', 
  'royal_decree',
  'judicial_civil',
  'judicial_criminal',
  'judicial_principles',
  'ministerial_decision',
  'regulation',
  'royal_order',
  'decree',
  'mixed_source'
]);

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// Classification patterns extracted from instruction files
export const DocumentClassificationPatterns = {
  legal_fatwa: {
    identifiers: ['فتوى', 'إجابة', 'استفسار', 'وزارة العدل والشؤون القانونية'],
    structure: ['رقم الفتوى', 'السؤال', 'الجواب', 'الأساس القانوني'],
    namespace: 'fatwas',
    requiredFields: ['fatwa_number', 'question', 'answer']
  },
  
  law_article: {
    identifiers: ['مادة', 'قانون', 'مرسوم سلطاني', 'باب', 'فصل'],
    structure: ['عنوان القانون', 'رقم المادة', 'نص المادة'],
    namespace: 'laws',
    requiredFields: ['law_title', 'article_number', 'text']
  },
  
  royal_decree: {
    identifiers: ['مرسوم سلطاني', 'نحن', 'سلطان عمان', 'صدر في'],
    structure: ['رقم المرسوم', 'الديباجة', 'المواد', 'مادة النفاذ'],
    namespace: 'royal_decrees',
    requiredFields: ['decree_number', 'title', 'date']
  },
  
  judicial_civil: {
    identifiers: ['المحكمة العليا', 'الدائرة المدنية', 'مبدأ', 'قضية'],
    structure: ['رقم المبدأ', 'رقم القضية', 'موضوع المبدأ', 'نص المبدأ'],
    namespace: 'judicial_civil',
    requiredFields: ['principle_number', 'case_number', 'topic']
  },
  
  judicial_criminal: {
    identifiers: ['المحكمة العليا', 'الدائرة الجزائية', 'حكم', 'جناية', 'جنحة'],
    structure: ['رقم الحكم', 'التهمة', 'الحكم', 'المبدأ القانوني'],
    namespace: 'judicial_criminal',
    requiredFields: ['judgment_number', 'charge', 'verdict']
  },
  
  ministerial_decision: {
    identifiers: ['قرار وزاري', 'الوزير', 'قرار رقم'],
    structure: ['رقم القرار', 'الوزارة', 'موضوع القرار', 'المواد'],
    namespace: 'ministerial_decisions',
    requiredFields: ['decision_number', 'ministry', 'subject']
  },
  
  regulation: {
    identifiers: ['لائحة', 'تنظيم', 'ضوابط', 'إجراءات'],
    structure: ['عنوان اللائحة', 'المواد', 'الأحكام'],
    namespace: 'regulations',
    requiredFields: ['regulation_title', 'issuing_authority']
  }
};

// Utility to detect and extract tables from content
function extractTablesFromContent(content: string): Array<{ raw: string; parsed: any[] }> {
  // Simple regex to match markdown tables (lines starting and ending with |)
  const tableRegex = /((?:^\|.*\|\s*$\n?)+)/gm;
  const matches = content.match(tableRegex) || [];
  return matches.map(raw => ({ raw, parsed: parseArabicTable(raw) }));
}

// Document classifier function
export class DocumentClassifier {
  
  /**
   * Classifies a document based on its content and structure
   * @param content - The document content as string
   * @param metadata - Optional existing metadata
   * @returns Predicted document type and confidence score
   */
  static classifyDocument(content: string, metadata?: any): {
    type: DocumentType;
    confidence: number;
    matchedPatterns: string[];
  } {
    const scores: Record<string, { score: number; patterns: string[] }> = {};
    
    // Initialize all types with zero scores
    Object.keys(DocumentClassificationPatterns).forEach(type => {
      scores[type] = { score: 0, patterns: [] };
    });
    
    // Score each document type based on pattern matching
    Object.entries(DocumentClassificationPatterns).forEach(([type, config]) => {
      config.identifiers.forEach(identifier => {
        if (content.includes(identifier)) {
          scores[type].score += 1;
          scores[type].patterns.push(identifier);
        }
      });
      
      // Bonus points for structure elements
      config.structure.forEach(element => {
        if (content.includes(element)) {
          scores[type].score += 0.5;
          scores[type].patterns.push(element);
        }
      });
    });
    
    // Find the highest scoring type
    let bestType: string = 'mixed_source';
    let bestScore = 0;
    let bestPatterns: string[] = [];
    Object.entries(scores).forEach(([type, data]) => {
      if (data.score > bestScore) {
        bestType = type;
        bestScore = data.score;
        bestPatterns = data.patterns;
      }
    });
    // Calculate confidence (normalize by max possible score)
    const maxPossibleScore = Math.max(
      ...Object.values(DocumentClassificationPatterns).map(
        config => config.identifiers.length + config.structure.length * 0.5
      )
    );
    const confidence = Math.min(bestScore / maxPossibleScore, 1.0);
    return {
      type: bestType as DocumentType,
      confidence,
      matchedPatterns: bestPatterns
    };
  }
  
  /**
   * Validates if a document has the required fields for its type
   * @param type - Document type
   * @param metadata - Document metadata
   * @returns Validation result with missing fields
   */
  static validateRequiredFields(type: DocumentType, metadata: any): {
    isValid: boolean;
    missingFields: string[];
  } {
    const config = DocumentClassificationPatterns[type as keyof typeof DocumentClassificationPatterns];
    if (!config) {
      return { isValid: false, missingFields: ['Invalid document type'] };
    }
    
    const missingFields = config.requiredFields.filter(field => !metadata[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
  
  /**
   * Gets the appropriate namespace for a document type
   * @param type - Document type
   * @returns Namespace string
   */
  static getNamespace(type: DocumentType): string {
    const config = DocumentClassificationPatterns[type as keyof typeof DocumentClassificationPatterns];
    return config?.namespace || 'mixed_sources';
  }
  
  /**
   * Suggests chunking strategy based on document type
   * @param type - Document type
   * @returns Chunking strategy description
   */
  static getChunkingStrategy(type: DocumentType): string {
    const strategies: Record<string, string> = {
      legal_fatwa: 'Each fatwa as independent chunk with question/answer/legal_basis clearly separated',
      law_article: 'Each article as independent chunk, do not merge articles',
      royal_decree: 'Short decrees (3-4 articles) as one chunk, longer decrees split by articles',
      judicial_civil: 'Each principle as independent chunk, maintain numbering',
      judicial_criminal: 'Each judgment as independent chunk',
      ministerial_decision: 'Each decision as independent chunk, split articles if lengthy',
      regulation: 'Split by major sections or chapters, maintain hierarchy'
    };
    
    return strategies[type] || 'Apply general chunking rules based on content structure';
  }
}

// Example usage and validation
export const validateDocumentClassification = (
  content: string,
  expectedType?: DocumentType
): {
  classification: ReturnType<typeof DocumentClassifier.classifyDocument>;
  validation: string[];
  recommendations: string[];
  tables?: Array<{ raw: string; parsed: any[] }>;
} => {
  const classification = DocumentClassifier.classifyDocument(content);
  const validation: string[] = [];
  const recommendations: string[] = [];
  // Detect tables in the content
  const tables = extractTablesFromContent(content);
  if (tables.length > 0) {
    recommendations.push(`Detected ${tables.length} table(s) in the document. Consider structured extraction.`);
  }
  // Check confidence threshold
  if (classification.confidence < 0.3) {
    validation.push('Low confidence classification - manual review recommended');
  }
  // Compare with expected type if provided
  if (expectedType && classification.type !== expectedType) {
    validation.push(`Classification mismatch: predicted ${classification.type}, expected ${expectedType}`);
  }
  // Add recommendations based on type
  const strategy = DocumentClassifier.getChunkingStrategy(classification.type);
  recommendations.push(`Chunking strategy: ${strategy}`);
  const namespace = DocumentClassifier.getNamespace(classification.type);
  recommendations.push(`Use namespace: ${namespace}`);
  return { classification, validation, recommendations, tables };
};
