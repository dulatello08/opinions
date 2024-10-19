import { NextResponse } from 'next/server';
import { pipeline } from '@huggingface/transformers';

// In-memory cache with a simple LRU policy (optional)
const cache = new Map();
const MAX_CACHE_SIZE = 100; // Adjust as needed

export async function POST(request: Request) {
    try {
        const requestBody = await request.text(); // Get the raw text of the body
        if (!requestBody) {
            return NextResponse.json(
                { error: 'Request body is empty or invalid.' },
                { status: 400 }
            );
        }

        const parsedData = JSON.parse(requestBody); // Manually parse JSON
        const { opinion } = parsedData;

        // Handle undefined, null, or empty opinion
        if (!opinion || typeof opinion !== 'string' || opinion.trim() === '') {
            return NextResponse.json(
                { message: 'No valid opinion provided. Please enter a valid opinion.' },
                { status: 400 }
            );
        }

        // Check if the result is already cached
        if (cache.has(opinion)) {
            return NextResponse.json(cache.get(opinion));
        }

        // Load the sentiment analysis pipeline
        const pipe = await pipeline('text-classification', 'Xenova/twitter-roberta-base-sentiment-latest', { dtype: 'uint8' });

        // Run the inference
        const result = await pipe(opinion);
        const response = result[0];

        // Cache the result
        cache.set(opinion, response);
        if (cache.size > MAX_CACHE_SIZE) {
            // Remove the oldest entry
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment.' },
            { status: 500 }
        );
    }
}