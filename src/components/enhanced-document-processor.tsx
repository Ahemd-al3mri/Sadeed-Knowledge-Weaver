"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  Eye,
  Copy,
  Trash2,
  Download
} from 'lucide-react';
import { IntelligentDocumentProcessor } from '@/ai/flows/intelligent-document-processor';
import { AnalyticsDashboard } from './analytics-dashboard';
import { ProcessingResultsView } from './processing-results-view';
import { ProcessingProgressView } from './processing-progress-view';
import { calculateAnalytics } from '@/lib/analytics';

export interface ProcessedDocument {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  statusMessage: string;
  classification?: string;
  confidence?: number;
  chunks?: string[];
  metadata?: Record<string, any>;
  processingTime?: number;
  errors?: string[];
}

export function EnhancedDocumentProcessor() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  // Calculate processing statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const completed = documents.filter(d => d.status === 'completed').length;
    const failed = documents.filter(d => d.status === 'error').length;
    const processing = documents.filter(d => d.status === 'processing').length;
    return { total, completed, failed, processing };
  }, [documents]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newDocs: ProcessedDocument[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      statusMessage: 'جاهز للمعالجة'
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    
    if (newDocs.length > 0) {
      setActiveTab('processing');
      if (!selectedDocId) {
        setSelectedDocId(newDocs[0].id);
      }
    }

    toast({
      title: "تم رفع الملفات",
      description: `تم إضافة ${newDocs.length} ملف للمعالجة.`
    });
  }, [selectedDocId, toast]);

  const processDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const startTime = Date.now();
    
    setDocuments(prev => prev.map(d => 
      d.id === docId ? { 
        ...d, 
        status: 'processing', 
        statusMessage: 'جاري المعالجة...' 
      } : d
    ));

    try {
      // Convert file to data URI for OCR processing
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(doc.file);
      });

      // First, perform OCR if this is an image or PDF
      let extractedText = '';
      const fileType = doc.file.type;
      
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        // Import OCR function dynamically to avoid server-side issues
        const { runOcr } = await import('@/lib/actions');
        
        setDocuments(prev => prev.map(d => 
          d.id === docId ? { 
            ...d, 
            statusMessage: 'جاري استخراج النص من المستند...' 
          } : d
        ));
        
        const ocrResult = await runOcr(dataUri);
        extractedText = ocrResult.extractedText;
        
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('لم يتم استخراج نص كافٍ من المستند. يرجى التأكد من جودة الصورة أو الملف.');
        }
      } else {
        // For text files, read as text
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(doc.file);
        });
      }

      setDocuments(prev => prev.map(d => 
        d.id === docId ? { 
          ...d, 
          statusMessage: 'جاري تصنيف ومعالجة المستند...' 
        } : d
      ));

      // Step 1: Identify document type
      const { runDocTypeIdentification, runMetadataExtraction, runChunking } = await import('@/lib/actions');
      
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { 
          ...d, 
          statusMessage: 'جاري تحديد نوع المستند...' 
        } : d
      ));
      
      const docTypeResult = await runDocTypeIdentification(extractedText);
      
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { 
          ...d, 
          statusMessage: 'جاري استخراج البيانات الوصفية...' 
        } : d
      ));
      
      // Step 2: Extract metadata
      const metadataResult = await runMetadataExtraction(extractedText);
      
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { 
          ...d, 
          statusMessage: 'جاري تقسيم المستند إلى أجزاء...' 
        } : d
      ));
      
      // Step 3: Intelligent chunking using our improved flow
      const chunks = await runChunking(extractedText, docTypeResult.documentType);
      
      console.log('UI: Chunking completed');
      console.log('UI: Chunks count:', chunks.length);
      console.log('UI: Sample chunk length:', chunks[0]?.length || 0);

      const processingTime = Date.now() - startTime;

      setDocuments(prev => prev.map(d =>
        d.id === docId ? {
          ...d,
          status: 'completed',
          statusMessage: 'اكتملت المعالجة بنجاح',
          classification: docTypeResult.documentType,
          confidence: docTypeResult.confidence,
          chunks: chunks,
          metadata: {
            ...metadataResult,
            processingTime,
            ocrConfidence: 0.95,
            chunksCount: chunks.length
          },
          processingTime
        } : d
      ));

      toast({
        title: "نجحت المعالجة",
        description: `تم معالجة المستند كـ ${docTypeResult.documentType} مع ${chunks.length} جزء`
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      setDocuments(prev => prev.map(d =>
        d.id === docId ? {
          ...d,
          status: 'error',
          statusMessage: 'فشلت المعالجة',
          processingTime,
          errors: [error instanceof Error ? error.message : 'خطأ غير معروف']
        } : d
      ));

      toast({
        variant: "destructive",
        title: "فشلت المعالجة",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    }
  }, [documents, toast]);

  const processAllDocuments = useCallback(async () => {
    const pendingDocs = documents.filter(d => d.status === 'pending');
    if (pendingDocs.length === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد مستندات",
        description: "لا توجد مستندات جاهزة للمعالجة."
      });
      return;
    }

    setIsProcessing(true);
    
    for (const doc of pendingDocs) {
      await processDocument(doc.id);
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
    setActiveTab('results');
  }, [documents, processDocument, toast]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (selectedDocId === docId) {
      setSelectedDocId(null);
    }
  }, [selectedDocId]);

  const selectedDocument = useMemo(() => 
    documents.find(d => d.id === selectedDocId), 
    [documents, selectedDocId]
  );

  const StatusIcon = ({ status }: { status: ProcessedDocument['status'] }) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">معالج المستندات الذكي</h1>
        <div className="flex gap-2">
          <Button
            onClick={processAllDocuments}
            disabled={isProcessing || stats.total === 0}
            className="gap-2"
          >
            {isProcessing ? 'جاري المعالجة...' : 'معالجة الكل'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير النتائج
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">مكتملة</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">فاشلة</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sm text-muted-foreground">قيد المعالجة</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">رفع الملفات</TabsTrigger>
          <TabsTrigger value="processing">المعالجة</TabsTrigger>
          <TabsTrigger value="results">النتائج</TabsTrigger>
          <TabsTrigger value="analytics">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رفع المستندات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg mb-2">اسحب الملفات هنا أو انقر لاختيارها</p>
                <p className="text-sm text-muted-foreground mb-4">
                  يدعم ملفات PDF, DOC, DOCX, TXT
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    اختيار الملفات
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <ProcessingProgressView
            documents={documents}
            isProcessing={isProcessing}
            onProcessAll={processAllDocuments}
            onProcessSingle={processDocument}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <ProcessingResultsView
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={setSelectedDocId}
            onExportResults={() => {
              const completedDocs = documents.filter(d => d.status === 'completed');
              const dataStr = JSON.stringify(completedDocs, null, 2);
              const dataBlob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.download = 'processing-results.json';
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            onEditChunk={(docId, chunkIndex, newContent) => {
              setDocuments(prev => prev.map(doc => 
                doc.id === docId && doc.chunks
                  ? { 
                      ...doc, 
                      chunks: doc.chunks.map((chunk, idx) => 
                        idx === chunkIndex ? newContent : chunk
                      )
                    }
                  : doc
              ));
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard analytics={calculateAnalytics(documents)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
