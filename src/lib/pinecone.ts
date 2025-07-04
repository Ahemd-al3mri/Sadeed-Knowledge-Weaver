'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import type { ProcessedDocument } from '@/lib/types';
import type { PineconeRecord } from '@pinecone-database/pinecone';

const getPineconeClient = () => {
    // The client automatically reads the PINECONE_API_KEY env var.
    if (!process.env.PINECONE_API_KEY) {
        throw new Error('Pinecone API key not set in environment variables.');
    }
    return new Pinecone();
};

export const upsertToPinecone = async (doc: ProcessedDocument) => {
    if (!doc.chunks || !doc.embeddings || doc.chunks.length !== doc.embeddings.length) {
        throw new Error('Document is not ready for Pinecone upsert. Missing chunks or embeddings.');
    }
    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!indexName) {
        throw new Error('Pinecone index name not set in environment variables.');
    }

    const pinecone = getPineconeClient();
    const index = pinecone.index(indexName);

    const records: PineconeRecord[] = doc.chunks.map((chunk, i) => {
        // Ensure metadata values are of supported types.
        const pineconeMetadata: Record<string, any> = {
            ...doc.metadata,
            text: chunk,
            source: doc.file.name,
            // Convert keywords array to a single string to be safe.
            keywords: doc.metadata.keywords.join(', '),
        };

        // Remove any properties that are not supported by Pinecone metadata.
        Object.keys(pineconeMetadata).forEach(key => {
            const value = pineconeMetadata[key];
            if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                 delete pineconeMetadata[key];
            }
        });

        return {
            id: `${doc.id}-${i}`,
            values: doc.embeddings![i],
            metadata: pineconeMetadata,
        }
    });
    
    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await index.upsert(batch);
    }

    return { success: true, vectorCount: records.length };
};