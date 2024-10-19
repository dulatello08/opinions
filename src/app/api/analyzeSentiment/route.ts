import { NextResponse } from 'next/server';
import { pipeline } from '@huggingface/transformers';

// Initialize an in-memory cache (simple JavaScript object)
const cache: { [key: string]: any } = {};

export async function POST(request: Request) {
    const abortController = new AbortController();  // Create an AbortController
    const { signal } = abortController;  // Get the AbortSignal from the controller

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

        // Watch for the client abort signal to prevent wasting resources
        if (signal.aborted) {
            console.log('Request was aborted by the client.');
            return NextResponse.json(
                { error: 'Request aborted by client.' },
                { status: 499 }  // 499 status for client closed request
            );
        }

        // Run the analysis and cache the result
        const result = await pipe(opinion);
        console.log(result)
        cache[opinion] = result[0];

        return NextResponse.json(result[0]);
    } catch (error) {
        if (signal.aborted) {
            console.log('Server aborted processing due to client request cancellation.');
            return NextResponse.json(
                { error: 'Server aborted processing due to client cancellation.' },
                { status: 499 }
            );
        }
        console.error('Error analyzing sentiment:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment.' },
            { status: 500 }
        );
    }
}