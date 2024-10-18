import { NextResponse } from 'next/server';
import { pipeline } from '@huggingface/transformers';

// Initialize an in-memory cache (simple JavaScript object)
const cache: { [key: string]: any } = {};

export async function POST(request: Request) {
    try {
        const { opinion } = await request.json();

        if (!opinion || typeof opinion !== 'string') {
            return NextResponse.json(
                { error: 'Invalid input. Opinion must be a non-empty string.' },
                { status: 400 }
            );
        }

        // Check if the result is already cached
        if (cache[opinion]) {
            return NextResponse.json(cache[opinion]);
        }

        // Load the sentiment analysis pipeline
        const pipe = await pipeline('text-classification', 'Xenova/twitter-roberta-base-sentiment-latest', { dtype: 'uint8' });
        const result = await pipe(opinion);
        console.log(result);

        // Cache the result before returning it
        cache[opinion] = result[0];

        // Return the first result as the sentiment analysis
        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment.' },
            { status: 500 }
        );
    }
}