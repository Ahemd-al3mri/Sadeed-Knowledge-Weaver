console.log('Starting chunking test...');

const text = `مرسوم سلطاني رقم ٢٠٢٢/٨٩ المادة الأولى التصديق على الاتفاقية. المادة الثانية ينشر هذا المرسوم. اتفاقيــــة تعــــاون بين الحكومات المادة ( ١ ) يعمل الطرفان على التعاون. المادة ( ٢ ) يتبادل الطرفان المعلومات.`;

console.log('Original text length:', text.length);

const agreementStart = text.search(/اتفاقية|اتفاقيــــة|قانون/i);
console.log('Agreement start position:', agreementStart);

if (agreementStart > 0) {
  const decreeMainText = text.substring(0, agreementStart).trim();
  const agreementText = text.substring(agreementStart).trim();
  
  console.log('Decree text:', decreeMainText);
  console.log('Agreement text:', agreementText);
  
  // Test decree splitting
  const decreeArticles = decreeMainText.split(/(?=المادة\s+الأولى|المادة\s+الثانية)/);
  console.log('Decree articles count:', decreeArticles.length);
  decreeArticles.forEach((article, i) => {
    console.log(`Decree article ${i}:`, article.trim().substring(0, 50));
  });
  
  // Test agreement splitting
  const agreementArticles = agreementText.split(/(?=المادة\s*\(\s*[٠-٩0-9]+\s*\))/);
  console.log('Agreement articles count:', agreementArticles.length);
  agreementArticles.forEach((article, i) => {
    console.log(`Agreement article ${i}:`, article.trim().substring(0, 50));
  });
} else {
  console.log('No agreement found in text');
}

console.log('Test completed.');
