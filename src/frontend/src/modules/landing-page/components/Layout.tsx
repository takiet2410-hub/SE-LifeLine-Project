import React from 'react';
import { Header } from '../../../shared/components/Header';
import { Footer } from '../../../shared/components/Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-w-screen min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};
