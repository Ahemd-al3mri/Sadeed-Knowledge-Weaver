# 📜 تعليمات التعامل مع اللوائح التنفيذية (Regulations)

**الوصف:**  
لوائح تنفيذية تصدر لتوضيح أو تنظيم كيفية تطبيق القوانين أو المراسيم، غالبًا تصدر عن جهة تنفيذية (وزارة/هيئة) وتحدد التفاصيل الإجرائية أو الفنية اللازمة لتنفيذ نصوص قانونية عليا.

---

## 🎯 مهام الذكاء الاصطناعي:
- استخراج:
  - **رقم/اسم اللائحة** وتاريخها
  - **الجهة المُصدِرة**
  - **القانون أو المرسوم المرتبط** (إن وجد)
  - **عنوان اللائحة** الرسمي
  - **المواد التفصيلية** (المادة الأولى، الثانية، ...)
  - **مادة النفاذ والتوقيع** (تاريخ الإصدار، اسم المسؤول)
- التحقق من وجود ملاحق أو جداول تنفيذية مرفقة.
- توليد metadata مفصل لكل chunk.

---

## ✂️ قواعد chunking:
- **chunk واحد للائحة القصيرة** (حتى 3–4 مواد).
- **chunk منفصل لكل مادة** في اللوائح الطويلة أو المعقدة.
- إذا وُجدت ملاحق/جداول: كل ملحق أو جدول في chunk مستقل مع ربطه باللائحة الأم.

---

## 🗂️ هيكل الـ Metadata للّوائح:

```json
{
  "type": "regulation",
  "namespace": "regulations",
  "title": "اللائحة التنفيذية لقانون العمل",
  "regulation_number": "12/2010",
  "date": "2010-06-15",
  "issuing_authority": "وزارة القوى العاملة",
  "related_law": "قانون العمل رقم 35/2003",
  "chunk_type": "article" | "appendix" | "main_text",
  "article_number": "1" | null,
  "appendix_title": "جدول المخالفات" | null,
  "ocr_confidence": 0.98,
  "language": "ar"
}
```

---

## 📝 ملاحظات ذكية:
- يجب ربط كل مادة أو ملحق باللائحة الأم عبر رقم اللائحة واسمها.
- إذا لم يُذكر رقم اللائحة بوضوح، استخرج أقرب رقم أو تاريخ رسمي.
- في حال وجود جداول/ملاحق، وضّح نوعها في metadata.
- دعم تعدد اللغات وقياس جودة OCR.
- إذا كانت اللائحة جزءًا من قرار وزاري، اربطها بالقرار في metadata.
