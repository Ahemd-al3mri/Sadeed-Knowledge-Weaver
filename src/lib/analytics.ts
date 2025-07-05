// Analytics utilities for document processing

interface ProcessedDocument {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'duplicate';
  statusMessage: string;
  contentHash?: string;
  classification?: string;
  confidence?: number;
  chunks?: string[];
  metadata?: Record<string, any>;
  processingTime?: number;
  errors?: string[];
}

export interface ProcessingAnalytics {
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  duplicateDocuments: number;
  averageConfidence: number;
  totalChunks: number;
  averageChunksPerDocument: number;
  processingTimeStats: {
    total: number;
    average: number;
    fastest: number;
    slowest: number;
  };
  documentTypeDistribution: Record<string, number>;
  confidenceDistribution: {
    high: number; // >90%
    medium: number; // 70-90%
    low: number; // <70%
  };
  errorTypes: Record<string, number>;
  qualityMetrics: {
    ocrAccuracy: number;
    classificationAccuracy: number;
    metadataCompleteness: number;
  };
}

export function calculateAnalytics(documents: ProcessedDocument[]): ProcessingAnalytics {
  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(d => d.status === 'completed').length;
  const failedDocuments = documents.filter(d => d.status === 'error').length;
  const duplicateDocuments = documents.filter(d => d.status === 'duplicate').length;

  // Calculate confidence statistics
  const confidenceScores = documents
    .filter(d => d.confidence !== undefined)
    .map(d => d.confidence!);
  
  const averageConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
    : 0;

  // Calculate chunk statistics
  const allChunks = documents.filter(d => d.chunks).flatMap(d => d.chunks!);
  const totalChunks = allChunks.length;
  const averageChunksPerDocument = completedDocuments > 0 ? totalChunks / completedDocuments : 0;

  // Calculate processing time statistics
  const processingTimes = documents
    .filter(d => d.processingTime !== undefined)
    .map(d => d.processingTime!);
  
  const processingTimeStats = {
    total: processingTimes.reduce((sum, time) => sum + time, 0),
    average: processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0,
    fastest: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
    slowest: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
  };

  // Calculate document type distribution
  const documentTypeDistribution: Record<string, number> = {};
  documents.forEach(doc => {
    if (doc.classification) {
      documentTypeDistribution[doc.classification] = 
        (documentTypeDistribution[doc.classification] || 0) + 1;
    }
  });

  // Calculate confidence distribution
  const confidenceDistribution = {
    high: confidenceScores.filter(conf => conf > 0.9).length,
    medium: confidenceScores.filter(conf => conf >= 0.7 && conf <= 0.9).length,
    low: confidenceScores.filter(conf => conf < 0.7).length,
  };

  // Calculate error types
  const errorTypes: Record<string, number> = {};
  documents.filter(d => d.errors).forEach(doc => {
    doc.errors!.forEach((error: string) => {
      // Extract error type from error message
      const errorType = extractErrorType(error);
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });
  });

  // Calculate quality metrics (simplified)
  const qualityMetrics = {
    ocrAccuracy: calculateOcrAccuracy(documents),
    classificationAccuracy: calculateClassificationAccuracy(documents),
    metadataCompleteness: calculateMetadataCompleteness(documents),
  };

  return {
    totalDocuments,
    completedDocuments,
    failedDocuments,
    duplicateDocuments,
    averageConfidence,
    totalChunks,
    averageChunksPerDocument,
    processingTimeStats,
    documentTypeDistribution,
    confidenceDistribution,
    errorTypes,
    qualityMetrics,
  };
}

function extractErrorType(errorMessage: string): string {
  // Simple error categorization based on error message
  if (errorMessage.includes('duplicate') || errorMessage.includes('مكرر')) {
    return 'مستندات مكررة';
  } else if (errorMessage.includes('OCR') || errorMessage.includes('استخراج النص')) {
    return 'أخطاء OCR';
  } else if (errorMessage.includes('classification') || errorMessage.includes('تصنيف')) {
    return 'أخطاء التصنيف';
  } else if (errorMessage.includes('metadata') || errorMessage.includes('بيانات وصفية')) {
    return 'أخطاء البيانات الوصفية';
  } else if (errorMessage.includes('chunk') || errorMessage.includes('تقطيع')) {
    return 'أخطاء التقطيع';
  } else if (errorMessage.includes('embedding') || errorMessage.includes('تضمين')) {
    return 'أخطاء التضمين';
  } else {
    return 'أخطاء عامة';
  }
}

function calculateOcrAccuracy(documents: ProcessedDocument[]): number {
  // This would typically require ground truth data
  // For now, we'll estimate based on confidence scores and successful processing
  const completedDocs = documents.filter(d => d.status === 'completed');
  if (completedDocs.length === 0) return 0;
  
  const avgConfidence = completedDocs
    .filter(d => d.confidence !== undefined)
    .reduce((sum, d) => sum + d.confidence!, 0) / completedDocs.length;
  
  return avgConfidence;
}

function calculateClassificationAccuracy(documents: ProcessedDocument[]): number {
  // This would typically require manual verification
  // For now, we'll estimate based on confidence scores
  const classifiedDocs = documents.filter(d => d.confidence !== undefined);
  if (classifiedDocs.length === 0) return 0;
  
  const highConfidenceDocs = classifiedDocs.filter(d => d.confidence! > 0.8).length;
  return highConfidenceDocs / classifiedDocs.length;
}

function calculateMetadataCompleteness(documents: ProcessedDocument[]): number {
  const completedDocs = documents.filter(d => d.status === 'completed' && d.metadata);
  if (completedDocs.length === 0) return 0;
  
  let totalFields = 0;
  let filledFields = 0;
  
  completedDocs.forEach(doc => {
    if (doc.metadata) {
      const fields = Object.values(doc.metadata);
      totalFields += fields.length;
      filledFields += fields.filter(field => 
        field !== null && 
        field !== undefined && 
        field !== '' && 
        (Array.isArray(field) ? field.length > 0 : true)
      ).length;
    }
  });
  
  return totalFields > 0 ? filledFields / totalFields : 0;
}

// Export utility functions for external use
export {
  extractErrorType,
  calculateOcrAccuracy,
  calculateClassificationAccuracy,
  calculateMetadataCompleteness
};
