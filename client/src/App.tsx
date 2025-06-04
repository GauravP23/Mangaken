import React from 'react';
import { Toaster as Sonner } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Browse from  './pages/Browse'
import SearchResultsPage from './pages/SearchResultsPage';
import MangaDetails from './pages/MangaDetails';
import ChapterReaderPage from './pages/ChapterReaderPage';
import NotFound from './pages/NotFound';
import './App.css'; // Global styles
import './styles/global.css'; // Additional global styles

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Sonner />
                <Routes>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/manga/:id" element={<MangaDetails />} />
                    <Route path="/manga/:id/chapter/:chapterId" element={<ChapterReaderPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;