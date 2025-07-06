"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Tag, 
  Hash,
  User,
  Calendar,
  Building
} from 'lucide-react';
import { DocumentAnnotation, LegalStructureAnnotation, BoundingBox } from '@/lib/types';

interface AnnotationViewerProps {
  annotations?: DocumentAnnotation[];
  legalStructure?: LegalStructureAnnotation;
  boundingBoxes?: BoundingBox[];
  extractedText?: string;
}

export function AnnotationViewer({ 
  annotations = [], 
  legalStructure = {}, 
  boundingBoxes = [],
  extractedText = ""
}: AnnotationViewerProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['structure']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4" />;
      case 'header': return <Hash className="h-4 w-4" />;
      case 'article': return <Tag className="h-4 w-4" />;
      case 'section': return <Tag className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'signature': return <User className="h-4 w-4" />;
      case 'decree_number': return <Hash className="h-4 w-4" />;
      case 'issuing_authority': return <Building className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'title': return 'bg-blue-100 text-blue-800';
      case 'header': return 'bg-purple-100 text-purple-800';
      case 'article': return 'bg-green-100 text-green-800';
      case 'section': return 'bg-yellow-100 text-yellow-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      case 'signature': return 'bg-red-100 text-red-800';
      case 'decree_number': return 'bg-indigo-100 text-indigo-800';
      case 'issuing_authority': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!annotations.length && !Object.keys(legalStructure).length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد تعليقات توضيحية متاحة</p>
            <p className="text-sm">قم بتفعيل الاستخراج المهيكل للبيانات لعرض التعليقات التوضيحية</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">البنية القانونية</TabsTrigger>
          <TabsTrigger value="annotations">التعليقات التوضيحية</TabsTrigger>
          <TabsTrigger value="spatial">التخطيط المكاني</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                البنية القانونية للمستند
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {/* Document Title */}
                  {legalStructure.documentTitle && (
                    <div className="p-3 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">عنوان المستند</span>
                      </div>
                      <p className="text-sm">{legalStructure.documentTitle.text}</p>
                      {legalStructure.documentTitle.confidence && (
                        <Badge variant="outline" className="mt-2">
                          الثقة: {Math.round(legalStructure.documentTitle.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Decree Number */}
                  {legalStructure.decreeNumber && (
                    <div className="p-3 border rounded-lg bg-indigo-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-800">رقم المرسوم/القانون</span>
                      </div>
                      <p className="text-sm">{legalStructure.decreeNumber.text}</p>
                    </div>
                  )}

                  {/* Issuing Authority */}
                  {legalStructure.issuingAuthority && (
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-800">الجهة المصدرة</span>
                      </div>
                      <p className="text-sm">{legalStructure.issuingAuthority.text}</p>
                    </div>
                  )}

                  {/* Issue Date */}
                  {legalStructure.issueDate && (
                    <div className="p-3 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">تاريخ الإصدار</span>
                      </div>
                      <p className="text-sm">{legalStructure.issueDate.text}</p>
                    </div>
                  )}

                  {/* Articles */}
                  {legalStructure.articles && legalStructure.articles.length > 0 && (
                    <Collapsible 
                      open={expandedSections.has('articles')} 
                      onOpenChange={() => toggleSection('articles')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-3 border rounded-lg bg-green-50">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">
                              المواد ({legalStructure.articles.length})
                            </span>
                          </div>
                          {expandedSections.has('articles') ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2">
                        {legalStructure.articles.map((article, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-white ml-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                المادة {article.metadata?.number || index + 1}
                              </Badge>
                            </div>
                            <p className="text-sm">{article.content}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Sections */}
                  {legalStructure.sections && legalStructure.sections.length > 0 && (
                    <Collapsible 
                      open={expandedSections.has('sections')} 
                      onOpenChange={() => toggleSection('sections')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-3 border rounded-lg bg-yellow-50">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">
                              الأقسام ({legalStructure.sections.length})
                            </span>
                          </div>
                          {expandedSections.has('sections') ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2">
                        {legalStructure.sections.map((section, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-white ml-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                القسم {section.metadata?.number || index + 1}
                              </Badge>
                              {section.metadata?.title && (
                                <span className="text-sm font-medium">{section.metadata.title}</span>
                              )}
                            </div>
                            <p className="text-sm">{section.content}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Signatures */}
                  {legalStructure.signatures && legalStructure.signatures.length > 0 && (
                    <div className="p-3 border rounded-lg bg-red-50">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">التوقيعات</span>
                      </div>
                      <div className="space-y-1">
                        {legalStructure.signatures.map((sig, index) => (
                          <p key={index} className="text-sm">{sig.text}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annotations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                التعليقات التوضيحية ({annotations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {annotations.map((annotation, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnnotation === `${index}` ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAnnotation(selectedAnnotation === `${index}` ? null : `${index}`)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getAnnotationIcon(annotation.type)}
                        <Badge className={getAnnotationColor(annotation.type)}>
                          {annotation.type}
                        </Badge>
                        {annotation.bbox && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            موضع
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{annotation.content}</p>
                      
                      {selectedAnnotation === `${index}` && annotation.metadata && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-xs font-medium text-gray-600 mb-2">بيانات إضافية:</h4>
                          <div className="space-y-1">
                            {Object.entries(annotation.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-gray-500">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spatial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                التخطيط المكاني ({boundingBoxes.length} منطقة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {boundingBoxes.length > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">تم العثور على {boundingBoxes.length} منطقة مميزة في المستند:</p>
                      {boundingBoxes.map((bbox, index) => (
                        <div key={index} className="p-2 border rounded bg-gray-50 mb-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <span>اليسار: {bbox.left}</span>
                            <span>الأعلى: {bbox.top}</span>
                            <span>العرض: {bbox.width}</span>
                            <span>الارتفاع: {bbox.height}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      لا توجد بيانات تخطيط مكاني متاحة
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
