import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Eye, 
  Edit, 
  FileText, 
  Clock,
  Target,
  Hash,
  Database
} from 'lucide-react';

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

interface ProcessingResultsViewProps {
  documents: ProcessedDocument[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onExportResults: () => void;
  onEditChunk?: (docId: string, chunkIndex: number, newContent: string) => void;
}

export function ProcessingResultsView({ 
  documents, 
  selectedDocId, 
  onSelectDocument,
  onExportResults,
  onEditChunk 
}: ProcessingResultsViewProps) {
  const completedDocuments = documents.filter(d => d.status === 'completed');
  const selectedDocument = documents.find(d => d.id === selectedDocId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'duplicate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClassificationColor = (classification: string) => {
    const colors = {
      'laws': 'bg-blue-100 text-blue-800',
      'royal_decrees': 'bg-purple-100 text-purple-800',
      'fatwas': 'bg-green-100 text-green-800',
      'judicial_civil': 'bg-orange-100 text-orange-800',
      'judicial_criminal': 'bg-red-100 text-red-800',
      'regulations': 'bg-indigo-100 text-indigo-800',
      'ministerial_decisions': 'bg-yellow-100 text-yellow-800',
      'royal_orders': 'bg-pink-100 text-pink-800',
      'judicial_principles': 'bg-teal-100 text-teal-800',
      'indexes': 'bg-cyan-100 text-cyan-800',
      'templates': 'bg-lime-100 text-lime-800',
      'others': 'bg-gray-100 text-gray-800'
    };
    return colors[classification as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Results List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">النتائج ({completedDocuments.length})</CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onExportResults}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      selectedDocId === doc.id 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    <div className="space-y-2">
                      {/* File name and status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium truncate text-sm">
                            {doc.file.name}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(doc.status)}`}
                        >
                          {doc.statusMessage}
                        </Badge>
                      </div>

                      {/* Classification and confidence */}
                      {doc.classification && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getClassificationColor(doc.classification)}`}
                          >
                            {doc.classification}
                          </Badge>
                          {doc.confidence && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {(doc.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Processing time and chunks */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {doc.processingTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{(doc.processingTime / 1000).toFixed(1)}s</span>
                          </div>
                        )}
                        {doc.chunks && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>{doc.chunks.length} مقطع</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد مستندات للعرض</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Document Details */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              تفاصيل المستند
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDocument ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">اسم الملف</p>
                      <p className="text-sm break-words">{selectedDocument.file.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">حجم الملف</p>
                      <p className="text-sm">{(selectedDocument.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {selectedDocument.contentHash && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">بصمة المحتوى</p>
                        <p className="text-xs font-mono break-all">
                          {selectedDocument.contentHash.substring(0, 16)}...
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedDocument.classification && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">نوع المستند</p>
                        <Badge className={getClassificationColor(selectedDocument.classification)}>
                          {selectedDocument.classification}
                        </Badge>
                      </div>
                    )}
                    {selectedDocument.confidence && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">مستوى الثقة</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${selectedDocument.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {(selectedDocument.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedDocument.processingTime && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">وقت المعالجة</p>
                        <p className="text-sm">{(selectedDocument.processingTime / 1000).toFixed(2)} ثانية</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                {selectedDocument.metadata && Object.keys(selectedDocument.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">البيانات الوصفية</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(selectedDocument.metadata).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {key}
                            </span>
                            <span className="text-sm mt-1">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chunks */}
                {selectedDocument.chunks && selectedDocument.chunks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium">
                        مقاطع المحتوى ({selectedDocument.chunks.length})
                      </h3>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Database className="h-4 w-4" />
                        حفظ في قاعدة البيانات
                      </Button>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {selectedDocument.chunks.map((chunk, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                مقطع {index + 1}
                              </span>
                              {onEditChunk && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="gap-2"
                                  onClick={() => {
                                    const newContent = prompt('تحرير المقطع:', chunk);
                                    if (newContent && newContent !== chunk) {
                                      onEditChunk(selectedDocument.id, index, newContent);
                                    }
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                  تحرير
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {chunk}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Errors */}
                {selectedDocument.errors && selectedDocument.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-red-600">الأخطاء</h3>
                    <div className="space-y-2">
                      {selectedDocument.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">اختر مستنداً لعرض التفاصيل</p>
                <p className="text-sm">
                  انقر على أحد المستندات في القائمة لعرض تفاصيله ومقاطع المحتوى
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
