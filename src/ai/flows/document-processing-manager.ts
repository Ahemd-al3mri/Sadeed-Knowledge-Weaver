import { IntelligentDocumentProcessor, DuplicateDocumentError } from './intelligent-document-processor';
import { DocumentType } from './document-classification';

// Enhanced processing manager with better UX and workflow
export class DocumentProcessingManager {
  private processedHashes = new Set<string>();
  private processingQueue: ProcessingJob[] = [];
  private isProcessing = false;
  private progressCallback?: (progress: ProcessingProgress) => void;

  constructor(progressCallback?: (progress: ProcessingProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Add multiple documents to processing queue
   */
  async addDocumentsToQueue(documents: DocumentInput[]): Promise<string[]> {
    const jobIds: string[] = [];
    
    for (const doc of documents) {
      const jobId = this.generateJobId();
      const job: ProcessingJob = {
        id: jobId,
        input: doc,
        status: 'pending',
        createdAt: new Date().toISOString(),
        priority: doc.priority || 'normal'
      };
      
      this.processingQueue.push(job);
      jobIds.push(jobId);
    }

    // Sort queue by priority
    this.sortQueueByPriority();
    
    // Update progress
    this.updateProgress();
    
    return jobIds;
  }

  /**
   * Start processing the queue
   */
  async processQueue(): Promise<ProcessingResults> {
    if (this.isProcessing) {
      throw new Error('معالجة قيد التشغيل بالفعل');
    }

    this.isProcessing = true;
    const results: ProcessingResults = {
      successful: [],
      failed: [],
      duplicates: [],
      totalProcessed: 0,
      startTime: new Date().toISOString(),
      endTime: ''
    };

    try {
      while (this.processingQueue.length > 0) {
        const job = this.processingQueue.shift()!;
        job.status = 'processing';
        job.startedAt = new Date().toISOString();
        
        this.updateProgress();

        try {
          const result = await IntelligentDocumentProcessor.processDocument(
            job.input.content,
            this.processedHashes,
            job.input.ocrConfidence
          );

          // Add hash to processed set
          this.processedHashes.add(result.contentHash);

          job.status = 'completed';
          job.completedAt = new Date().toISOString();
          job.result = result;

          results.successful.push({
            jobId: job.id,
            fileName: job.input.fileName,
            classification: result.classification,
            chunksCount: result.chunks.length,
            confidence: result.confidence,
            contentHash: result.contentHash
          });

        } catch (error) {
          job.status = 'failed';
          job.completedAt = new Date().toISOString();
          job.error = error instanceof Error ? error.message : String(error);

          if (error instanceof DuplicateDocumentError) {
            results.duplicates.push({
              jobId: job.id,
              fileName: job.input.fileName,
              reason: 'ملف مكرر'
            });
          } else {
            results.failed.push({
              jobId: job.id,
              fileName: job.input.fileName,
              error: this.createUserFriendlyError(error),
              originalError: job.error
            });
          }
        }

        results.totalProcessed++;
        this.updateProgress();
        
        // Small delay to prevent overwhelming the system
        await this.delay(100);
      }

    } finally {
      this.isProcessing = false;
      results.endTime = new Date().toISOString();
    }

    return results;
  }

  /**
   * Get current processing status
   */
  getStatus(): ProcessingStatus {
    const pending = this.processingQueue.filter(j => j.status === 'pending').length;
    const processing = this.processingQueue.filter(j => j.status === 'processing').length;
    const completed = this.processingQueue.filter(j => j.status === 'completed').length;
    const failed = this.processingQueue.filter(j => j.status === 'failed').length;

    return {
      isProcessing: this.isProcessing,
      totalJobs: this.processingQueue.length + completed + failed,
      pending,
      processing,
      completed,
      failed,
      duplicatesSkipped: this.processedHashes.size
    };
  }

  /**
   * Clear the processing queue
   */
  clearQueue(): void {
    if (this.isProcessing) {
      throw new Error('لا يمكن مسح القائمة أثناء المعالجة');
    }
    this.processingQueue = [];
    this.updateProgress();
  }

  /**
   * Reset processed hashes (for new batch)
   */
  resetProcessedHashes(): void {
    this.processedHashes.clear();
  }

  /**
   * Load existing hashes from previous processing sessions
   */
  loadExistingHashes(hashes: string[]): void {
    hashes.forEach(hash => this.processedHashes.add(hash));
  }

  /**
   * Get processing recommendations based on queue analysis
   */
  getProcessingRecommendations(): ProcessingRecommendation[] {
    const recommendations: ProcessingRecommendation[] = [];
    const totalSize = this.processingQueue.reduce((sum, job) => sum + job.input.content.length, 0);
    
    if (this.processingQueue.length > 100) {
      recommendations.push({
        type: 'performance',
        message: 'عدد كبير من الملفات - يُنصح بمعالجتها على دفعات أصغر',
        severity: 'warning'
      });
    }

    if (totalSize > 10 * 1024 * 1024) { // 10MB
      recommendations.push({
        type: 'memory',
        message: 'حجم البيانات كبير - قد تحتاج لذاكرة إضافية',
        severity: 'info'
      });
    }

    const priorityDist = this.analyzePriorityDistribution();
    if (priorityDist.high > priorityDist.normal * 2) {
      recommendations.push({
        type: 'priority',
        message: 'عدد كبير من المهام عالية الأولوية - تحقق من التصنيف',
        severity: 'warning'
      });
    }

    return recommendations;
  }

  // Private helper methods

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sortQueueByPriority(): void {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    this.processingQueue.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }

  private updateProgress(): void {
    if (this.progressCallback) {
      const status = this.getStatus();
      const progress: ProcessingProgress = {
        ...status,
        percentage: status.totalJobs > 0 ? 
          Math.round(((status.completed + status.failed) / status.totalJobs) * 100) : 0,
        currentJob: this.processingQueue.find(j => j.status === 'processing'),
        estimatedTimeRemaining: this.estimateTimeRemaining()
      };
      this.progressCallback(progress);
    }
  }

  private estimateTimeRemaining(): string {
    const processing = this.processingQueue.filter(j => j.status === 'processing')[0];
    if (!processing || !processing.startedAt) return 'غير محدد';

    const avgTimePerJob = 5000; // 5 seconds estimate
    const remainingJobs = this.processingQueue.filter(j => j.status === 'pending').length;
    const estimatedMs = remainingJobs * avgTimePerJob;

    const minutes = Math.floor(estimatedMs / 60000);
    const seconds = Math.floor((estimatedMs % 60000) / 1000);

    return `${minutes}د ${seconds}ث تقريباً`;
  }

  private analyzePriorityDistribution() {
    const dist = { high: 0, normal: 0, low: 0 };
    this.processingQueue.forEach(job => {
      dist[job.priority]++;
    });
    return dist;
  }

  private createUserFriendlyError(error: unknown): string {
    if (error instanceof Error) {
      // Map technical errors to user-friendly Arabic messages
      const errorMap: Record<string, string> = {
        'ENOENT': 'الملف غير موجود',
        'EACCES': 'لا توجد صلاحية للوصول للملف',
        'EMFILE': 'عدد كبير جداً من الملفات المفتوحة',
        'Classification failed': 'فشل في تصنيف نوع الوثيقة',
        'Invalid content': 'محتوى الملف غير صالح',
        'OCR confidence too low': 'جودة النص المستخرج منخفضة جداً'
      };

      for (const [key, message] of Object.entries(errorMap)) {
        if (error.message.includes(key)) {
          return message;
        }
      }

      return 'خطأ في معالجة الملف - يرجى المحاولة مرة أخرى';
    }

    return 'خطأ غير متوقع';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Type definitions

export interface DocumentInput {
  fileName: string;
  content: string;
  ocrConfidence?: number;
  priority?: 'high' | 'normal' | 'low';
}

interface ProcessingJob {
  id: string;
  input: DocumentInput;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: 'high' | 'normal' | 'low';
  result?: any;
  error?: string;
}

export interface ProcessingProgress {
  isProcessing: boolean;
  totalJobs: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  duplicatesSkipped: number;
  percentage: number;
  currentJob?: ProcessingJob;
  estimatedTimeRemaining: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  totalJobs: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  duplicatesSkipped: number;
}

export interface ProcessingResults {
  successful: SuccessfulResult[];
  failed: FailedResult[];
  duplicates: DuplicateResult[];
  totalProcessed: number;
  startTime: string;
  endTime: string;
}

interface SuccessfulResult {
  jobId: string;
  fileName: string;
  classification: DocumentType;
  chunksCount: number;
  confidence: number;
  contentHash: string;
}

interface FailedResult {
  jobId: string;
  fileName: string;
  error: string;
  originalError: string;
}

interface DuplicateResult {
  jobId: string;
  fileName: string;
  reason: string;
}

export interface ProcessingRecommendation {
  type: 'performance' | 'memory' | 'priority' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'error';
}
