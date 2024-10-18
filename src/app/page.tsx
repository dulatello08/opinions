import Script from 'next/script';
import FormContent from "@/app/FormContent";
import FormFooter from "@/app/FormFooter";

export default function FormPage() {
  return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        {/* Google Analytics Script */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-4BYWX32D7N" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4BYWX32D7N');
        `}
        </Script>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center px-6">
          <FormContent />
        </main>

        {/* Footer */}
        <FormFooter />

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