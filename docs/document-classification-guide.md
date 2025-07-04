# Document Classification Using Data Instructions

This guide explains how to use the `data_instructions` folder to implement AI-powered document classification and processing for legal and governmental documents.

## Overview

The `data_instructions` folder contains detailed processing guidelines for different types of legal documents in Arabic. Each instruction file defines:

- **Document identification patterns** (keywords, structure markers)
- **Metadata extraction requirements** (required fields, optional fields)
- **Chunking strategies** (how to split documents into processable units)
- **Validation rules** (data quality requirements)

## Available Document Types

| File | Document Type | Description |
|------|---------------|-------------|
| `fatwas_instructions.md` | Legal Fatwas | Official legal opinions from Ministry of Justice |
| `laws_instructions.md` | Laws | Legislative texts with articles and sections |
| `royal_decrees_instructions.md` | Royal Decrees | Official decrees from the Sultan |
| `judicial_civil_instructions.md` | Civil Judgments | Civil court decisions and principles |
| `judicial_criminal_instructions.md` | Criminal Judgments | Criminal court decisions |
| `judicial_principles_instructions.md` | Judicial Principles | Legal principles and precedents |
| `ministerial_decisions_instructions.md` | Ministerial Decisions | Official ministerial orders |
| `regulations_instructions.md` | Regulations | Administrative regulations and bylaws |
| `royal_orders_instructions.md` | Royal Orders | Royal commands and directives |
| `decrees_instructions.md` | General Decrees | Various types of official decrees |
| `mixed_sources_instructions.md` | Mixed Sources | Documents that don't fit other categories |

## Implementation

### 1. Document Classification

```typescript
import { DocumentClassifier } from './ai/flows/document-classification';

// Classify a document
const result = DocumentClassifier.classifyDocument(documentContent);
console.log(`Type: ${result.type}, Confidence: ${result.confidence}`);

// Get processing namespace
const namespace = DocumentClassifier.getNamespace(result.type);

// Get chunking strategy
const strategy = DocumentClassifier.getChunkingStrategy(result.type);
```

### 2. Intelligent Processing

```typescript
import { IntelligentDocumentProcessor } from './ai/flows/intelligent-document-processor';

// Process document with automatic classification
const result = await IntelligentDocumentProcessor.processDocument(
  documentContent,
  ocrConfidence // optional
);

console.log({
  classification: result.classification,
  chunks: result.chunks.length,
  metadata: result.metadata
});
```

### 3. Integration with Existing AI Flows

#### OCR Processing Integration
```typescript
// In ocr-processing.ts
import { DocumentClassifier } from './document-classification';

export async function enhancedOcrProcessing(ocrResult) {
  const classification = DocumentClassifier.classifyDocument(ocrResult.text);
  
  return {
    ...ocrResult,
    documentType: classification.type,
    confidence: classification.confidence,
    recommendedReview: classification.confidence < 0.7
  };
}
```

#### Metadata Extraction Integration
```typescript
// In metadata-extraction.ts
import { DocumentClassifier } from './document-classification';

export function validateExtractedMetadata(documentType, metadata) {
  const validation = DocumentClassifier.validateRequiredFields(documentType, metadata);
  
  return {
    isValid: validation.isValid,
    missingFields: validation.missingFields,
    namespace: DocumentClassifier.getNamespace(documentType)
  };
}
```

#### Intelligent Chunking Integration
```typescript
// In intelligent-chunking.ts
import { DocumentClassifier } from './document-classification';

export function getChunkingStrategy(documentType) {
  return DocumentClassifier.getChunkingStrategy(documentType);
}
```

## Document-Specific Processing Rules

### Fatwas (Legal Opinions)
- **Chunking**: One chunk per fatwa
- **Required fields**: `fatwa_number`, `question`, `answer`
- **Structure**: Question → Answer → Legal Basis
- **Namespace**: `fatwas`

### Laws
- **Chunking**: One chunk per article
- **Required fields**: `law_title`, `article_number`, `text`
- **Structure**: Law Title → Articles → Sections
- **Namespace**: `laws`

### Royal Decrees
- **Chunking**: Short decrees (≤4 articles) = 1 chunk, longer = split by articles
- **Required fields**: `decree_number`, `title`, `date`
- **Structure**: Preamble → Articles → Enforcement clause
- **Namespace**: `royal_decrees`

### Judicial Documents
- **Chunking**: One chunk per principle/judgment
- **Required fields**: `principle_number`, `case_number`, `topic`
- **Structure**: Case info → Principle → Legal reasoning
- **Namespace**: `judicial_civil` or `judicial_criminal`

## Quality Assurance

### Validation Checklist
- [ ] Document type correctly identified (>70% confidence)
- [ ] All required metadata fields extracted
- [ ] Chunking strategy applied correctly
- [ ] OCR confidence acceptable (>90% for auto-processing)
- [ ] Namespace properly assigned

### Error Handling
```typescript
const validation = validateDocumentClassification(content, expectedType);

if (validation.classification.confidence < 0.7) {
  // Flag for manual review
  console.log('Low confidence classification - manual review needed');
}

if (validation.validation.length > 0) {
  // Handle validation errors
  console.log('Validation issues:', validation.validation);
}
```

## Best Practices

### 1. Pre-processing
- Clean OCR artifacts before classification
- Normalize Arabic text encoding
- Remove unnecessary whitespace and formatting

### 2. Classification
- Use multiple classification methods for critical documents
- Set confidence thresholds based on use case
- Implement fallback to manual review for low-confidence results

### 3. Chunking
- Preserve document hierarchy in metadata
- Maintain cross-references between chunks
- Include sufficient context in each chunk

### 4. Metadata
- Validate all required fields are extracted
- Use consistent date formats (ISO 8601)
- Store original document structure information

### 5. Quality Control
- Implement sampling-based quality checks
- Monitor classification accuracy over time
- Collect feedback for continuous improvement

## Example Usage

```typescript
// Complete document processing pipeline
async function processLegalDocument(documentContent: string) {
  try {
    // 1. Classify document
    const classification = DocumentClassifier.classifyDocument(documentContent);
    
    // 2. Validate classification confidence
    if (classification.confidence < 0.7) {
      throw new Error('Low confidence classification - manual review required');
    }
    
    // 3. Process using appropriate strategy
    const result = await IntelligentDocumentProcessor.processDocument(documentContent);
    
    // 4. Validate extracted metadata
    const validation = DocumentClassifier.validateRequiredFields(
      result.classification, 
      result.metadata
    );
    
    if (!validation.isValid) {
      console.warn('Missing required fields:', validation.missingFields);
    }
    
    // 5. Store in appropriate namespace
    const namespace = DocumentClassifier.getNamespace(result.classification);
    
    return {
      success: true,
      documentType: result.classification,
      chunks: result.chunks,
      namespace,
      metadata: result.metadata
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      requiresManualReview: true
    };
  }
}
```

## Integration Points

### Vector Database Storage
```typescript
// Store chunks with proper namespacing
for (const chunk of result.chunks) {
  await vectorDB.upsert({
    id: chunk.id,
    values: await generateEmbedding(chunk.content),
    metadata: {
      ...chunk.metadata,
      namespace: chunk.namespace,
      documentType: chunk.type
    }
  });
}
```

### Search and Retrieval
```typescript
// Search within specific document types
const results = await vectorDB.query({
  vector: queryEmbedding,
  filter: {
    namespace: 'fatwas',
    documentType: 'legal_fatwa'
  },
  topK: 10
});
```

This implementation provides a robust foundation for processing Arabic legal documents using the structured guidelines in your `data_instructions` folder.
