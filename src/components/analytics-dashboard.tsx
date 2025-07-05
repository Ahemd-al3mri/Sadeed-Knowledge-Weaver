import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Target, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface ProcessingAnalytics {
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  duplicateDocuments: number;
  averageConfidence: number;
  totalChunks: number;
  averageChunksPerDocument: number;
  processingTimeStats: {
    total: number;
    average: number;
    fastest: number;
    slowest: number;
  };
  documentTypeDistribution: Record<string, number>;
  confidenceDistribution: {
    high: number; // >90%
    medium: number; // 70-90%
    low: number; // <70%
  };
  errorTypes: Record<string, number>;
  qualityMetrics: {
    ocrAccuracy: number;
    classificationAccuracy: number;
    metadataCompleteness: number;
  };
}

interface AnalyticsDashboardProps {
  analytics: ProcessingAnalytics;
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const successRate = analytics.totalDocuments > 0 
    ? (analytics.completedDocuments / analytics.totalDocuments) * 100 
    : 0;

  const duplicateRate = analytics.totalDocuments > 0
    ? (analytics.duplicateDocuments / analytics.totalDocuments) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
                <p className="text-2xl font-bold text-green-600">
                  {successRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">متوسط الثقة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(analytics.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">متوسط وقت المعالجة</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(analytics.processingTimeStats.average / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">معدل التكرار</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {duplicateRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              إحصائيات المعالجة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.completedDocuments}
                </p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {analytics.failedDocuments}
                </p>
                <p className="text-sm text-muted-foreground">فاشلة</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">التقدم الإجمالي</span>
                <span className="text-sm font-medium">{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">إجمالي المقاطع المُنتجة</p>
              <p className="text-lg font-bold">{analytics.totalChunks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                متوسط {analytics.averageChunksPerDocument.toFixed(1)} مقطع لكل مستند
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              توزيع أنواع المستندات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.documentTypeDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => {
                  const percentage = analytics.totalDocuments > 0 
                    ? (count / analytics.totalDocuments) * 100 
                    : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type}</Badge>
                        <span className="text-sm">{count} مستند</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              توزيع مستويات الثقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-700">عالية (&gt;90%)</p>
                  <p className="text-sm text-green-600">
                    {analytics.confidenceDistribution.high} مستند
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.totalDocuments > 0 
                      ? ((analytics.confidenceDistribution.high / analytics.totalDocuments) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-700">متوسطة (70-90%)</p>
                  <p className="text-sm text-yellow-600">
                    {analytics.confidenceDistribution.medium} مستند
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.totalDocuments > 0 
                      ? ((analytics.confidenceDistribution.medium / analytics.totalDocuments) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-700">منخفضة (&lt;70%)</p>
                  <p className="text-sm text-red-600">
                    {analytics.confidenceDistribution.low} مستند
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.totalDocuments > 0 
                      ? ((analytics.confidenceDistribution.low / analytics.totalDocuments) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              إحصائيات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">أسرع معالجة</p>
                <p className="text-lg font-bold text-green-600">
                  {(analytics.processingTimeStats.fastest / 1000).toFixed(1)}s
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">أبطأ معالجة</p>
                <p className="text-lg font-bold text-red-600">
                  {(analytics.processingTimeStats.slowest / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">إجمالي وقت المعالجة</p>
              <p className="text-xl font-bold">
                {(analytics.processingTimeStats.total / 1000 / 60).toFixed(1)} دقيقة
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">مؤشرات الجودة</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>دقة OCR</span>
                  <span>{(analytics.qualityMetrics.ocrAccuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={analytics.qualityMetrics.ocrAccuracy * 100} className="h-1" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>دقة التصنيف</span>
                  <span>{(analytics.qualityMetrics.classificationAccuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={analytics.qualityMetrics.classificationAccuracy * 100} className="h-1" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>اكتمال البيانات الوصفية</span>
                  <span>{(analytics.qualityMetrics.metadataCompleteness * 100).toFixed(1)}%</span>
                </div>
                <Progress value={analytics.qualityMetrics.metadataCompleteness * 100} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      {Object.keys(analytics.errorTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تحليل الأخطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.errorTypes).map(([errorType, count]) => (
                <div key={errorType} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{errorType}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} حالة
                      </p>
                    </div>
                    <Badge variant="destructive">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>التوصيات والتحسينات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.averageConfidence < 0.8 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  💡 متوسط الثقة منخفض - فكر في تحسين خوارزميات التصنيف
                </p>
              </div>
            )}
            
            {duplicateRate > 20 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  🔄 معدل تكرار عالي - تأكد من كفاءة نظام كشف التكرار
                </p>
              </div>
            )}
            
            {analytics.processingTimeStats.average > 10000 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-800">
                  ⚡ وقت المعالجة بطيء - فكر في تحسين الأداء أو المعالجة المتوازية
                </p>
              </div>
            )}
            
            {analytics.qualityMetrics.metadataCompleteness < 0.7 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  📋 اكتمال البيانات الوصفية منخفض - راجع خوارزميات الاستخراج
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
