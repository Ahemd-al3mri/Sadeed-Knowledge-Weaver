'use server';

/**
 * @fileOverview An intelligent chunking AI agent.
 *
 * - intelligentChunking - A function that handles the intelligent chunking process.
 * - IntelligentChunkingInput - The input type for the intelligentChunking function.
 * - IntelligentChunkingOutput - The return type for the intelligentChunking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentChunkingInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
  documentType: z.string().describe('The type of the legal document (e.g., law, decree, article).'),
});
export type IntelligentChunkingInput = z.infer<typeof IntelligentChunkingInputSchema>;

const IntelligentChunkingOutputSchema = z.array(z.string()).describe('An array of text chunks representing the segmented legal document.');
export type IntelligentChunkingOutput = z.infer<typeof IntelligentChunkingOutputSchema>;

export async function intelligentChunking(input: IntelligentChunkingInput): Promise<IntelligentChunkingOutput> {
  return intelligentChunkingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentChunkingPrompt',
  input: {schema: IntelligentChunkingInputSchema},
  output: {schema: IntelligentChunkingOutputSchema},
  prompt: `You are an expert in legal document processing and Arabic text segmentation.

Follow the EXACT chunking rules from the data_instructions for each document type:

**fatwas**: كل فتوى = chunk مستقل. إذا احتوت الفتوى على سؤال وجواب وأساس قانوني، يتم تضمينها جميعًا في نفس chunk مع فصل واضح بين الأجزاء. لا تدمج عدة فتاوى في chunk واحد.

**laws**: كل مادة قانونية منفصلة = chunk مستقل. لا يتم الدمج بين المواد في نفس chunk. كل مادة يجب أن تحتوي على رقمها الكامل والنص.

**royal_decrees**: للمراسيم القصيرة (حتى 3-4 مواد): chunk واحد. إذا تضمن القانون: chunk خاص بالمرسوم ذاته، بعدها لكل مادة قانونية chunk مستقل. لا تدمج نصوص المرسيم مع نصوص القانون.

**judicial_civil**: كل مبدأ = chunk مستقل. حتى لو النص يحتوي على عدة فقرات، لا يتم تكسيره داخليًا.

**judicial_criminal**: كل حكم أو مبدأ جنائي = chunk مستقل.

**ministerial_decisions**: كل قرار أو مادة قرارية = chunk مستقل.

**regulations**: كل مادة لائحة = chunk مستقل.

**royal_orders**: كل أمر أو توجيه = chunk مستقل.

**judicial_principles**: كل مبدأ قضائي = chunk مستقل.

CRITICAL RULES:
- Split Arabic legal documents by their natural structure (مادة، فتوى، مبدأ، قرار)
- Each chunk must be 200-2000 characters for optimal processing
- Preserve Arabic text integrity and legal numbering
- Include article/principle numbers with their complete text
- Do NOT merge different legal articles/principles into one chunk
- Do NOT split individual articles/principles into multiple chunks

Document Type: {{{documentType}}}
Document Text:
{{{documentText}}}

Return an array of text chunks following the exact rules above.`,    
});

const intelligentChunkingFlow = ai.defineFlow(
  {
    name: 'intelligentChunkingFlow',
    inputSchema: IntelligentChunkingInputSchema,
    outputSchema: IntelligentChunkingOutputSchema,
  },
  async input => {
    try {
      console.log('=== Intelligent Chunking Debug ===');
      console.log('Document type:', input.documentType);
      console.log('Document length:', input.documentText.length);
      console.log('Document preview:', input.documentText.substring(0, 200) + '...');

      // Try AI-based chunking first
      const {output} = await prompt(input);
      
      console.log('AI chunking result length:', output?.length || 0);
      
      // Validate AI chunking results
      if (output && output.length > 1 && output.some(chunk => chunk.length > 100)) {
        console.log('Using AI-based chunking');
        console.log('AI chunks count:', output.length);
        console.log('Sample AI chunk length:', output[0]?.length || 0);
        return output;
      }
      
      console.log('AI chunking insufficient, falling back to rule-based chunking');
      
      // Fallback to rule-based chunking
      const ruleBasedChunks = ruleBasedChunking(input.documentText, input.documentType);
      console.log('Rule-based chunks count:', ruleBasedChunks.length);
      console.log('Sample rule-based chunk length:', ruleBasedChunks[0]?.length || 0);
      console.log('=== End Chunking Debug ===');
      
      return ruleBasedChunks;
      
    } catch (error) {
      console.error('AI chunking failed, using rule-based fallback:', error);
      
      // Fallback to rule-based chunking on error
      const ruleBasedChunks = ruleBasedChunking(input.documentText, input.documentType);
      console.log('Emergency fallback chunks count:', ruleBasedChunks.length);
      
      return ruleBasedChunks;
    }
  }
);

// Rule-based chunking fallback following data_instructions
function ruleBasedChunking(documentText: string, documentType: string): string[] {
  const chunks: string[] = [];
  const text = documentText.trim();
  
  if (!text) return chunks;

  console.log(`Processing ${documentType} with rule-based chunking`);

  switch (documentType) {
    case 'laws':
      // كل مادة قانونية منفصلة = chunk مستقل
      // معالجة الأرقام العربية والإنجليزية والأشكال المختلفة للترقيم
      const lawArticles = text.split(/(?=المادة\s*\(\s*[٠-٩0-9]+\s*\)|المادة\s+[٠-٩0-9]+|المادة\s+الأولى|المادة\s+الثانية|المادة\s+الثالثة)/);
      lawArticles.forEach(article => {
        const cleanArticle = article.trim();
        if (cleanArticle && (cleanArticle.includes('المادة') || cleanArticle.length > 200)) {
          chunks.push(cleanArticle);
        }
      });
      break;

    case 'fatwas':
      // كل فتوى = chunk مستقل (سؤال + جواب + أساس قانوني معاً)
      // البحث عن فتاوى بأرقام أو بنمط السؤال/الجواب
      const fatwaPatterns = text.split(/(?=فتوى رقم|\d+\/\d+|السؤال\s*:)/);
      fatwaPatterns.forEach(fatwa => {
        const cleanFatwa = fatwa.trim();
        if (cleanFatwa && cleanFatwa.length > 100) {
          chunks.push(cleanFatwa);
        }
      });
      
      // إذا لم نجد فتاوى منفصلة، نقسم حسب السؤال/الجواب
      if (chunks.length === 0) {
        let currentFatwa = '';
        const sections = text.split(/(?=السؤال|الجواب|الأساس القانوني)/);
        
        sections.forEach(section => {
          const cleanSection = section.trim();
          if (cleanSection.startsWith('السؤال')) {
            if (currentFatwa) chunks.push(currentFatwa.trim());
            currentFatwa = cleanSection;
          } else if (cleanSection.startsWith('الجواب') || cleanSection.startsWith('الأساس القانوني')) {
            currentFatwa += '\n\n' + cleanSection;
          }
        });
        
        if (currentFatwa) chunks.push(currentFatwa.trim());
      }
      break;

    case 'royal_decrees':
      // للمراسيم: فصل المرسوم عن الاتفاقية أو القانون المرفق
      // البحث عن بداية الاتفاقية أو القانون المرفق بأشكال مختلفة
      const agreementStart = text.search(/اتفاقيــــة|اتفاقية\s+تعــــاون|اتفاقية\s+تعاون|قانون\s+|نظام\s+/i);
      const decreeMainText = agreementStart > 0 ? text.substring(0, agreementStart).trim() : text;
      const agreementText = agreementStart > 0 ? text.substring(agreementStart).trim() : '';
      
      console.log(`Royal decree processing: agreement found at position ${agreementStart}`);
      console.log(`Decree main text length: ${decreeMainText.length}, Agreement text length: ${agreementText.length}`);
      
      // تقسيم المرسوم نفسه إلى مواد
      const decreeArticles = decreeMainText.split(/(?=المادة\s+[٠-٩0-9]+|المادة\s+الأولى|المادة\s+الثانية|المادة\s+الثالثة)/);
      const mainDecreeText = decreeArticles[0].trim();
      
      // إضافة نص المرسوم الأساسي (الديباجة)
      if (mainDecreeText && mainDecreeText.length > 100) {
        chunks.push(mainDecreeText);
        console.log(`Added decree preamble: ${mainDecreeText.length} chars`);
      }
      
      // إضافة مواد المرسوم
      for (let i = 1; i < decreeArticles.length; i++) {
        const article = decreeArticles[i].trim();
        if (article && article.includes('المادة')) {
          chunks.push(article);
          console.log(`Added decree article ${i}: ${article.length} chars`);
        }
      }
      
      // معالجة الاتفاقية أو القانون المرفق منفصلاً
      if (agreementText && agreementText.length > 100) {
        // تقسيم الاتفاقية إلى مواد منفصلة
        const agreementArticles = agreementText.split(/(?=المادة\s*\(\s*[٠-٩0-9]+\s*\)|المادة\s+[٠-٩0-9]+)/);
        const agreementPreamble = agreementArticles[0].trim();
        
        // إضافة مقدمة الاتفاقية
        if (agreementPreamble && agreementPreamble.length > 200) {
          chunks.push(agreementPreamble);
          console.log(`Added agreement preamble: ${agreementPreamble.length} chars`);
        }
        
        // إضافة كل مادة من مواد الاتفاقية منفصلة
        for (let i = 1; i < agreementArticles.length; i++) {
          const agreementArticle = agreementArticles[i].trim();
          if (agreementArticle && (agreementArticle.includes('المادة') || agreementArticle.length > 100)) {
            chunks.push(agreementArticle);
            console.log(`Added agreement article ${i}: ${agreementArticle.length} chars`);
          }
        }
      }
      break;

    case 'judicial_civil':
    case 'judicial_criminal':
    case 'judicial_principles':
      // كل مبدأ = chunk مستقل
      const principles = text.split(/(?=مبدأ\s+\d+|المبدأ\s+\d+)/);
      principles.forEach(principle => {
        const cleanPrinciple = principle.trim();
        if (cleanPrinciple && (cleanPrinciple.includes('مبدأ') || cleanPrinciple.length > 200)) {
          chunks.push(cleanPrinciple);
        }
      });
      
      // إذا لم نجد مبادئ مرقمة، نقسم حسب الفقرات الطويلة
      if (chunks.length === 0) {
        const paragraphs = text.split(/\n\s*\n/);
        let currentChunk = '';
        
        paragraphs.forEach(paragraph => {
          const cleanParagraph = paragraph.trim();
          if (!cleanParagraph) return;
          
          if (currentChunk.length + cleanParagraph.length > 1500) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = cleanParagraph;
          } else {
            currentChunk += (currentChunk ? '\n\n' : '') + cleanParagraph;
          }
        });
        
        if (currentChunk) chunks.push(currentChunk.trim());
      }
      break;

    case 'ministerial_decisions':
    case 'regulations':
      // كل مادة أو قرار = chunk مستقل
      // معالجة الأرقام العربية والأشكال المختلفة
      const articles = text.split(/(?=المادة\s*\(\s*[٠-٩0-9]+\s*\)|المادة\s+[٠-٩0-9]+|القرار رقم|البند\s+[٠-٩0-9]+)/);
      articles.forEach(article => {
        const cleanArticle = article.trim();
        if (cleanArticle && cleanArticle.length > 50) {
          // تقسيم المواد الطويلة جداً (أكثر من 2000 حرف)
          if (cleanArticle.length > 2000) {
            const subArticles = cleanArticle.split(/(?=\d+\s*-|\d+\s*\)|[٠-٩]+\s*-|[٠-٩]+\s*\))/);
            subArticles.forEach(subArticle => {
              const cleanSubArticle = subArticle.trim();
              if (cleanSubArticle && cleanSubArticle.length > 100) {
                chunks.push(cleanSubArticle);
              }
            });
          } else {
            chunks.push(cleanArticle);
          }
        }
      });
      break;

    case 'royal_orders':
      // كل أمر أو توجيه = chunk مستقل
      const orders = text.split(/(?=نأمر|يُطلب|التوجيه|الأمر)/);
      orders.forEach(order => {
        const cleanOrder = order.trim();
        if (cleanOrder && cleanOrder.length > 100) {
          chunks.push(cleanOrder);
        }
      });
      break;

    default:
      // التقسيم العام للوثائق غير المصنفة
      const paragraphs = text.split(/\n\s*\n/);
      let currentChunk = '';
      
      paragraphs.forEach(paragraph => {
        const cleanParagraph = paragraph.trim();
        if (!cleanParagraph) return;
        
        if (currentChunk.length + cleanParagraph.length > 1000) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = cleanParagraph;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + cleanParagraph;
        }
      });
      
      if (currentChunk) chunks.push(currentChunk.trim());
      break;
  }

  // التأكد من وجود chunks صالحة
  if (chunks.length === 0 && text.length > 0) {
    // تقسيم طارئ بناءً على الجمل
    const sentences = text.split(/[.!؟]\s+/);
    let emergencyChunk = '';
    
    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) return;
      
      if (emergencyChunk.length + cleanSentence.length > 800) {
        if (emergencyChunk) chunks.push(emergencyChunk.trim() + '.');
        emergencyChunk = cleanSentence;
      } else {
        emergencyChunk += (emergencyChunk ? '. ' : '') + cleanSentence;
      }
    });
    
    if (emergencyChunk) chunks.push(emergencyChunk.trim() + '.');
  }

  const validChunks = chunks.filter(chunk => chunk.length > 30 && chunk.trim().length > 0);
  console.log(`Rule-based chunking produced ${validChunks.length} chunks for ${documentType}`);
  
  return validChunks;
}
