// Test script for chunking functionality
import { intelligentChunking } from '../src/ai/flows/intelligent-chunking';

async function testChunking() {
  // Test Arabic law document
  const testLawDocument = `
قانون المرور
مرسوم سلطاني رقم 28/93

المادة 1: يُعمل بأحكام قانون المرور المرفق بهذا المرسوم ويُعرف باسم "قانون المرور".

المادة 2: على جميع الجهات المختصة تنفيذ أحكام هذا القانون، كل فيما يخصه.

المادة 3: يُلغى كل ما يتعارض مع أحكام هذا القانون.

المادة 4: يُنشر هذا المرسوم في الجريدة الرسمية، ويُعمل به من تاريخ نشره.
  `;

  const testFatwaDocument = `
فتوى رقم 2/58407

السؤال: ما مدى جواز إعادة النظر في الشهادة الطبية بعد اعتمادها؟

الجواب: لا يجوز للجهة الطبية المختصة المعتمدة معاودة النظر في الشهادات الطبية المعتمدة من قبلها إلا في حالات استثنائية محددة.

الأساس القانوني: اللائحة التنفيذية لقانون الخدمة المدنية – المادتين 102 و103.
  `;

  console.log('=== Testing Law Document ===');
  try {
    const lawChunks = await intelligentChunking({
      documentText: testLawDocument,
      documentType: 'laws'
    });
    console.log(`Law chunks count: ${lawChunks.length}`);
    lawChunks.forEach((chunk, index) => {
      console.log(`Law Chunk ${index + 1}: ${chunk.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error('Law chunking error:', error);
  }

  console.log('\n=== Testing Fatwa Document ===');
  try {
    const fatwaChunks = await intelligentChunking({
      documentText: testFatwaDocument,
      documentType: 'fatwas'
    });
    console.log(`Fatwa chunks count: ${fatwaChunks.length}`);
    fatwaChunks.forEach((chunk, index) => {
      console.log(`Fatwa Chunk ${index + 1}: ${chunk.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error('Fatwa chunking error:', error);
  }
}

testChunking();
