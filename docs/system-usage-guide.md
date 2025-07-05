# نظام معالجة الوثائق القانونية العربية

## نظرة عامة

نظام ذكي ومتطور لتصنيف ومعالجة الوثائق القانونية العربية، مصمم خصيصاً للتعامل مع أنواع مختلفة من الوثائق القانونية في سلطنة عمان وغيرها من الدول العربية.

## الميزات الرئيسية ✨

### 🎯 **تصنيف ذكي**
- يدعم **12 نوع** من الوثائق القانونية
- تصنيف تلقائي باستخدام أنماط متخصصة
- مستوى ثقة قابل للتحقق

### 🔧 **معالجة مخصصة**
- معالج مخصص لكل نوع وثيقة
- استخراج البيانات الوصفية تلقائياً
- تقسيم ذكي حسب بنية الوثيقة

### 🛡️ **جودة البيانات**
- كشف الملفات المكررة باستخدام SHA-256
- تنظيف وتطهير النصوص تلقائياً
- التحقق من صحة البيانات المستخرجة

### 📊 **مراقبة وتتبع**
- واجهة مستخدم تفاعلية
- مراقبة التقدم في الوقت الفعلي
- تقارير مفصلة للنتائج

## أنواع الوثائق المدعومة 📋

| النوع | الوصف | أمثلة |
|-------|-------|--------|
| `laws` | القوانين | قانون العمل، قانون الجزاء |
| `royal_decrees` | المراسيم السلطانية | مراسيم إصدار القوانين |
| `regulations` | اللوائح التنفيذية | لوائح تطبيق القوانين |
| `ministerial_decisions` | القرارات الوزارية | قرارات تنفيذية |
| `royal_orders` | الأوامر السامية | أوامر التعيين والمنح |
| `fatwas` | الفتاوى القانونية | فتاوى وزارة العدل |
| `judicial_principles` | المبادئ القضائية | مبادئ المحكمة العليا |
| `judicial_criminal` | الأحكام الجزائية | أحكام المحاكم الجزائية |
| `judicial_civil` | الأحكام المدنية | أحكام المحاكم المدنية |
| `indexes` | الفهارس | فهارس المبادئ والأحكام |
| `templates` | النماذج | نماذج العقود والتوكيلات |
| `others` | أخرى | وثائق غير مصنفة |

## التثبيت والإعداد ⚙️

### المتطلبات
```bash
- Node.js 18+
- TypeScript 5+
- React 18+ (للواجهة)
```

### تثبيت التبعيات
```bash
npm install
# أو
yarn install
```

### إعداد المشروع
```bash
# إنشاء مجلدات البيانات
mkdir -p data/processed data/hashes

# تشغيل النظام
npm run dev
```

## الاستخدام السريع 🚀

### 1. معالجة ملف واحد

```typescript
import { IntelligentDocumentProcessor } from './flows/intelligent-document-processor';

async function processDocument() {
  const content = `
    قانون العمل الجديد
    المادة الأولى: يحق لكل عامل...
    المادة الثانية: تحدد ساعات العمل...
  `;
  
  const existingHashes = new Set<string>();
  
  try {
    const result = await IntelligentDocumentProcessor.processDocument(
      content, 
      existingHashes
    );
    
    console.log('نوع الوثيقة:', result.classification);
    console.log('مستوى الثقة:', result.confidence);
    console.log('عدد القطع:', result.chunks.length);
    
  } catch (error) {
    console.error('خطأ في المعالجة:', error);
  }
}
```

### 2. معالجة مجموعة ملفات

```typescript
import { DocumentProcessingManager } from './flows/document-processing-manager';

async function processBatch() {
  const manager = new DocumentProcessingManager((progress) => {
    console.log(`التقدم: ${progress.percentage}%`);
  });

  const documents = [
    {
      fileName: 'law_001.txt',
      content: 'محتوى القانون...',
      priority: 'high' as const
    },
    {
      fileName: 'fatwa_002.txt', 
      content: 'محتوى الفتوى...',
      priority: 'normal' as const
    }
  ];

  try {
    await manager.addDocumentsToQueue(documents);
    const results = await manager.processQueue();
    
    console.log('ناجح:', results.successful.length);
    console.log('فشل:', results.failed.length);
    console.log('مكرر:', results.duplicates.length);
    
  } catch (error) {
    console.error('خطأ في المعالجة:', error);
  }
}
```

### 3. استخدام الواجهة المرئية

```typescript
// في React Component
import DocumentProcessingDashboard from './app/processing/page';

function App() {
  return (
    <div>
      <DocumentProcessingDashboard />
    </div>
  );
}
```

## التخصيص والإعدادات ⚡

### إنشاء إعدادات مخصصة

```typescript
import { ConfigManager, createCustomConfig } from './flows/processing-config';

// استخدام الإعدادات الافتراضية
const defaultConfig = new ConfigManager();

// أو إنشاء إعدادات مخصصة
const customConfig = createCustomConfig();

// تحديث إعدادات معينة
customConfig.updateConfig({
  general: {
    batchSize: 200,
    maxConcurrentJobs: 15
  },
  quality: {
    minOcrConfidence: 0.95
  }
});
```

### تخصيص معالجة نوع وثيقة

```typescript
const config = new ConfigManager({
  documentTypes: {
    laws: {
      enabled: true,
      priority: 'high',
      customPatterns: ['قانون خاص', 'تعديل قانون'],
      chunkingStrategy: {
        type: 'article',
        splitOnKeywords: ['المادة', 'الباب', 'الفصل'],
        preserveStructure: true,
        includeContext: true
      },
      validationRules: [
        { field: 'law_title', required: true, minLength: 10 },
        { field: 'article_number', required: true, pattern: '^\\d+$' }
      ]
    }
  }
});
```

## أمثلة متقدمة 💡

### معالجة مجلد كامل

```typescript
import DocumentProcessingExample from './flows/processing-examples';

async function processDirectory() {
  const processor = new DocumentProcessingExample();
  
  const results = await processor.processDirectory(
    './documents', // مجلد الملفات
    './output'     // مجلد النتائج
  );
  
  // تحليل النتائج
  const analysis = processor.analyzeResults(results);
  console.log('إحصائيات:', analysis);
}
```

### استئناف معالجة متوقفة

```typescript
async function resumeProcessing() {
  const processor = new DocumentProcessingExample();
  
  const newDocuments = [
    { fileName: 'new_doc.txt', content: '...', priority: 'normal' }
  ];
  
  const results = await processor.resumeProcessing(
    './data/hashes.json', // ملف البصمات المحفوظة
    newDocuments
  );
}
```

## هيكل البيانات المُخرجة 📤

### نتيجة معالجة ملف واحد

```typescript
{
  classification: 'laws',           // نوع الوثيقة
  confidence: 0.95,                // مستوى الثقة
  contentHash: 'abc123...',        // بصمة المحتوى
  chunks: [                        // القطع المستخرجة
    {
      id: 'law_123456_0',
      type: 'laws',
      namespace: 'laws',
      content: 'المادة الأولى...',
      metadata: {
        law_title: 'قانون العمل',
        article_number: '1',
        section: 'الباب الأول',
        // ...
      }
    }
  ],
  metadata: {                      // البيانات الوصفية
    type: 'laws',
    namespace: 'laws', 
    source: 'الجريدة الرسمية',
    language: 'ar',
    verified: true,
    // ...
  },
  processingNotes: [               // ملاحظات المعالجة
    'Document classified as: laws',
    'Confidence: 95.0%',
    // ...
  ]
}
```

### نتائج المعالجة المجمعة

```typescript
{
  successful: [                    // الملفات الناجحة
    {
      jobId: 'job_123',
      fileName: 'law_001.txt',
      classification: 'laws',
      chunksCount: 25,
      confidence: 0.95,
      contentHash: 'abc123...'
    }
  ],
  failed: [                        // الملفات الفاشلة
    {
      jobId: 'job_456',
      fileName: 'corrupted.txt',
      error: 'محتوى الملف غير صالح',
      originalError: 'Invalid content format'
    }
  ],
  duplicates: [                    // الملفات المكررة
    {
      jobId: 'job_789',
      fileName: 'duplicate.txt',
      reason: 'ملف مكرر'
    }
  ],
  totalProcessed: 10,
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T10:05:00Z'
}
```

## أفضل الممارسات 🏆

### 1. إدارة الذاكرة
```typescript
// معالجة الملفات الكبيرة على دفعات صغيرة
const config = new ConfigManager({
  general: {
    batchSize: 25,        // تقليل حجم الدفعة
    maxConcurrentJobs: 3  // تقليل المهام المتزامنة
  }
});
```

### 2. التحقق من الجودة
```typescript
// رفع مستوى الثقة المطلوب للوثائق الحساسة
const config = new ConfigManager({
  quality: {
    minOcrConfidence: 0.95,
    minClassificationConfidence: 0.9,
    enableContentValidation: true
  }
});
```

### 3. النسخ الاحتياطية
```typescript
// تفعيل النسخ الاحتياطية التلقائية
const config = new ConfigManager({
  storage: {
    backupEnabled: true,
    enableCompression: true
  }
});
```

## استكشاف الأخطاء 🔧

### أخطاء شائعة وحلولها

| الخطأ | السبب | الحل |
|-------|--------|------|
| `DuplicateDocumentError` | ملف مكرر | تحقق من البصمات المحفوظة |
| `Low confidence classification` | تصنيف غير واضح | راجع محتوى الملف |
| `Invalid content` | محتوى تالف | تحقق من صحة الملف |
| `Memory limit exceeded` | استنزاف الذاكرة | قلل حجم الدفعة |

### تفعيل التسجيل المفصل
```typescript
const manager = new DocumentProcessingManager((progress) => {
  console.log({
    percentage: progress.percentage,
    completed: progress.completed,
    failed: progress.failed,
    current: progress.currentJob?.input.fileName
  });
});
```

## المساهمة والتطوير 🤝

### إضافة نوع وثيقة جديد

1. إضافة النوع في `DocumentTypeSchema`
2. إضافة أنماط التصنيف في `DocumentClassificationPatterns`
3. إنشاء معالج مخصص جديد
4. إضافة الإعدادات في `DEFAULT_CONFIG`

### تحسين دقة التصنيف

1. تحليل الأخطاء في التصنيف
2. إضافة أنماط جديدة
3. تحسين استخراج الميزات
4. اختبار النماذج المختلفة

## الترخيص والدعم 📝

هذا النظام مفتوح المصدر ومتاح للاستخدام والتطوير. للحصول على الدعم:

- افتح issue في المشروع
- راجع الوثائق المفصلة
- تواصل مع فريق التطوير

---

**تم تطوير هذا النظام بعناية خاصة للتعامل مع الوثائق القانونية العربية وضمان أعلى مستويات الدقة والموثوقية.**
