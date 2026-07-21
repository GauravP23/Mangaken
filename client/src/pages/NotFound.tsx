// filepath: src/pages/NotFound.tsx
import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center px-4">
          <div className="relative inline-block mb-6">
            <h1 className="text-8xl sm:text-9xl font-black text-foreground/5 select-none leading-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary uppercase tracking-widest drop-shadow-md">Lost in Space</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-sm mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full text-sm font-extrabold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 uppercase tracking-wider"
          >
            Go Back Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;