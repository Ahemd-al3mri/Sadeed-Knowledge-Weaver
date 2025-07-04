"use client";

import { useState, useMemo, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { runOcr, runDocTypeIdentification, runMetadataExtraction, runChunking, runEmbedding, saveDocumentToVectorDB } from '@/lib/actions';
import type { ProcessedDocument, ProcessingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileText, Loader, CheckCircle2, XCircle, Download, BookText, Tags, Key, Building, PlayCircle, Database } from 'lucide-react';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function Home() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [updatingChunkIndex, setUpdatingChunkIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const selectedDocument = useMemo(() => {
    return documents.find(doc => doc.id === selectedDocId) ?? null;
  }, [documents, selectedDocId]);

  const processDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      // 1. OCR
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'ocr', statusMessage: '...جاري استخراج النص' } : d));
      const dataUri = await fileToDataUri(doc.file);
      const ocrResult = await runOcr(dataUri);
      const extractedText = ocrResult.extractedText;
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, extractedText } : d));

      // 2. Identification
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'identification', statusMessage: '...جاري تحديد نوع المستند' } : d));
      const idResult = await runDocTypeIdentification(extractedText);
      const { documentType, confidence } = idResult;
      
      // 3. Metadata Extraction
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'metadata', statusMessage: '...جاري استخراج البيانات الوصفية' } : d));
      const extractedMetadata = await runMetadataExtraction(extractedText);

      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        identifiedType: documentType,
        typeConfidence: confidence,
        metadata: {
          ...d.metadata,
          namespace: documentType || 'غير مصنف',
          title: extractedMetadata.title || '',
          articleNumber: extractedMetadata.articleNumber || '',
          date: extractedMetadata.date || '',
          section: extractedMetadata.section || '',
          issuedBy: extractedMetadata.issuedBy || '',
          keywords: extractedMetadata.keywords || [],
        }
      } : d));

      // 4. Chunking
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'chunking', statusMessage: '...جاري تقطيع المحتوى' } : d));
      const chunks = await runChunking(extractedText, documentType);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, chunks } : d));

      // 5. Embedding
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'embedding', statusMessage: '...جاري إنشاء التضمينات' } : d));
      const embeddings = await runEmbedding(chunks);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, embeddings, status: 'completed', statusMessage: 'اكتملت المعالجة.' } : d));

    } catch (error) {
      console.error('Processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error', statusMessage: errorMessage } : d));
    }
  }, [documents]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newDocs: ProcessedDocument[] = Array.from(files).map(file => ({
      id: uuidv4(),
      file,
      status: 'pending',
      statusMessage: 'جاهز للمعالجة',
      metadata: { namespace: 'laws', articleNumber: '', date: '', title: '', section: '', issuedBy: '', keywords: [] },
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    if (newDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(newDocs[0].id);
    }
  };
  
  const handleDragEvents = (e: DragEvent<HTMLElement>, drag: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(drag);
  }

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleMetadataChange = (id: string, field: keyof ProcessedDocument['metadata'], value: string | string[]) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, metadata: { ...doc.metadata, [field]: value } } : doc
    ));
  };

  const handleChunkBlur = useCallback(async (docId: string, chunkIndex: number, newText: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.chunks || !doc.embeddings) return;

    if (doc.chunks[chunkIndex] === newText) {
      return;
    }

    setUpdatingChunkIndex(chunkIndex);

    try {
      const newChunks = [...doc.chunks];
      newChunks[chunkIndex] = newText;
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, chunks: newChunks } : d));

      const newEmbeddingsArray = await runEmbedding([newText]);
      if (!newEmbeddingsArray || newEmbeddingsArray.length === 0) {
        throw new Error('Failed to generate new embedding.');
      }
      const newEmbedding = newEmbeddingsArray[0];
      
      setDocuments(prev => prev.map(d => {
        if (d.id === docId && d.embeddings) {
          const updatedEmbeddings = [...d.embeddings];
          updatedEmbeddings[chunkIndex] = newEmbedding;
          return { ...d, embeddings: updatedEmbeddings };
        }
        return d;
      }));

      toast({
        title: "نجاح",
        description: `تم تحديث وحدة المعرفة #${chunkIndex + 1} بنجاح.`,
      });

    } catch (error) {
      console.error('Failed to update chunk:', error);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, chunks: doc.chunks } : d));
      toast({
        variant: "destructive",
        title: "فشل التحديث",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setUpdatingChunkIndex(null);
    }
  }, [documents, toast]);


  const handleFinalize = async () => {
    const completedDocs = documents.filter(doc => doc.status === 'completed');
    if (completedDocs.length === 0) {
      toast({
        variant: "destructive",
        title: "لا يوجد شيء للحفظ",
        description: "الرجاء معالجة مستند واحد على الأقل بنجاح.",
      });
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      // Save all completed documents to Pinecone
      for (const doc of completedDocs) {
        await saveDocumentToVectorDB(doc);
        savedCount++;
      }

      toast({
        title: "نجح الحفظ في قاعدة البيانات",
        description: `تم حفظ ${savedCount} مستند في قاعدة البيانات بنجاح.`,
      });

      // Now, trigger the JSON export for personal backup
      const pineconeData = completedDocs.flatMap(doc => 
        doc.chunks?.map((chunk, index) => ({
          id: `${doc.id}-${index}`,
          values: doc.embeddings ? doc.embeddings[index] : [],
          metadata: {
            text: chunk,
            source: doc.file.name,
            ...doc.metadata
          }
        })) ?? []
      );

      const dataStr = JSON.stringify(pineconeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.download = 'sadeed_export.json';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "نجح التصدير",
        description: `تم تصدير ${completedDocs.length} مستند بنجاح إلى sadeed_export.json.`,
      });

    } catch (error) {
       toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const StatusIcon = ({ status }: { status: ProcessingStatus }) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'ocr':
      case 'identification':
      case 'metadata':
      case 'chunking':
      case 'embedding':
        return <Loader className="h-4 w-4 animate-spin text-primary" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };
  
  const renderContent = () => {
    if (!selectedDocument) {
      return (
        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
          <FileText className="w-16 h-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold font-headline">اختر مستند</h2>
          <p className="text-muted-foreground">اختر مستندًا من القائمة لعرض تفاصيله.</p>
        </div>
      );
    }

    let content;
    switch (selectedDocument.status) {
      case 'pending':
        content = (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <p className="text-lg font-medium mb-4">هذا المستند جاهز للمعالجة.</p>
            <p className="text-muted-foreground mb-6">انقر على الزر أدناه لبدء تحليل المحتوى واستخراج البيانات.</p>
            <Button size="lg" onClick={() => processDocument(selectedDocument.id)}>
              <PlayCircle className="ml-2 h-5 w-5" />
              بدء معالجة المستند
            </Button>
          </div>
        );
        break;
      case 'ocr':
      case 'identification':
      case 'metadata':
      case 'chunking':
      case 'embedding':
        content = (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">...جاري معالجة المستند</p>
            <p className="text-muted-foreground">{selectedDocument.statusMessage}</p>
          </div>
        );
        break;
      case 'error':
        content = (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full text-destructive">
            <XCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">حدث خطأ</p>
            <p className="text-sm">{selectedDocument.statusMessage}</p>
          </div>
        );
        break;
      case 'completed':
        content = (
          <Accordion type="single" collapsible defaultValue="metadata">
            <AccordionItem value="metadata">
              <AccordionTrigger className="font-headline"><Tags className="ml-2"/>البيانات الوصفية</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namespace">فئة المستند</Label>
                    <Select
                      value={selectedDocument.metadata.namespace}
                      onValueChange={(value) => handleMetadataChange(selectedDocument.id, 'namespace', value)}
                    >
                      <SelectTrigger id="namespace"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laws">قوانين</SelectItem>
                        <SelectItem value="decrees">مراسيم</SelectItem>
                        <SelectItem value="regulations">لوائح</SelectItem>
                        <SelectItem value="contracts">عقود</SelectItem>
                        <SelectItem value="judgments">أحكام</SelectItem>
                        <SelectItem value="Uncategorized">غير مصنف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="doc-number">رقم المادة/المستند</Label>
                    <Input
                      id="doc-number"
                      placeholder="مثال: قانون رقم 123"
                      value={selectedDocument.metadata.articleNumber}
                      onChange={(e) => handleMetadataChange(selectedDocument.id, 'articleNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-title">العنوان</Label>
                  <Input
                    id="doc-title"
                    placeholder="عنوان المستند"
                    value={selectedDocument.metadata.title}
                    onChange={(e) => handleMetadataChange(selectedDocument.id, 'title', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-section">القسم</Label>
                    <Input
                      id="doc-section"
                      placeholder="القسم أو الباب"
                      value={selectedDocument.metadata.section}
                      onChange={(e) => handleMetadataChange(selectedDocument.id, 'section', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-date">التاريخ</Label>
                    <Input
                      id="doc-date"
                      type="date"
                      value={selectedDocument.metadata.date}
                      onChange={(e) => handleMetadataChange(selectedDocument.id, 'date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-issuedBy">جهة الإصدار</Label>
                  <Input
                    id="doc-issuedBy"
                    placeholder="مثال: وزارة العدل"
                    value={selectedDocument.metadata.issuedBy}
                    onChange={(e) => handleMetadataChange(selectedDocument.id, 'issuedBy', e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label><Key className="inline-block ml-1 h-4 w-4" />الكلمات المفتاحية</Label>
                   <div className="flex flex-wrap gap-2 pt-2">
                    {selectedDocument.metadata.keywords.length > 0 ? selectedDocument.metadata.keywords.map((kw, i) => (
                       <Badge key={i} variant="secondary">{kw}</Badge>
                    )) : <p className="text-sm text-muted-foreground">لا توجد كلمات مفتاحية.</p>}
                   </div>
                 </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="chunks">
              <AccordionTrigger className="font-headline"><BookText className="ml-2"/>وحدات المعرفة ({selectedDocument.chunks?.length || 0})</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-80 mt-2 p-3 border rounded-md bg-muted/50">
                  {selectedDocument.chunks?.map((chunk, index) => (
                    <div key={index} className="p-3 mb-2 bg-background rounded-md shadow-sm relative group">
                      <Label htmlFor={`chunk-${index}`} className="text-xs text-muted-foreground">وحدة المعرفة #{index + 1}</Label>
                      <Textarea
                        id={`chunk-${index}`}
                        defaultValue={chunk}
                        onBlur={(e) => handleChunkBlur(selectedDocument.id, index, e.target.value)}
                        disabled={updatingChunkIndex !== null}
                        className="w-full mt-1 min-h-[100px] leading-relaxed bg-background disabled:opacity-80 disabled:cursor-not-allowed"
                      />
                      {updatingChunkIndex === index && (
                        <div className="absolute top-4 right-4 flex items-center justify-center bg-background/80 w-[calc(100%-2rem)] h-[calc(100%-2rem)]">
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Loader className="h-4 w-4 animate-spin" />
                            ...جاري تحديث التضمين
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
        break;
      default:
        content = null;
    }

    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline truncate flex items-center gap-2"><FileText className="w-6 h-6"/>{selectedDocument.file.name}</CardTitle>
          <CardDescription>
            {selectedDocument.status === 'completed' && selectedDocument.identifiedType && (
              <Badge variant="secondary">النوع: {selectedDocument.identifiedType} (بثقة {(selectedDocument.typeConfidence! * 100).toFixed(0)}%)</Badge>
            )}
            {selectedDocument.status === 'pending' && <Badge variant="outline">في انتظار المعالجة</Badge>}
            {['error', 'ocr', 'identification', 'metadata', 'chunking', 'embedding'].includes(selectedDocument.status) && <Badge variant="destructive">{selectedDocument.statusMessage}</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {content}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 border-b bg-card">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold font-headline">أداة بناء المعرفة من سديد</h1>
        </div>
        <Button onClick={handleFinalize} disabled={isSaving || documents.every(d => d.status !== 'completed')}>
          {isSaving ? <Loader className="ml-2 h-4 w-4 animate-spin" /> : <Database className="ml-2 h-4 w-4" />}
          تأكيد وإرسال للقاعدة
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">رفع المستندات</CardTitle>
                <CardDescription>رفع ملفات PDF أو صور للمعالجة.</CardDescription>
              </CardHeader>
              <CardContent>
                <label
                  htmlFor="file-upload"
                  onDragOver={(e) => handleDragEvents(e, true)}
                  onDragLeave={(e) => handleDragEvents(e, false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">انقر للرفع</span> أو اسحب وأفلت
                    </p>
                    <p className="text-xs text-muted-foreground">ملفات PDF, PNG, JPG</p>
                  </div>
                  <Input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.png,.jpeg,.jpg" onChange={(e) => handleFileChange(e.target.files)} />
                </label>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">قائمة المستندات</CardTitle>
                <CardDescription>قائمة المستندات قيد المعالجة.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <div className="space-y-2 pl-4">
                    {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لم يتم رفع أي مستندات.</p>}
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={cn(
                          "w-full text-right p-3 rounded-lg border transition-colors",
                          selectedDocId === doc.id ? "bg-primary/10 border-primary" : "hover:bg-accent/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate text-sm">{doc.file.name}</p>
                          <StatusIcon status={doc.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">{doc.statusMessage}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}