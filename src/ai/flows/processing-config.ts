/**
 * إعدادات نظام معالجة الوثائق القانونية
 * يمكن تخصيص هذه الإعدادات حسب احتياجات المؤسسة
 */

export interface ProcessingConfig {
  // إعدادات عامة
  general: {
    batchSize: number; // عدد الملفات في كل دفعة
    maxConcurrentJobs: number; // أقصى عدد مهام متزامنة
    timeoutMs: number; // مهلة انتهاء المعالجة (ميلي ثانية)
    retryAttempts: number; // عدد محاولات الإعادة عند الفشل
  };

  // إعدادات جودة المحتوى
  quality: {
    minOcrConfidence: number; // أقل مستوى ثقة مقبول لـ OCR
    minClassificationConfidence: number; // أقل مستوى ثقة للتصنيف
    enableContentValidation: boolean; // تفعيل التحقق من صحة المحتوى
    enableDuplicateDetection: boolean; // تفعيل كشف التكرار
  };

  // إعدادات التقسيم (Chunking)
  chunking: {
    maxChunkSize: number; // أقصى حجم للقطعة (عدد الأحرف)
    minChunkSize: number; // أقل حجم للقطعة
    overlapSize: number; // حجم التداخل بين القطع
    enableSmartSplitting: boolean; // تقسيم ذكي حسب السياق
  };

  // إعدادات التخزين
  storage: {
    enableCompression: boolean; // ضغط البيانات المحفوظة
    backupEnabled: boolean; // إنشاء نسخ احتياطية
    hashStoragePath: string; // مسار حفظ بصمات الملفات
    resultsStoragePath: string; // مسار حفظ النتائج
  };

  // إعدادات الأداء
  performance: {
    enableCaching: boolean; // تفعيل التخزين المؤقت
    cacheSize: number; // حجم التخزين المؤقت (عدد العناصر)
    enableParallelProcessing: boolean; // معالجة متوازية
    memoryLimitMB: number; // حد الذاكرة المستخدمة
  };

  // إعدادات التصنيف حسب نوع الوثيقة
  documentTypes: {
    [key: string]: DocumentTypeConfig;
  };
}

export interface DocumentTypeConfig {
  enabled: boolean; // تفعيل معالجة هذا النوع
  priority: 'high' | 'normal' | 'low'; // أولوية المعالجة
  customPatterns?: string[]; // أنماط إضافية للتصنيف
  chunkingStrategy: ChunkingStrategy; // استراتيجية التقسيم
  metadataFields: string[]; // الحقول المطلوب استخراجها
  validationRules?: ValidationRule[]; // قواعد التحقق
}

export interface ChunkingStrategy {
  type: 'article' | 'section' | 'paragraph' | 'sentence' | 'custom';
  splitOnKeywords?: string[]; // كلمات للتقسيم عليها
  preserveStructure: boolean; // المحافظة على الهيكل
  includeContext: boolean; // تضمين السياق
}

export interface ValidationRule {
  field: string; // اسم الحقل
  required: boolean; // مطلوب
  pattern?: string; // نمط التحقق (regex)
  minLength?: number; // أقل طول
  maxLength?: number; // أقصى طول
}

// الإعدادات الافتراضية
export const DEFAULT_CONFIG: ProcessingConfig = {
  general: {
    batchSize: 50,
    maxConcurrentJobs: 5,
    timeoutMs: 300000, // 5 دقائق
    retryAttempts: 3
  },

  quality: {
    minOcrConfidence: 0.8,
    minClassificationConfidence: 0.7,
    enableContentValidation: true,
    enableDuplicateDetection: true
  },

  chunking: {
    maxChunkSize: 2000,
    minChunkSize: 100,
    overlapSize: 200,
    enableSmartSplitting: true
  },

  storage: {
    enableCompression: true,
    backupEnabled: true,
    hashStoragePath: './data/hashes.json',
    resultsStoragePath: './data/processed'
  },

  performance: {
    enableCaching: true,
    cacheSize: 1000,
    enableParallelProcessing: true,
    memoryLimitMB: 512
  },

  documentTypes: {
    laws: {
      enabled: true,
      priority: 'high',
      chunkingStrategy: {
        type: 'article',
        splitOnKeywords: ['المادة', 'الباب', 'الفصل'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['law_title', 'article_number', 'section', 'date'],
      validationRules: [
        { field: 'law_title', required: true, minLength: 5 },
        { field: 'article_number', required: true, pattern: '^\\d+$' }
      ]
    },

    royal_decrees: {
      enabled: true,
      priority: 'high',
      chunkingStrategy: {
        type: 'section',
        splitOnKeywords: ['مرسوم سلطاني', 'المادة'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['decree_number', 'title', 'date', 'issued_by'],
      validationRules: [
        { field: 'decree_number', required: true, pattern: '^\\d+/\\d+$' },
        { field: 'date', required: true }
      ]
    },

    fatwas: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'custom',
        splitOnKeywords: ['السؤال', 'الجواب', 'الأساس القانوني'],
        preserveStructure: true,
        includeContext: false
      },
      metadataFields: ['fatwa_number', 'question', 'answer', 'legal_basis'],
      validationRules: [
        { field: 'question', required: true, minLength: 10 },
        { field: 'answer', required: true, minLength: 10 }
      ]
    },

    regulations: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'section',
        splitOnKeywords: ['اللائحة', 'المادة', 'الأحكام'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['regulation_title', 'issuing_authority', 'date'],
      validationRules: [
        { field: 'regulation_title', required: true, minLength: 5 }
      ]
    },

    ministerial_decisions: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'article',
        splitOnKeywords: ['قرار', 'المادة'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['decision_number', 'ministry', 'subject', 'date'],
      validationRules: [
        { field: 'decision_number', required: true },
        { field: 'ministry', required: true }
      ]
    },

    royal_orders: {
      enabled: true,
      priority: 'high',
      chunkingStrategy: {
        type: 'custom',
        splitOnKeywords: ['أمر سام', 'منح'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['order_number', 'subject', 'date', 'recipient'],
      validationRules: [
        { field: 'order_number', required: true },
        { field: 'subject', required: true }
      ]
    },

    judicial_principles: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'custom',
        splitOnKeywords: ['مبدأ', 'قضية رقم'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['principle_number', 'case_number', 'court', 'topic'],
      validationRules: [
        { field: 'case_number', required: true },
        { field: 'court', required: true }
      ]
    },

    judicial_criminal: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'section',
        splitOnKeywords: ['حكم', 'التهمة', 'العقوبة'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['judgment_number', 'charge', 'verdict', 'court'],
      validationRules: [
        { field: 'judgment_number', required: true },
        { field: 'charge', required: true }
      ]
    },

    judicial_civil: {
      enabled: true,
      priority: 'normal',
      chunkingStrategy: {
        type: 'section',
        splitOnKeywords: ['حكم', 'دعوى', 'المبدأ'],
        preserveStructure: true,
        includeContext: true
      },
      metadataFields: ['judgment_number', 'case_type', 'verdict', 'court'],
      validationRules: [
        { field: 'judgment_number', required: true },
        { field: 'case_type', required: true }
      ]
    },

    indexes: {
      enabled: true,
      priority: 'low',
      chunkingStrategy: {
        type: 'section',
        splitOnKeywords: ['فهرس', 'الموضوع'],
        preserveStructure: true,
        includeContext: false
      },
      metadataFields: ['index_title', 'year', 'category'],
      validationRules: [
        { field: 'index_title', required: true }
      ]
    },

    templates: {
      enabled: true,
      priority: 'low',
      chunkingStrategy: {
        type: 'custom',
        splitOnKeywords: ['نموذج', 'الصيغة'],
        preserveStructure: true,
        includeContext: false
      },
      metadataFields: ['template_name', 'template_type', 'fields'],
      validationRules: [
        { field: 'template_name', required: true },
        { field: 'template_type', required: true }
      ]
    },

    others: {
      enabled: true,
      priority: 'low',
      chunkingStrategy: {
        type: 'paragraph',
        splitOnKeywords: [],
        preserveStructure: false,
        includeContext: false
      },
      metadataFields: ['title', 'content_type'],
      validationRules: [
        { field: 'title', required: false }
      ]
    }
  }
};

// فئة لإدارة الإعدادات
export class ConfigManager {
  private config: ProcessingConfig;

  constructor(customConfig?: Partial<ProcessingConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, customConfig);
  }

  getConfig(): ProcessingConfig {
    return this.config;
  }

  getDocumentTypeConfig(type: string): DocumentTypeConfig | null {
    return this.config.documentTypes[type] || null;
  }

  updateConfig(updates: Partial<ProcessingConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  isDocumentTypeEnabled(type: string): boolean {
    const typeConfig = this.getDocumentTypeConfig(type);
    return typeConfig?.enabled ?? false;
  }

  getChunkingStrategy(type: string): ChunkingStrategy | null {
    const typeConfig = this.getDocumentTypeConfig(type);
    return typeConfig?.chunkingStrategy || null;
  }

  validateDocument(type: string, metadata: any): ValidationResult {
    const typeConfig = this.getDocumentTypeConfig(type);
    if (!typeConfig?.validationRules) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    typeConfig.validationRules.forEach(rule => {
      const value = metadata[rule.field];

      // التحقق من الحقول المطلوبة
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(`الحقل '${rule.field}' مطلوب`);
        return;
      }

      if (!value) return; // تخطي الحقول الفارغة غير المطلوبة

      const stringValue = value.toString();

      // التحقق من الطول الأدنى
      if (rule.minLength && stringValue.length < rule.minLength) {
        errors.push(`الحقل '${rule.field}' قصير جداً (أقل من ${rule.minLength} أحرف)`);
      }

      // التحقق من الطول الأقصى
      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors.push(`الحقل '${rule.field}' طويل جداً (أكثر من ${rule.maxLength} حرف)`);
      }

      // التحقق من النمط
      if (rule.pattern && !new RegExp(rule.pattern).test(stringValue)) {
        errors.push(`الحقل '${rule.field}' لا يطابق التنسيق المطلوب`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // دمج الإعدادات
  private mergeConfig(base: ProcessingConfig, updates?: Partial<ProcessingConfig>): ProcessingConfig {
    if (!updates) return base;

    return {
      ...base,
      ...updates,
      general: { ...base.general, ...updates.general },
      quality: { ...base.quality, ...updates.quality },
      chunking: { ...base.chunking, ...updates.chunking },
      storage: { ...base.storage, ...updates.storage },
      performance: { ...base.performance, ...updates.performance },
      documentTypes: { ...base.documentTypes, ...updates.documentTypes }
    };
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// مثال للاستخدام
export function createCustomConfig(): ConfigManager {
  // إعدادات مخصصة للمؤسسة
  const customConfig: Partial<ProcessingConfig> = {
    general: {
      ...DEFAULT_CONFIG.general,
      batchSize: 100, // زيادة حجم الدفعة
      maxConcurrentJobs: 10 // زيادة المهام المتزامنة
    },
    quality: {
      ...DEFAULT_CONFIG.quality,
      minOcrConfidence: 0.9, // رفع مستوى الثقة المطلوب
      minClassificationConfidence: 0.8
    },
    documentTypes: {
      laws: {
        ...DEFAULT_CONFIG.documentTypes.laws,
        priority: 'high',
        customPatterns: ['قانون خاص', 'تعديل قانون'] // أنماط إضافية
      }
    }
  };

  return new ConfigManager(customConfig);
}
