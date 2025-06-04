import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Browse from './pages/Browse';
import Search from './pages/Search';
import MangaDetail from './pages/MangaDetail';
import ChapterReader from './pages/ChapterReader';
import NotFound from './pages/NotFound';
import './App.css'; // Global styles
import './styles/global.css'; // Additional global styles

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/manga/:id" element={<MangaDetail />} />
                        <Route path="/manga/:id/chapter/:chapterId" element={<ChapterReader />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;