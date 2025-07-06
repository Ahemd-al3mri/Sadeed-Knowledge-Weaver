'use server';

/**
 * @fileOverview Performs OCR on a given image or PDF document using Mistral OCR API with advanced annotation features.
 *
 * - ocrProcessing - A function that handles the OCR process with optional annotation extraction.
 * - OcrProcessingInput - The input type for the ocrProcessing function.
 * - OcrProcessingOutput - The return type for the ocrProcessing function.
 */

import {Mistral} from '@mistralai/mistralai';
import {z} from 'genkit';
import { DocumentAnnotation, LegalStructureAnnotation, BoundingBox, TextSegment } from '@/lib/types';

const OcrProcessingInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The document (image or PDF) to be OCR'd, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  enableAnnotations: z
    .boolean()
    .optional()
    .describe('Whether to enable structured annotation extraction for legal documents. Default: false'),
  documentType: z
    .string()
    .optional()
    .describe('The identified document type to guide annotation extraction'),
});
export type OcrProcessingInput = z.infer<typeof OcrProcessingInputSchema>;

const OcrProcessingOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text content from the OCR process.'),
  annotations: z
    .array(z.any())
    .optional()
    .describe('Structured annotations extracted from the document'),
  legalStructure: z
    .record(z.any())
    .optional()
    .describe('Legal document structure annotations'),
  boundingBoxes: z
    .array(z.any())
    .optional()
    .describe('Bounding box coordinates for document elements'),
});
export type OcrProcessingOutput = z.infer<typeof OcrProcessingOutputSchema>;

export async function ocrProcessing(input: OcrProcessingInput): Promise<OcrProcessingOutput> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  // Debug logging
  console.log('=== OCR Processing Debug ===');
  console.log('API Key exists:', !!apiKey);
  console.log('Input data URI length:', input.fileDataUri.length);
  console.log('Input data URI prefix:', input.fileDataUri.substring(0, 50) + '...');
  console.log('Annotations enabled:', input.enableAnnotations);
  console.log('Document type:', input.documentType);
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is required');
  }

  const client = new Mistral({
    apiKey: apiKey,
  });

  try {
    // Determine the document type from the data URI
    const mimeTypeMatch = input.fileDataUri.match(/^data:([^;]+);base64,/);
    if (!mimeTypeMatch) {
      console.error('Invalid data URI format - no MIME type match');
      throw new Error('Invalid data URI format. Expected format: data:<mimetype>;base64,<encoded_data>');
    }

    const mimeType = mimeTypeMatch[1];
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    console.log('Detected MIME type:', mimeType);
    console.log('Is image:', isImage);
    console.log('Is PDF:', isPdf);

    if (!isImage && !isPdf) {
      throw new Error(`Unsupported file type: ${mimeType}. Only images and PDFs are supported.`);
    }

    // Prepare OCR request with optional annotations
    const ocrRequest: any = {
      model: "mistral-ocr-latest",
      document: isImage 
        ? {
            type: "image_url" as const,
            imageUrl: input.fileDataUri
          }
        : {
            type: "document_url" as const,
            documentUrl: input.fileDataUri
          },
      includeImageBase64: false
    };

    // Add annotation features if enabled
    if (input.enableAnnotations) {
      ocrRequest.bboxAnnotation = true;
      ocrRequest.documentAnnotation = createDocumentAnnotationSchema(input.documentType);
    }

    // Process with Mistral OCR
    console.log('Sending request to Mistral OCR API...');
    console.log('OCR Request config:', JSON.stringify(ocrRequest, null, 2));
    
    const ocrResponse = await client.ocr.process(ocrRequest);

    console.log('OCR Response received');
    console.log('OCR Response keys:', Object.keys(ocrResponse));
    console.log('OCR Response:', JSON.stringify(ocrResponse, null, 2));

    // Extract the text content from the response
    let extractedText = '';
    let annotations: DocumentAnnotation[] = [];
    let legalStructure: LegalStructureAnnotation | undefined;
    let boundingBoxes: BoundingBox[] = [];
    
    console.log('OCR Response received');
    console.log('OCR Response keys:', Object.keys(ocrResponse));
    console.log('OCR Response pages length:', ocrResponse.pages?.length || 0);
    
    // Extract text from pages array
    if (ocrResponse.pages && Array.isArray(ocrResponse.pages) && ocrResponse.pages.length > 0) {
      extractedText = ocrResponse.pages
        .map((page: any) => page.markdown || page.text || '')
        .join('\n\n')
        .trim();
      console.log('Found text in response.pages');

      // Process annotations if available
      if (input.enableAnnotations) {
        const annotationResult = processAnnotations(ocrResponse, input.documentType);
        annotations = annotationResult.annotations;
        legalStructure = annotationResult.legalStructure;
        boundingBoxes = annotationResult.boundingBoxes;
      }
    } else {
      console.log('No pages found in response');
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 100) + '...');
    console.log('Annotations found:', annotations.length);
    console.log('Legal structure extracted:', !!legalStructure);
    console.log('=== End OCR Debug ===');

    const result: OcrProcessingOutput = {
      extractedText: extractedText || 'No text could be extracted from the document.'
    };

    if (input.enableAnnotations) {
      result.annotations = annotations;
      result.legalStructure = legalStructure;
      result.boundingBoxes = boundingBoxes;
    }

    return result;

  } catch (error) {
    console.error('OCR processing error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a document annotation schema based on the document type
 */
function createDocumentAnnotationSchema(documentType?: string): any {
  const baseSchema = {
    title: { type: "string", description: "Document title" },
    sections: { type: "array", items: { type: "object", properties: { content: { type: "string" }, type: { type: "string" } } } },
    metadata: { type: "object", properties: { date: { type: "string" }, authority: { type: "string" } } }
  };

  switch (documentType) {
    case 'royal_decree':
    case 'royal_order':
      return {
        ...baseSchema,
        decree_number: { type: "string", description: "Royal decree number" },
        issuing_authority: { type: "string", description: "Royal issuing authority" },
        articles: { type: "array", items: { type: "object" } }
      };
    
    case 'law':
    case 'regulation':
      return {
        ...baseSchema,
        law_number: { type: "string", description: "Law or regulation number" },
        chapters: { type: "array", items: { type: "object" } },
        articles: { type: "array", items: { type: "object" } }
      };
    
    case 'fatwa':
      return {
        ...baseSchema,
        fatwa_number: { type: "string", description: "Fatwa number" },
        question: { type: "string", description: "The legal question" },
        answer: { type: "string", description: "The fatwa answer" },
        references: { type: "array", items: { type: "string" } }
      };
    
    case 'judicial_civil':
    case 'judicial_criminal':
      return {
        ...baseSchema,
        case_number: { type: "string", description: "Case number" },
        court: { type: "string", description: "Court name" },
        parties: { type: "array", items: { type: "string" } },
        judgment: { type: "string", description: "Court judgment" }
      };
    
    default:
      return baseSchema;
  }
}

/**
 * Processes annotation data from OCR response
 */
function processAnnotations(ocrResponse: any, documentType?: string): {
  annotations: DocumentAnnotation[];
  legalStructure: LegalStructureAnnotation;
  boundingBoxes: BoundingBox[];
} {
  console.log('Processing annotations for document type:', documentType);
  
  const annotations: DocumentAnnotation[] = [];
  const boundingBoxes: BoundingBox[] = [];
  const legalStructure: LegalStructureAnnotation = {};

  // Process pages with annotations
  if (ocrResponse.pages && Array.isArray(ocrResponse.pages)) {
    ocrResponse.pages.forEach((page: any, pageIndex: number) => {
      console.log(`Processing page ${pageIndex + 1} annotations`);
      
      // Process bounding box annotations
      if (page.bbox_annotations) {
        page.bbox_annotations.forEach((bbox: any) => {
          if (bbox.coordinates) {
            boundingBoxes.push({
              left: bbox.coordinates.left || 0,
              top: bbox.coordinates.top || 0,
              width: bbox.coordinates.width || 0,
              height: bbox.coordinates.height || 0
            });
          }
          
          // Create document annotation from bbox
          if (bbox.content || bbox.text) {
            annotations.push({
              type: bbox.type || 'paragraph',
              content: bbox.content || bbox.text || '',
              bbox: bbox.coordinates ? {
                left: bbox.coordinates.left || 0,
                top: bbox.coordinates.top || 0,
                width: bbox.coordinates.width || 0,
                height: bbox.coordinates.height || 0
              } : undefined,
              metadata: bbox.metadata || {}
            });
          }
        });
      }

      // Process document structure annotations
      if (page.document_annotations) {
        processDocumentStructureAnnotations(page.document_annotations, annotations, legalStructure, documentType);
      }

      // Process any structured data in the page
      if (page.structured_data) {
        processStructuredData(page.structured_data, legalStructure, documentType);
      }
    });
  }

  console.log('Annotation processing complete:');
  console.log('- Annotations found:', annotations.length);
  console.log('- Bounding boxes found:', boundingBoxes.length);
  console.log('- Legal structure elements:', Object.keys(legalStructure).length);

  return { annotations, legalStructure, boundingBoxes };
}

/**
 * Processes document structure annotations
 */
function processDocumentStructureAnnotations(
  docAnnotations: any,
  annotations: DocumentAnnotation[],
  legalStructure: LegalStructureAnnotation,
  documentType?: string
) {
  // Process title
  if (docAnnotations.title) {
    legalStructure.documentTitle = {
      text: docAnnotations.title.content || docAnnotations.title,
      bbox: docAnnotations.title.bbox,
      confidence: docAnnotations.title.confidence
    };
    
    annotations.push({
      type: 'title',
      content: docAnnotations.title.content || docAnnotations.title,
      bbox: docAnnotations.title.bbox,
      metadata: { confidence: docAnnotations.title.confidence }
    });
  }

  // Process decree/law number
  if (docAnnotations.decree_number || docAnnotations.law_number) {
    const number = docAnnotations.decree_number || docAnnotations.law_number;
    legalStructure.decreeNumber = {
      text: number.content || number,
      bbox: number.bbox,
      confidence: number.confidence
    };
  }

  // Process issuing authority
  if (docAnnotations.issuing_authority) {
    legalStructure.issuingAuthority = {
      text: docAnnotations.issuing_authority.content || docAnnotations.issuing_authority,
      bbox: docAnnotations.issuing_authority.bbox,
      confidence: docAnnotations.issuing_authority.confidence
    };
  }

  // Process date
  if (docAnnotations.date || docAnnotations.issue_date) {
    const date = docAnnotations.date || docAnnotations.issue_date;
    legalStructure.issueDate = {
      text: date.content || date,
      bbox: date.bbox,
      confidence: date.confidence
    };
  }

  // Process articles
  if (docAnnotations.articles && Array.isArray(docAnnotations.articles)) {
    legalStructure.articles = docAnnotations.articles.map((article: any) => ({
      type: 'article' as const,
      content: article.content || article.text || '',
      bbox: article.bbox,
      metadata: { 
        number: article.number,
        confidence: article.confidence,
        ...article.metadata 
      }
    }));
    
    // Add to main annotations array
    if (legalStructure.articles) {
      annotations.push(...legalStructure.articles);
    }
  }

  // Process sections
  if (docAnnotations.sections && Array.isArray(docAnnotations.sections)) {
    legalStructure.sections = docAnnotations.sections.map((section: any) => ({
      type: 'section' as const,
      content: section.content || section.text || '',
      bbox: section.bbox,
      metadata: { 
        number: section.number,
        title: section.title,
        confidence: section.confidence,
        ...section.metadata 
      }
    }));
    
    if (legalStructure.sections) {
      annotations.push(...legalStructure.sections);
    }
  }

  // Process signatures
  if (docAnnotations.signatures && Array.isArray(docAnnotations.signatures)) {
    legalStructure.signatures = docAnnotations.signatures.map((sig: any) => ({
      text: sig.content || sig.text || '',
      bbox: sig.bbox,
      confidence: sig.confidence
    }));
  }
}

/**
 * Processes structured data from OCR response
 */
function processStructuredData(
  structuredData: any,
  legalStructure: LegalStructureAnnotation,
  documentType?: string
) {
  // Process metadata
  if (structuredData.metadata) {
    // This could be used to enhance the legal structure with additional metadata
    console.log('Processing structured metadata:', structuredData.metadata);
  }

  // Process specific document type structures
  switch (documentType) {
    case 'fatwa':
      if (structuredData.question) {
        // Store fatwa-specific structure
      }
      if (structuredData.answer) {
        // Store fatwa answer structure
      }
      break;
      
    case 'judicial_civil':
    case 'judicial_criminal':
      if (structuredData.parties) {
        // Store case parties information
      }
      if (structuredData.judgment) {
        // Store judgment structure
      }
      break;
  }
}
