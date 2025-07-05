import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Eye, 
  Target, 
  Scissors, 
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Loader
} from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  details?: string;
}

interface ProcessingProgress {
  currentStep: number;
  totalSteps: number;
  steps: ProcessingStep[];
  overallProgress: number;
}

interface ProcessingProgressViewProps {
  documents: Array<{
    id: string;
    file: File;
    status: string;
    statusMessage: string;
    classification?: string;
    confidence?: number;
  }>;
  isProcessing: boolean;
  onProcessAll: () => void;
  onProcessSingle: (docId: string) => void;
}

export function ProcessingProgressView({
  documents,
  isProcessing,
  onProcessAll,
  onProcessSingle
}: ProcessingProgressViewProps) {
  
  const pendingDocs = documents.filter(d => d.status === 'pending');
  const processingDocs = documents.filter(d => d.status === 'processing');
  const completedDocs = documents.filter(d => d.status === 'completed');
  const errorDocs = documents.filter(d => d.status === 'error');
  
  const overallProgress = documents.length > 0 
    ? ((completedDocs.length + errorDocs.length) / documents.length) * 100 
    : 0;

  const getProcessingSteps = (): ProcessingStep[] => [
    {
      id: 'ocr',
      name: 'استخراج النص (OCR)',
      icon: <Eye className="h-4 w-4" />,
      status: 'pending',
      details: 'تحويل الصور والملفات إلى نص قابل للقراءة'
    },
    {
      id: 'classification',
      name: 'تصنيف المستند',
      icon: <Target className="h-4 w-4" />,
      status: 'pending',
      details: 'تحديد نوع المستند والثقة في التصنيف'
    },
    {
      id: 'metadata',
      name: 'استخراج البيانات الوصفية',
      icon: <FileText className="h-4 w-4" />,
      status: 'pending',
      details: 'استخراج المعلومات المهمة حسب نوع المستند'
    },
    {
      id: 'chunking',
      name: 'تقطيع المحتوى',
      icon: <Scissors className="h-4 w-4" />,
      status: 'pending',
      details: 'تقسيم المستند إلى مقاطع منطقية'
    },
    {
      id: 'embedding',
      name: 'إنشاء التضمينات',
      icon: <Database className="h-4 w-4" />,
      status: 'pending',
      details: 'تحويل النص إلى متجهات للبحث الدلالي'
    }
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <div className="h-2 w-2 bg-gray-300 rounded-full" />;
      case 'processing':
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-2 w-2 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>التقدم الإجمالي</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={onProcessAll}
                disabled={isProcessing || pendingDocs.length === 0}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  `معالجة الكل (${pendingDocs.length})`
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {completedDocs.length + errorDocs.length} من {documents.length} مكتمل
              </span>
              <span className="text-sm text-muted-foreground">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{pendingDocs.length}</p>
                <p className="text-sm text-blue-600">في الانتظار</p>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{processingDocs.length}</p>
                <p className="text-sm text-yellow-600">قيد المعالجة</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedDocs.length}</p>
                <p className="text-sm text-green-600">مكتملة</p>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{errorDocs.length}</p>
                <p className="text-sm text-red-600">فاشلة</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      <Card>
        <CardHeader>
          <CardTitle>مراحل المعالجة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getProcessingSteps().map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{step.name}</h3>
                    <Badge variant="outline">المرحلة {index + 1}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">~30s</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Queue */}
      <Card>
        <CardHeader>
          <CardTitle>طابور المعالجة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={doc.status} />
                  <div>
                    <p className="font-medium text-sm">{doc.file.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.statusMessage}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {doc.classification && (
                    <Badge variant="secondary" className="text-xs">
                      {doc.classification}
                    </Badge>
                  )}
                  {doc.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {(doc.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                  {doc.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onProcessSingle(doc.id)}
                      disabled={isProcessing}
                    >
                      معالجة
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مستندات للمعالجة</p>
                <p className="text-sm">ارفع ملفات من تبويب "رفع الملفات"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
