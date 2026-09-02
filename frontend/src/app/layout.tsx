'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SetupWizard } from '@/components/wizard/SetupWizard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [marketplace, setMarketplace] = useState('US');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const isDone = localStorage.getItem('kdp_studio_setup_done');
    if (!isDone) {
      setShowWizard(true);
    }
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>KDP Intelligence Studio — Professional KDP Research Platform</title>
        <meta name="description" content="Local-first Amazon KDP research, keyword intelligence, competition analysis, and SEO platform." />
      </head>
      <body className="bg-[#090d16] text-slate-100 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar currentMarketplace={marketplace} onMarketplaceChange={setMarketplace} />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
        <SetupWizard isOpen={showWizard} onComplete={() => setShowWizard(false)} />
      </body>
    </html>
  );
}
