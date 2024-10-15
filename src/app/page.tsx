// Import required hooks and components
'use client';
import { useState, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';
import { pipeline } from '@xenova/transformers';
import Script from 'next/script'; // If you're using Next.js

export default function FormPage() {
  const [gradeLevel, setGradeLevel] = useState('');
  const [opinion, setOpinion] = useState('');
  const [nameOption, setNameOption] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<{ label: string; score: number } | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // Client data state
  const [clientData, setClientData] = useState<unknown>({});

  // Collect client data
  useEffect(() => {
    const getClientData = () => {
      const data = {
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


  // Run inference on opinion change
  useEffect(() => {
    const runInference = async () => {
      if (opinion.trim() === '') {
        setSentiment(null);
        return;
      }
      setSentimentLoading(true);
      try {
        const pipe = await pipeline(
            'text-classification',
            'Xenova/twitter-roberta-base-sentiment-latest',
        );
        const result = await pipe(opinion);
        console.log(result);
        setSentiment((result as never)[0]);
      } catch (error) {
        console.error('Inference failed:', error);
      }
      setSentimentLoading(false);
    };
    runInference();
  }, [opinion]);

  const handleSubmit = async () => {
    if (sentiment?.label === 'negative' && sentiment?.score >= 0.6) {
      setError('Opinion sentiment is too negative to be submitted. Please revise your opinion.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/submitOpinion', {
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
      if (!response.ok) {
        throw new Error('Failed to submit the form');
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarWidth = () => {
    if (!sentiment) return '0%';
    if (sentiment.label === 'positive') {
      return `${sentiment.score * 50 + 50}%`; // Scale positive scores to 50-100%
    } else if (sentiment.label === 'negative') {
      return `${(1 - sentiment.score) * 50}%`; // Scale negative scores to 0-50%
    } else {
      return '50%'; // Neutral sentiment at 50%
    }
  };

  return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        {/* Google Analytics Script */}
        <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=YOUR_GOOGLE_ANALYTICS_TRACKING_ID`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', 'YOUR_GOOGLE_ANALYTICS_TRACKING_ID');
        `}
        </Script>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center px-6">
          {!submitted ? (
              <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-700">
                <h1 className="text-4xl font-extrabold mb-8 text-center">Share Your Thoughts</h1>
                {/* Google AdSense Ad */}
                <div className="mb-6 flex justify-center">
                  <ins
                      className="adsbygoogle"
                      style={{ display: 'block', textAlign: 'center' }}
                      data-ad-client="ca-pub-7509088958653785"
                      data-ad-slot="YOUR_ADSENSE_SLOT_ID"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                  ></ins>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-lg font-medium mb-2">Grade Level</label>
                    <select
                        className="w-full p-3 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-4 focus:ring-purple-500"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                    >
                      <option value="">Select your grade level</option>
                      <option value="freshman">Freshman</option>
                      <option value="sophomore">Sophomore</option>
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
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
                    {sentimentLoading ? (
                        <div className="flex items-center justify-center mt-4">
                          <span className="text-gray-400">Analyzing sentiment...</span>
                        </div>
                    ) : (
                        sentiment !== null && (
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
                        )
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
                      disabled={loading || (sentiment?.label === 'negative' && sentiment?.score >= 0.6)}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                  {error && <p className="text-red-500 mt-4">{error}</p>}
                </form>
              </div>
          ) : (
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
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 py-6 mt-12">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
              &copy; 2024 Opinion Survey. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a
                  href="https://github.com/dulatello08"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
              >
                <FaGithub size={24} />
              </a>
            </div>
          </div>
        </footer>

        {/* Google AdSense Script */}
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7509088958653785"
            crossOrigin="anonymous"
        />
        <Script id="adsense-script" strategy="afterInteractive">
          {`
          (adsbygoogle = window.adsbygoogle || []).push({});
        `}
        </Script>
      </div>
  );
}