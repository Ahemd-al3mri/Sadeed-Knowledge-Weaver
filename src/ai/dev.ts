import { config } from 'dotenv';
config();

import '@/ai/flows/ocr-processing.ts';
import '@/ai/flows/auto-document-type-identification.ts';
import '@/ai/flows/intelligent-chunking.ts';
import '@/ai/flows/embedding-generation.ts';
