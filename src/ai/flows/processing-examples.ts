import { DocumentProcessingManager, DocumentInput } from './document-processing-manager';
import { IntelligentDocumentProcessor } from './intelligent-document-processor';
import { DocumentClassifier } from './document-classification';

/**
 * مثال شامل لاستخدام نظام معالجة الوثائق القانونية
 * 
 * هذا المثال يوضح:
 * 1. كيفية إعداد النظام
 * 2. معالجة ملف واحد
 * 3. معالجة مجموعة ملفات
 * 4. التعامل مع الأخطاء والملفات المكررة
 * 5. مراقبة التقدم
 */

class DocumentProcessingExample {
  private manager: DocumentProcessingManager;

  constructor() {
    // إنشاء مدير المعالجة مع callback للتقدم
    this.manager = new DocumentProcessingManager(this.onProgressUpdate.bind(this));
  }

  /**
   * مثال 1: معالجة ملف واحد بسيط
   */
  async processSingleDocument(content: string, fileName: string) {
    console.log(`🚀 بدء معالجة الملف: ${fileName}`);
    
    try {
      // إنشاء مجموعة فارغة للبصمات (لملف واحد)
      const existingHashes = new Set<string>();
      
      const result = await IntelligentDocumentProcessor.processDocument(
        content,
        existingHashes
      );

      console.log(`✅ تم تصنيف الملف كـ: ${result.classification}`);
      console.log(`📊 مستوى الثقة: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`📦 عدد القطع: ${result.chunks.length}`);
      console.log(`🔑 بصمة المحتوى: ${result.contentHash}`);

      return result;

    } catch (error) {
      console.error(`❌ خطأ في معالجة ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * مثال 2: معالجة مجموعة ملفات مع مراقبة التقدم
   */
  async processBatchDocuments(documents: DocumentInput[]) {
    console.log(`🚀 بدء معالجة ${documents.length} ملف`);

    try {
      // إضافة الملفات إلى قائمة الانتظار
      const jobIds = await this.manager.addDocumentsToQueue(documents);
      console.log(`📋 تم إضافة ${jobIds.length} مهمة إلى القائمة`);

      // عرض التوصيات قبل البدء
      const recommendations = this.manager.getProcessingRecommendations();
      if (recommendations.length > 0) {
        console.log('\n💡 توصيات المعالجة:');
        recommendations.forEach(rec => {
          console.log(`   ${rec.severity === 'warning' ? '⚠️' : 'ℹ️'} ${rec.message}`);
        });
      }

      // بدء المعالجة
      const results = await this.manager.processQueue();

      // عرض النتائج
      console.log('\n📊 ملخص النتائج:');
      console.log(`✅ ناجح: ${results.successful.length}`);
      console.log(`❌ فشل: ${results.failed.length}`);
      console.log(`🔄 مكرر: ${results.duplicates.length}`);
      console.log(`⏱️ وقت المعالجة: ${this.calculateProcessingTime(results)}`);

      return results;

    } catch (error) {
      console.error('❌ خطأ في المعالجة المجمعة:', error);
      throw error;
    }
  }

  /**
   * مثال 3: معالجة ملفات من مجلد مع حفظ النتائج
   */
  async processDirectory(directoryPath: string, outputPath: string) {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      // قراءة جميع الملفات النصية من المجلد
      const files = await fs.readdir(directoryPath);
      const textFiles = files.filter(file => 
        file.endsWith('.txt') || file.endsWith('.md')
      );

      console.log(`📁 وُجد ${textFiles.length} ملف نصي في ${directoryPath}`);

      // تحويل الملفات إلى تنسيق DocumentInput
      const documents: DocumentInput[] = await Promise.all(
        textFiles.map(async (fileName) => {
          const filePath = path.join(directoryPath, fileName);
          const content = await fs.readFile(filePath, 'utf-8');
          
          return {
            fileName,
            content,
            priority: this.determinePriority(fileName)
          };
        })
      );

      // معالجة الملفات
      const results = await this.processBatchDocuments(documents);

      // حفظ النتائج
      await this.saveResults(results, outputPath);

      return results;

    } catch (error) {
      console.error(`❌ خطأ في معالجة المجلد ${directoryPath}:`, error);
      throw error;
    }
  }

  /**
   * مثال 4: استئناف معالجة متوقفة
   */
  async resumeProcessing(savedHashesPath: string, documentsToProcess: DocumentInput[]) {
    const fs = await import('fs/promises');

    try {
      // تحميل البصمات المحفوظة مسبقاً
      const savedHashesData = await fs.readFile(savedHashesPath, 'utf-8');
      const savedHashes = JSON.parse(savedHashesData);
      
      this.manager.loadExistingHashes(savedHashes);
      console.log(`📂 تم تحميل ${savedHashes.length} بصمة محفوظة`);

      // معالجة الملفات الجديدة
      const results = await this.processBatchDocuments(documentsToProcess);

      // حفظ البصمات المحدثة
      const allHashes = Array.from(this.manager['processedHashes']);
      await fs.writeFile(savedHashesPath, JSON.stringify(allHashes, null, 2));

      return results;

    } catch (error) {
      console.error('❌ خطأ في استئناف المعالجة:', error);
      throw error;
    }
  }

  /**
   * مثال 5: تحليل وإحصائيات النتائج
   */
  analyzeResults(results: any) {
    const analysis = {
      documentTypes: this.countDocumentTypes(results.successful),
      averageConfidence: this.calculateAverageConfidence(results.successful),
      chunkDistribution: this.analyzeChunkDistribution(results.successful),
      processingSpeed: this.calculateProcessingSpeed(results),
      errorPatterns: this.analyzeErrorPatterns(results.failed)
    };

    console.log('\n📈 تحليل مفصل للنتائج:');
    console.log('نوع الوثائق:', analysis.documentTypes);
    console.log('متوسط الثقة:', `${(analysis.averageConfidence * 100).toFixed(1)}%`);
    console.log('توزيع القطع:', analysis.chunkDistribution);
    console.log('سرعة المعالجة:', analysis.processingSpeed);

    return analysis;
  }

  // Callback للتقدم
  private onProgressUpdate(progress: any) {
    const bar = '█'.repeat(Math.floor(progress.percentage / 5));
    const empty = '░'.repeat(20 - Math.floor(progress.percentage / 5));
    
    console.log(`\r🔄 التقدم: [${bar}${empty}] ${progress.percentage}% | ` +
                `مكتمل: ${progress.completed} | ` +
                `فشل: ${progress.failed} | ` +
                `متبقي: ${progress.estimatedTimeRemaining}`);
  }

  // Helper methods
  private determinePriority(fileName: string): 'high' | 'normal' | 'low' {
    if (fileName.includes('urgent') || fileName.includes('عاجل')) return 'high';
    if (fileName.includes('archive') || fileName.includes('أرشيف')) return 'low';
    return 'normal';
  }

  private calculateProcessingTime(results: any): string {
    const start = new Date(results.startTime);
    const end = new Date(results.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffMin > 0) {
      return `${diffMin}د ${diffSec % 60}ث`;
    }
    return `${diffSec}ث`;
  }

  private async saveResults(results: any, outputPath: string) {
    const fs = await import('fs/promises');
    const path = await import('path');

    // إنشاء مجلد الإخراج إذا لم يكن موجوداً
    await fs.mkdir(outputPath, { recursive: true });

    // حفظ ملف النتائج الرئيسي
    const summaryPath = path.join(outputPath, 'processing-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(results, null, 2));

    // حفظ الملفات الناجحة في مجلدات منفصلة حسب النوع
    for (const success of results.successful) {
      const typeDir = path.join(outputPath, 'processed', success.classification);
      await fs.mkdir(typeDir, { recursive: true });
      
      const fileName = `${success.fileName.replace(/\.[^/.]+$/, '')}_processed.json`;
      const filePath = path.join(typeDir, fileName);
      await fs.writeFile(filePath, JSON.stringify(success, null, 2));
    }

    console.log(`💾 تم حفظ النتائج في: ${outputPath}`);
  }

  private countDocumentTypes(successful: any[]) {
    const counts: Record<string, number> = {};
    successful.forEach(result => {
      counts[result.classification] = (counts[result.classification] || 0) + 1;
    });
    return counts;
  }

  private calculateAverageConfidence(successful: any[]) {
    if (successful.length === 0) return 0;
    const total = successful.reduce((sum, result) => sum + result.confidence, 0);
    return total / successful.length;
  }

  private analyzeChunkDistribution(successful: any[]) {
    const chunks = successful.map(result => result.chunksCount);
    return {
      min: Math.min(...chunks),
      max: Math.max(...chunks),
      average: chunks.reduce((sum, count) => sum + count, 0) / chunks.length,
      total: chunks.reduce((sum, count) => sum + count, 0)
    };
  }

  private calculateProcessingSpeed(results: any) {
    const timeMs = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();
    const docsPerSecond = (results.totalProcessed / (timeMs / 1000)).toFixed(2);
    return `${docsPerSecond} وثيقة/ثانية`;
  }

  private analyzeErrorPatterns(failed: any[]) {
    const patterns: Record<string, number> = {};
    failed.forEach(failure => {
      const errorType = failure.error.split(':')[0] || 'غير محدد';
      patterns[errorType] = (patterns[errorType] || 0) + 1;
    });
    return patterns;
  }
}

// مثال للاستخدام
export async function runProcessingExample() {
  const processor = new DocumentProcessingExample();

  // مثال 1: ملف واحد
  const sampleContent = `
    قانون العمل الجديد
    المادة الأولى: يحق لكل عامل...
    المادة الثانية: تحدد ساعات العمل...
  `;
  
  try {
    await processor.processSingleDocument(sampleContent, 'قانون_العمل.txt');
  } catch (error) {
    console.log('تم تخطي الملف المكرر أو حدث خطأ');
  }

  // مثال 2: مجموعة ملفات
  const batchDocuments: DocumentInput[] = [
    {
      fileName: 'fatwa_001.txt',
      content: 'فتوى رقم 123/2024 حول الشهادات الدراسية...',
      priority: 'high'
    },
    {
      fileName: 'decree_002.txt',
      content: 'مرسوم سلطاني رقم 45/2024 نحن هيثم بن طارق...',
      priority: 'normal'
    }
  ];

  const batchResults = await processor.processBatchDocuments(batchDocuments);
  const analysis = processor.analyzeResults(batchResults);

  console.log('\n🎯 اكتملت المعالجة بنجاح!');
  return { batchResults, analysis };
}

export default DocumentProcessingExample;
