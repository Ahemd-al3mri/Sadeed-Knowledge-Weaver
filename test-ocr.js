const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();

async function testOCR() {
  try {
    console.log('Testing Mistral OCR API...');
    
    const apiKey = process.env.MISTRAL_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      console.error('No API key found');
      return;
    }
    
    const client = new Mistral({
      apiKey: apiKey,
    });
    
    console.log('Mistral client created successfully');
    console.log('Calling Mistral OCR API...');
    
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
      },
      includeImageBase64: false
    });
    
    console.log('Response received:');
    console.log('Response keys:', Object.keys(response));
    console.log('Full response:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('Error occurred:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testOCR().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
