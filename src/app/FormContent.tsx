'use client'
import { useState, useEffect, useRef } from 'react';

interface Sentiment {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
}

interface ClientData {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    viewportSize: string;
    timezone: string;
    referrer: string;
}

export default function FormContent() {
    const [gradeLevel, setGradeLevel] = useState<string>('');
    const [opinion, setOpinion] = useState<string>('');
    const [nameOption, setNameOption] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sentiment, setSentiment] = useState<Sentiment | null>(null);

    // Client data state
    const [clientData, setClientData] = useState<ClientData | null>(null);

    // To track the latest fetch request
    const abortControllerRef = useRef<AbortController | null>(null);

    // To keep track of whether the response should be shown or discarded
    const latestOpinionRef = useRef<string>(opinion);

    // Debounce timer
    let debounceTimer: ReturnType<typeof setTimeout>;

    // Collect client data
    useEffect(() => {
        const getClientData = () => {
            const data: ClientData = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                referrer: document.referrer,
            };
            setClientData(data);
        };
        getClientData();
    }, []);

    // Run sentiment analysis with debounce and request cancellation
    useEffect(() => {
        // Clear any previously set debounce timer
        clearTimeout(debounceTimer);

        if (opinion.trim() === '') {
            setSentiment(null);
            return;
        }

        // Set debounce timer (500ms)
        debounceTimer = setTimeout(async () => {
            // Abort any previous request if a new one is initiated
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create a new AbortController for the current request
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            // Save the latest opinion to check if the response should be processed
            latestOpinionRef.current = opinion;

            try {
                const response = await fetch('/api/analyzeSentiment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ opinion }),
                    signal: abortController.signal, // Attach the AbortController
                });

                if (!response.ok) {
                    throw new Error('Sentiment analysis failed');
                }

                const result: Sentiment = await response.json();

                // Only update sentiment if the input has not changed since the request was initiated
                if (latestOpinionRef.current === opinion) {
                    setSentiment(result);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Inference failed:', error);
                }
            }
        }, 500); // Adjust debounce delay as needed
    }, [opinion]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analyzeSentiment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ opinion }),
            });
            if (!response.ok) {
                throw new Error('Sentiment analysis failed');
            }
            const result: Sentiment = await response.json();
            setSentiment(result);

            if (result.label === 'negative' && result.score >= 0.6) {
                setError('Opinion sentiment is too negative to be submitted. Please revise your opinion.');
                setLoading(false);
                return;
            }

            const submitResponse = await fetch('/api/submitOpinion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gradeLevel,
                    opinion,
                    nameOption,
                    name: nameOption === 'provide' ? name : 'Anonymous',
                    clientData, // Include client data
                }),
            });
            if (!submitResponse.ok) {
                throw new Error('Failed to submit the form');
            }
            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const getProgressBarWidth = (): string => {
        if (!sentiment) return '0%';
        if (sentiment.label === 'positive') {
            return `${sentiment.score * 50 + 50}%`; // Scale positive scores to 50-100%
        } else if (sentiment.label === 'negative') {
            return `${(1 - sentiment.score) * 50}%`; // Scale negative scores to 0-50%
        } else {
            return '50%'; // Neutral sentiment at 50%
        }
    };

    if (submitted) {
        return (
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-700 flex flex-col items-center">
                <h1 className="text-5xl font-extrabold mb-6 text-center text-purple-400">Thank You!</h1>
                <p className="text-xl mb-8 text-center">Your opinion has been successfully submitted.</p>
                <div className="flex items-center justify-center w-24 h-24 bg-purple-500 rounded-full animate-pulse mb-4"></div>
                <button
                    type="button"
                    className="py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-purple-500 font-bold transform hover:scale-105 transition-transform"
                    onClick={() => setSubmitted(false)}
                >
                    Submit Another Response
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-700">
            <h1 className="text-4xl font-extrabold mb-8 text-center">Share Your Thoughts</h1>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label className="block text-lg font-medium mb-2">Grade Level</label>
                    <select
                        className="w-full p-3 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-4 focus:ring-purple-500"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                    >
                        <option value="">Select your grade level</option>
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                    </select>
                </div>

                <div>
                    <label className="block text-lg font-medium mb-2">Your Opinion</label>
                    <textarea
                        className="w-full p-4 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-4 focus:ring-purple-500"
                        rows={4}
                        value={opinion}
                        onChange={(e) => setOpinion(e.target.value)}
                        placeholder="Share your thoughts..."
                    />
                    {sentiment && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-600 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full ${
                                        sentiment.label === 'positive'
                                            ? 'bg-green-500'
                                            : sentiment.label === 'negative'
                                                ? 'bg-red-500'
                                                : 'bg-yellow-500'
                                    }`}
                                    style={{ width: getProgressBarWidth(), transition: 'width 0.5s ease' }}
                                ></div>
                            </div>
                            <p className="mt-2 text-center">
                                {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)} Sentiment
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="block text-lg font-medium mb-2">Name Preference</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="nameOption"
                                value="provide"
                                className="h-5 w-5 text-purple-500 focus:ring-purple-500 border-gray-600"
                                checked={nameOption === 'provide'}
                                onChange={(e) => setNameOption(e.target.value)}
                            />
                            <span className="ml-2">Provide Name</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="nameOption"
                                value="anonymous"
                                className="h-5 w-5 text-purple-500 focus:ring-purple-500 border-gray-600"
                                checked={nameOption === 'anonymous'}
                                onChange={(e) => setNameOption(e.target.value)}
                            />
                            <span className="ml-2">Stay Anonymous</span>
                        </label>
                    </div>

                    {nameOption === 'provide' && (
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-4 focus:ring-purple-500 mt-4"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    )}
                </div>

                <button
                    type="button"
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-purple-500 font-bold transform hover:scale-105 transition-transform"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </form>
        </div>
    );
}