import { IntelligentDocumentProcessor } from './intelligent-document-processor';
import { DocumentClassifier, DocumentType } from './document-classification';

/**
 * Example usage of the document classification system
 * This demonstrates how to use the data_instructions folder for AI-powered document processing
 */

// Example 1: Processing a Fatwa document
export async function processFatwaExample() {
  const fatwaContent = `
الفتوى رقم: 2/58407
التاريخ: 2023-11-01
الموضوع: الإجازة المرضية – اعتماد الشهادة الطبية

وزارة العدل والشؤون القانونية

السؤال: ما مدى جواز إعادة النظر في الشهادة الطبية بعد اعتمادها من قبل الجهة الطبية المختصة؟

الجواب: لا يجوز للجهة الطبية المختصة المعتمدة معاودة النظر في الشهادات الطبية التي أصدرتها بعد اعتمادها، إلا في حالات استثنائية محددة قانونياً.

الأساس القانوني: اللائحة التنفيذية لقانون الخدمة المدنية – المادتين 102 و103
  `;

  console.log('=== Processing Fatwa Document ===');
  
  // Step 1: Classify the document
  const classification = DocumentClassifier.classifyDocument(fatwaContent);
  console.log('Classification:', {
    type: classification.type,
    confidence: (classification.confidence * 100).toFixed(1) + '%',
    matchedPatterns: classification.matchedPatterns
  });

  // Step 2: Process using intelligent processor
  const result = await IntelligentDocumentProcessor.processDocument(fatwaContent, 0.96);
  
  console.log('Processing Result:', {
    classification: result.classification,
    confidence: (result.confidence * 100).toFixed(1) + '%',
    chunksGenerated: result.chunks.length,
    processingNotes: result.processingNotes
  });

  // Step 3: Show generated chunk
  console.log('Generated Chunk:', {
    id: result.chunks[0]?.id,
    type: result.chunks[0]?.type,
    namespace: result.chunks[0]?.namespace,
    metadata: result.chunks[0]?.metadata
  });

  return result;
}

// Example 2: Processing a Law document
export async function processLawExample() {
  const lawContent = `
قانون تسليم المجرمين
مرسوم سلطاني رقم 4/2000
تاريخ الإصدار: 2000-01-22

الباب الأول – أحكام عامة

المادة 1: يسمى هذا القانون "قانون تسليم المجرمين".

المادة 2: يقصد بالتسليم في هذا القانون تسليم شخص متهم أو محكوم عليه في جريمة.

المادة 3: لا يجوز التسليم في الحالات الآتية:
أ) إذا كانت الجريمة سياسية
ب) إذا كان المطلوب تسليمه من رعايا السلطنة

الباب الثاني – إجراءات التسليم

المادة 4: يتم طلب التسليم عن طريق السلطات القضائية المختصة.
  `;

  console.log('\n=== Processing Law Document ===');
  
  const classification = DocumentClassifier.classifyDocument(lawContent);
  console.log('Classification:', {
    type: classification.type,
    confidence: (classification.confidence * 100).toFixed(1) + '%',
    matchedPatterns: classification.matchedPatterns
  });

  const result = await IntelligentDocumentProcessor.processDocument(lawContent, 0.98);
  
  console.log('Processing Result:', {
    classification: result.classification,
    chunksGenerated: result.chunks.length,
    articlesSplit: result.chunks.map(chunk => chunk.metadata.article_number)
  });

  return result;
}

// Example 3: Batch processing with classification validation
export async function batchProcessDocuments(documents: Array<{content: string, expectedType?: DocumentType}>) {
  console.log('\n=== Batch Processing Documents ===');
  
  const results = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(`\nProcessing document ${i + 1}/${documents.length}`);
    
    // Classify and validate
    const classification = DocumentClassifier.classifyDocument(doc.content);
    
    // Check if classification matches expected type
    if (doc.expectedType && classification.type !== doc.expectedType) {
      console.warn(`⚠️  Classification mismatch: expected ${doc.expectedType}, got ${classification.type}`);
    }
    
    // Validate required fields would be extractable
    const namespace = DocumentClassifier.getNamespace(classification.type);
    const strategy = DocumentClassifier.getChunkingStrategy(classification.type);
    
    console.log(`✅ Classified as: ${classification.type} (${(classification.confidence * 100).toFixed(1)}%)`);
    console.log(`📁 Namespace: ${namespace}`);
    console.log(`✂️  Strategy: ${strategy}`);
    
    // Process the document
    const result = await IntelligentDocumentProcessor.processDocument(doc.content);
    results.push(result);
  }
  
  return results;
}

// Example 4: Integration with your existing AI flows
export function integrateWithExistingFlows() {
  /**
   * This shows how to integrate document classification with your existing AI flows:
   * 
   * 1. OCR Processing Flow (ocr-processing.ts):
   *    - After OCR extraction, use DocumentClassifier.classifyDocument()
   *    - Pass OCR confidence score to IntelligentDocumentProcessor
   * 
   * 2. Intelligent Chunking Flow (intelligent-chunking.ts):
   *    - Use DocumentClassifier.getChunkingStrategy() to determine chunking approach
   *    - Apply type-specific chunking rules from data_instructions
   * 
   * 3. Metadata Extraction Flow (metadata-extraction.ts):
   *    - Use type-specific metadata schemas from data_instructions
   *    - Validate extracted metadata using DocumentClassifier.validateRequiredFields()
   * 
   * 4. Auto Document Type Identification (auto-document-type-identification.ts):
   *    - Replace or enhance with DocumentClassifier for more accurate classification
   * 
   * 5. Embedding Generation Flow (embedding-generation.ts):
   *    - Use appropriate namespace from DocumentClassifier.getNamespace()
   *    - Include document type in embedding metadata
   */
  
  const integrationExamples = {
    
    // Enhanced OCR Processing
    enhancedOcrProcessing: async (ocrResult: { text: string, confidence: number }) => {
      const classification = DocumentClassifier.classifyDocument(ocrResult.text);
      const processed = await IntelligentDocumentProcessor.processDocument(
        ocrResult.text, 
        ocrResult.confidence
      );
      
      return {
        ...processed,
        ocrConfidence: ocrResult.confidence,
        recommendedReview: ocrResult.confidence < 0.9 || classification.confidence < 0.7
      };
    },
    
    // Enhanced Metadata Extraction
    enhancedMetadataExtraction: (documentType: DocumentType, extractedData: any) => {
      const validation = DocumentClassifier.validateRequiredFields(documentType, extractedData);
      
      return {
        isValid: validation.isValid,
        missingFields: validation.missingFields,
        namespace: DocumentClassifier.getNamespace(documentType),
        suggestedMetadata: extractedData
      };
    },
    
    // Enhanced Chunking Strategy
    enhancedChunking: (documentType: DocumentType, content: string) => {
      const strategy = DocumentClassifier.getChunkingStrategy(documentType);
      
      // Apply strategy-specific chunking logic
      return {
        strategy,
        recommendedChunkSize: documentType === 'law_article' ? 'per_article' : 'per_section',
        shouldMaintainHierarchy: ['law_article', 'royal_decree', 'regulation'].includes(documentType)
      };
    }
  };
  
  return integrationExamples;
}

// Example usage and testing
export async function runExamples() {
  try {
    // Run individual examples
    await processFatwaExample();
    await processLawExample();
    
    // Run batch processing
    const testDocuments = [
      {
        content: "الفتوى رقم 123/2023 - موضوع التأمين الصحي...",
        expectedType: 'legal_fatwa' as DocumentType
      },
      {
        content: "مرسوم سلطاني رقم 45/2023 بشأن إصدار قانون...",
        expectedType: 'royal_decree' as DocumentType
      }
    ];
    
    await batchProcessDocuments(testDocuments);
    
    // Show integration examples
    const integration = integrateWithExistingFlows();
    console.log('\n=== Integration Examples Created ===');
    console.log('Available integration functions:', Object.keys(integration));
    
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in your application
export {
  DocumentClassifier,
  IntelligentDocumentProcessor
};

export type { DocumentType };
