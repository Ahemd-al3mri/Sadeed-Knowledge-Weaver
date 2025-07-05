// Quick test for the royal decree chunking
const testRoyalDecreeText = `الجريدة الرسمية العدد (١٤٧١) مرسوم سلطاني رقم ٢٠٢٢/٨٩ بالتصديق على اتفاقية تعاون بين حكومة سلطنة عمان وحكومة مملكة البحرين في المجال الأمني نحن فيشم بن طارق سلطان عمان بعد الاطلاع على النظام الأساسي للدولة، وعلى اتفاقية التعاون بين حكومة سلطنة عمان وحكومة مملكة البحرين في المجال الأمني الموقعة في مدينة المنامة بتاريخ ٢٤ من أكتوبر ٢٠٢٢م، وبناء على ما تقتضيه المصلحة العامة. رسمنا بما هو آت المادة الأولى التصديق على الاتفاقية المشار إليها، وفقا للصيغة المرفقة. المادة الثانية ينشر هذا المرسوم في الجريدة الرسمية، ويعمل به من تاريخ صدوره. صدر في ١٣ من جمادى الأولى سنة ١٤٤٤هـ الموافق، ٧ من ديسمبر سنة ٢٠٢٢م هيثم بن طارق سلطان عمان الجريدة الرسمية العدد (١٤٧١) اتفاقيــــة تعــــاون بين حكومة سلطنة عمان وحكومة مملكة البحرين في المجال الأمني إن حكومة سلطنة عمان ممثلة في وزارة الداخلية، وحكومة مملكة البحرين ممثلة في وزارة الداخلية المشار إليهما فيما بعد بـ "الطرفين"، وانطلاقا من روح الأخوة الصادقة والروابط الوثيقة التي تجمع بين شعبي البلدين، وتعزيزا لعلاقات التعاون بينهما بما يخدم المصالح المشتركة، وحرصا منهما على تحقيق أكبر قدر من التعاون من أجل المساهمة الفعالة في مكافحة الجريمة بكافة أشكالها، ورفع كفاءة الأجهزة الأمنية، وانطلاقا من قناعتهما بأواصر الروابط التي تجمع بين أبنائهما ووحدتهما الإقليمية ومصيرهما الواحد ومصالحهما المشتركة، فقد اتفق الطرفان على ما يأتي: المادة ( ١ ) مع مراعاة ما تقضي به التشريعات الوطنية للبلدين والاتفاقيات الدولية التي تكون الدولتان طرفا فيها، يعمل الطرفان على تعزيز وتطوير التعاون القائم بينهما، وتبادل الخبرات الأمنية والفنية من أجل مكافحة الجريمة بكافة أشكالها، وخاصة في المجالات الآتية: ١ - الإرهاب بكافة أشكاله وصوره. ٢ - مكافحة الجريمة المنظمة. المادة ( ٢ ) يتبادل الطرفان المعلومات والوثائق بشأن مكافحة الجريمة بما يحقق أمن واستقرار البلدين وخاصة في المجالات الآتية: 1 - تبـادل المعلومات والوثائـق التـي مـن شأنها رفع كفاءة الأجهزة الأمنيـة. المادة ( ٣ ) يتخذ الطرفان التدابير اللازمة للحيلولة دون نشوء أي تنظيمات إرهابية`;

// Simulate the chunking logic
function testChunking(text, documentType) {
  const chunks = [];
  
  if (documentType === 'royal_decrees') {
    const agreementStart = text.search(/اتفاقية|اتفاقيــــة|قانون/i);
    const decreeMainText = agreementStart > 0 ? text.substring(0, agreementStart).trim() : text;
    const agreementText = agreementStart > 0 ? text.substring(agreementStart).trim() : '';
    
    console.log('Agreement start position:', agreementStart);
    console.log('Decree main text length:', decreeMainText.length);
    console.log('Agreement text length:', agreementText.length);
    
    // Split decree articles
    const decreeArticles = decreeMainText.split(/(?=المادة\s+\d+|المادة\s+الأولى|المادة\s+الثانية|المادة\s+الثالثة)/);
    const mainDecreeText = decreeArticles[0].trim();
    
    if (mainDecreeText && mainDecreeText.length > 100) {
      chunks.push(`DECREE PREAMBLE: ${mainDecreeText.substring(0, 100)}...`);
    }
    
    for (let i = 1; i < decreeArticles.length; i++) {
      const article = decreeArticles[i].trim();
      if (article && article.includes('المادة')) {
        chunks.push(`DECREE ARTICLE ${i}: ${article.substring(0, 100)}...`);
      }
    }
    
    // Process agreement if exists
    if (agreementText) {
      const agreementArticles = agreementText.split(/(?=المادة\s*\\(\s*\\d+\s*\\)|المادة\s+\\d+)/);
      const agreementPreamble = agreementArticles[0].trim();
      
      if (agreementPreamble && agreementPreamble.length > 200) {
        chunks.push(`AGREEMENT PREAMBLE: ${agreementPreamble.substring(0, 100)}...`);
      }
      
      for (let i = 1; i < agreementArticles.length; i++) {
        const agreementArticle = agreementArticles[i].trim();
        if (agreementArticle && (agreementArticle.includes('المادة') || agreementArticle.length > 100)) {
          chunks.push(`AGREEMENT ARTICLE ${i}: ${agreementArticle.substring(0, 100)}...`);
        }
      }
    }
  }
  
  return chunks;
}

try {
  const chunks = testChunking(testRoyalDecreeText, 'royal_decrees');
  console.log('Chunking results:');
  console.log(`Total chunks: ${chunks.length}`);
  chunks.forEach((chunk, index) => {
    console.log(`${index + 1}. ${chunk}`);
  });
} catch (error) {
  console.error('Error in chunking test:', error);
}
