import { z } from 'zod';
import { parseArabicTable } from './arabic-table-parser';

// Document classification schemas based on data_instructions folder
export const DocumentTypeSchema = z.enum([
  'laws',
  'royal_decrees', 
  'regulations',
  'ministerial_decisions',
  'royal_orders',
  'fatwas',
  'judicial_principles',
  'judicial_criminal',
  'judicial_civil',
  'indexes',
  'templates',
  'others'
]);

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// Classification patterns extracted from instruction files
export const DocumentClassificationPatterns = {
  laws: {
    identifiers: ['قانون', 'مادة', 'باب', 'فصل', 'قانون العمل', 'قانون الجزاء'],
    structure: ['المادة', 'الباب', 'الفصل', 'قانون رقم'],
    namespace: 'laws',
    requiredFields: ['law_title', 'article_number', 'text']
  },
  
  royal_decrees: {
    identifiers: ['مرسوم سلطاني', 'نحن قابوس', 'نحن هيثم', 'سلطان عمان', 'صدر في'],
    structure: ['مرسوم سلطاني رقم', 'نحن', 'صدر في'],
    namespace: 'decrees',
    requiredFields: ['decree_number', 'title', 'date']
  },
  
  regulations: {
    identifiers: ['اللائحة التنفيذية', 'لائحة', 'تنظيم', 'ضوابط', 'إجراءات'],
    structure: ['اللائحة التنفيذية لقانون', 'المادة', 'الأحكام'],
    namespace: 'regulations',
    requiredFields: ['regulation_title', 'issuing_authority']
  },
  
  ministerial_decisions: {
    identifiers: ['قرار وزاري', 'الوزير', 'قرار رقم', 'وزارة'],
    structure: ['قرار وزاري رقم', 'الوزير', 'المادة'],
    namespace: 'ministerial_decisions',
    requiredFields: ['decision_number', 'ministry', 'subject']
  },
  
  royal_orders: {
    identifiers: ['أمر سام', 'أمر سامي', 'توجيه سامي', 'منح وسام', 'تعيين'],
    structure: ['أمر سام بـ', 'جلالة السلطان', 'منح'],
    namespace: 'royal_orders',
    requiredFields: ['order_number', 'subject', 'date']
  },
  
  fatwas: {
    identifiers: ['فتوى', 'إجابة', 'استفسار', 'وزارة العدل والشؤون القانونية', 'دار الإفتاء'],
    structure: ['رقم الفتوى', 'السؤال', 'الجواب', 'الأساس القانوني'],
    namespace: 'fatwas',
    requiredFields: ['fatwa_number', 'question', 'answer']
  },
  
  judicial_principles: {
    identifiers: ['مبدأ قضائي', 'المحكمة العليا', 'مبدأ', 'قضية رقم', 'مبادئ قضائية'],
    structure: ['مبدأ رقم', 'قضية رقم', 'المحكمة العليا'],
    namespace: 'judicial_principles',
    requiredFields: ['principle_number', 'case_number', 'topic']
  },
  
  judicial_criminal: {
    identifiers: ['الدائرة الجزائية', 'حكم جزائي', 'جناية', 'جنحة', 'عقوبة'],
    structure: ['الدائرة الجزائية', 'حكم رقم', 'التهمة', 'العقوبة'],
    namespace: 'judicial_criminal',
    requiredFields: ['judgment_number', 'charge', 'verdict']
  },
  
  judicial_civil: {
    identifiers: ['الدائرة المدنية', 'الدائرة التجارية', 'حكم مدني', 'دعوى مدنية', 'عقد'],
    structure: ['الدائرة المدنية', 'حكم رقم', 'الحكم', 'المبدأ'],
    namespace: 'judicial_civil',
    requiredFields: ['judgment_number', 'case_type', 'verdict']
  },
  
  indexes: {
    identifiers: ['فهرس', 'دليل', 'كشاف', 'تصنيف', 'فهرس المبادئ'],
    structure: ['فهرس', 'الرقم', 'الموضوع', 'الصفحة'],
    namespace: 'indexes',
    requiredFields: ['index_title', 'year', 'items']
  },
  
  templates: {
    identifiers: ['نموذج', 'صيغة', 'استمارة', 'توكيل', 'عقد نموذجي'],
    structure: ['نموذج رقم', 'الصيغة', 'التوقيع'],
    namespace: 'templates',
    requiredFields: ['template_name', 'template_type', 'fields']
  },
  
  others: {
    identifiers: ['وثيقة', 'كتاب', 'تقرير', 'دراسة'],
    structure: ['العنوان', 'المحتوى', 'التاريخ'],
    namespace: 'others',
    requiredFields: ['title', 'content_type']
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
    let bestType: string = 'others';
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
    return config?.namespace || 'others';
  }
  
  /**
   * Suggests chunking strategy based on document type
   * @param type - Document type
   * @returns Chunking strategy description
   */
  static getChunkingStrategy(type: DocumentType): string {
    const strategies: Record<string, string> = {
      laws: 'Each article as independent chunk, do not merge articles. Maintain law structure and hierarchy.',
      royal_decrees: 'Short decrees (3-4 articles) as one chunk, longer decrees split by articles. Include preamble context.',
      regulations: 'Split by major sections or chapters, maintain regulatory hierarchy and cross-references.',
      ministerial_decisions: 'Each decision as independent chunk, split articles if lengthy. Include ministry context.',
      royal_orders: 'Each royal order as independent chunk, maintain ceremonial structure and context.',
      fatwas: 'Each fatwa as independent chunk with question/answer/legal_basis clearly separated.',
      judicial_principles: 'Each principle as independent chunk, maintain case numbering and court hierarchy.',
      judicial_criminal: 'Each criminal judgment as independent chunk, include case details and verdict.',
      judicial_civil: 'Each civil judgment as independent chunk, maintain case type and commercial context.',
      indexes: 'Preserve index structure, each major section as chunk with item listings.',
      templates: 'Each template as independent chunk, maintain form structure and field definitions.',
      others: 'Apply general chunking rules based on content structure and document type.'
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
