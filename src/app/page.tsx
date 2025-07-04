"use client";

import { useState, useMemo, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { runOcr, runDocTypeIdentification, runChunking } from '@/lib/actions';
import type { ProcessedDocument, ProcessingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileText, Loader, CheckCircle2, XCircle, Download, BookText, Tags } from 'lucide-react';

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
  const { toast } = useToast();

  const selectedDocument = useMemo(() => {
    return documents.find(doc => doc.id === selectedDocId) ?? null;
  }, [documents, selectedDocId]);

  const processDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      // 1. OCR
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'ocr', statusMessage: 'Extracting text...' } : d));
      const dataUri = await fileToDataUri(doc.file);
      const ocrResult = await runOcr(dataUri);
      const extractedText = ocrResult.extractedText;
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, extractedText } : d));

      // 2. Identification
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'identification', statusMessage: 'Identifying document type...' } : d));
      const idResult = await runDocTypeIdentification(extractedText);
      const { documentType, confidence } = idResult;
      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        identifiedType: documentType,
        typeConfidence: confidence,
        metadata: { ...d.metadata, namespace: documentType || 'Uncategorized' }
      } : d));

      // 3. Chunking
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'chunking', statusMessage: 'Segmenting content...' } : d));
      const chunks = await runChunking(extractedText, documentType);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, chunks, status: 'completed', statusMessage: 'Processing complete.' } : d));

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
      statusMessage: 'Ready to process',
      metadata: { namespace: 'laws', documentNumber: '', date: '', title: '' },
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    if (newDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(newDocs[0].id);
    }
    newDocs.forEach(doc => processDocument(doc.id));
  };
  
  const handleDragEvents = (e: DragEvent<HTMLDivElement>, drag: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(drag);
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleMetadataChange = (id: string, field: keyof ProcessedDocument['metadata'], value: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, metadata: { ...doc.metadata, [field]: value } } : doc
    ));
  };

  const handleExport = () => {
    const completedDocs = documents.filter(doc => doc.status === 'completed');
    if (completedDocs.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No documents have been processed successfully.",
      });
      return;
    }

    const pineconeData = completedDocs.flatMap(doc => 
      doc.chunks?.map((chunk, index) => ({
        id: `${doc.id}-${index}`,
        values: [],
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
      title: "Export Successful",
      description: `${completedDocs.length} documents exported to sadeed_export.json.`,
    });
  };

  const StatusIcon = ({ status }: { status: ProcessingStatus }) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'ocr':
      case 'identification':
      case 'chunking':
        return <Loader className="h-4 w-4 animate-spin text-primary" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 border-b bg-card">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold font-headline">Sadeed Knowledge Weaver</h1>
        </div>
        <Button onClick={handleExport} disabled={documents.every(d => d.status !== 'completed')}>
          <Download className="mr-2 h-4 w-4" />
          Export to JSON
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Upload Documents</CardTitle>
                <CardDescription>Upload PDF files for processing.</CardDescription>
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
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF files only</p>
                  </div>
                  <Input id="file-upload" type="file" className="hidden" multiple accept=".pdf" onChange={(e) => handleFileChange(e.target.files)} />
                </label>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">Document Queue</CardTitle>
                <CardDescription>List of documents being processed.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <div className="space-y-2 pr-4">
                    {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded.</p>}
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
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
            {selectedDocument ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="font-headline truncate flex items-center gap-2"><FileText className="w-6 h-6"/>{selectedDocument.file.name}</CardTitle>
                  <CardDescription>
                    {selectedDocument.identifiedType && (
                      <Badge variant="secondary">Type: {selectedDocument.identifiedType} ({(selectedDocument.typeConfidence! * 100).toFixed(0)}% confidence)</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="metadata">
                    <AccordionItem value="metadata">
                      <AccordionTrigger className="font-headline"><Tags className="mr-2"/>Metadata</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="namespace">Namespace</Label>
                            <Select
                              value={selectedDocument.metadata.namespace}
                              onValueChange={(value) => handleMetadataChange(selectedDocument.id, 'namespace', value)}
                              disabled={selectedDocument.status !== 'completed'}
                            >
                              <SelectTrigger id="namespace"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="laws">Laws</SelectItem>
                                <SelectItem value="decrees">Decrees</SelectItem>
                                <SelectItem value="regulations">Regulations</SelectItem>
                                <SelectItem value="contracts">Contracts</SelectItem>
                                <SelectItem value="judgments">Judgments</SelectItem>
                                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="doc-number">Document Number</Label>
                            <Input
                              id="doc-number"
                              placeholder="e.g., Law No. 123"
                              value={selectedDocument.metadata.documentNumber}
                              onChange={(e) => handleMetadataChange(selectedDocument.id, 'documentNumber', e.target.value)}
                              disabled={selectedDocument.status !== 'completed'}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-title">Title</Label>
                          <Input
                            id="doc-title"
                            placeholder="Document title"
                            value={selectedDocument.metadata.title}
                            onChange={(e) => handleMetadataChange(selectedDocument.id, 'title', e.target.value)}
                            disabled={selectedDocument.status !== 'completed'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-date">Date</Label>
                          <Input
                            id="doc-date"
                            type="date"
                            value={selectedDocument.metadata.date}
                            onChange={(e) => handleMetadataChange(selectedDocument.id, 'date', e.target.value)}
                            disabled={selectedDocument.status !== 'completed'}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="chunks">
                      <AccordionTrigger className="font-headline"><BookText className="mr-2"/>Knowledge Chunks ({selectedDocument.chunks?.length || 0})</AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-80 mt-2 p-3 border rounded-md bg-muted/50">
                          {selectedDocument.status === 'completed' && selectedDocument.chunks?.map((chunk, index) => (
                            <div key={index} className="p-3 mb-2 bg-background rounded-md shadow-sm">
                              <p className="text-sm">{chunk}</p>
                            </div>
                          ))}
                          {selectedDocument.status !== 'completed' && <p className="text-sm text-center text-muted-foreground">Chunks will appear here after processing.</p>}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold font-headline">Select a document</h2>
                <p className="text-muted-foreground">Choose a document from the left to view its details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
