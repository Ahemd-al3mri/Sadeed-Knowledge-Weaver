'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DocumentProcessingManager, 
  DocumentInput, 
  ProcessingProgress, 
  ProcessingResults 
} from '@/ai/flows/document-processing-manager';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

export default function DocumentProcessingDashboard() {
  const [manager] = useState(() => new DocumentProcessingManager(onProgressUpdate));
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function onProgressUpdate(newProgress: ProcessingProgress) {
    setProgress(newProgress);
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  }, []);

  const processFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setResults(null);

    try {
      // Convert files to DocumentInput format
      const documents: DocumentInput[] = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await file.text();
          return {
            fileName: file.name,
            content,
            priority: 'normal' as const
          };
        })
      );

      // Add to queue and process
      await manager.addDocumentsToQueue(documents);
      const processingResults = await manager.processQueue();
      setResults(processingResults);

    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, manager]);

  const clearAll = useCallback(() => {
    manager.clearQueue();
    setSelectedFiles([]);
    setResults(null);
    setProgress(null);
  }, [manager]);

  const recommendations = manager.getProcessingRecommendations();

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">لوحة معالجة الوثائق القانونية</h1>
        <p className="text-muted-foreground">
          نظام ذكي لتصنيف ومعالجة الوثائق القانونية العربية
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع الملفات
          </CardTitle>
          <CardDescription>
            اختر الملفات النصية للوثائق القانونية لمعالجتها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">انقر لاختيار الملفات</p>
              <p className="text-sm text-muted-foreground">
                أو اسحب الملفات هنا
              </p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">الملفات المحددة ({selectedFiles.length}):</h3>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{file.name}</span>
                    <Badge variant="secondary">
                      {(file.size / 1024).toFixed(1)} كب
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={processFiles} 
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                'بدء المعالجة'
              )}
            </Button>
            <Button variant="outline" onClick={clearAll}>
              مسح الكل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <Alert key={index} variant={rec.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{rec.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Progress Section */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>حالة المعالجة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم الكلي</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
                <div className="text-sm text-muted-foreground">مكتمل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{progress.processing}</div>
                <div className="text-sm text-muted-foreground">قيد المعالجة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{progress.pending}</div>
                <div className="text-sm text-muted-foreground">في الانتظار</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                <div className="text-sm text-muted-foreground">فشل</div>
              </div>
            </div>

            {progress.currentJob && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">المعالجة الحالية:</div>
                <div className="text-sm text-muted-foreground">
                  {progress.currentJob.input.fileName}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              الوقت المتبقي التقديري: {progress.estimatedTimeRemaining}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج المعالجة</CardTitle>
            <CardDescription>
              تمت معالجة {results.totalProcessed} ملف بنجاح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="successful" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="successful" className="text-green-600">
                  ناجح ({results.successful.length})
                </TabsTrigger>
                <TabsTrigger value="failed" className="text-red-600">
                  فشل ({results.failed.length})
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="text-yellow-600">
                  مكرر ({results.duplicates.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="successful" className="space-y-4">
                <ScrollArea className="h-64">
                  {results.successful.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-sm text-muted-foreground">
                            نوع: {result.classification} | 
                            ثقة: {(result.confidence * 100).toFixed(1)}% |
                            قطع: {result.chunksCount}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">تم</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="failed" className="space-y-4">
                <ScrollArea className="h-64">
                  {results.failed.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-sm text-red-600">{result.error}</div>
                        </div>
                      </div>
                      <Badge variant="destructive">خطأ</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="duplicates" className="space-y-4">
                <ScrollArea className="h-64">
                  {results.duplicates.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-sm text-muted-foreground">{result.reason}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">مكرر</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
