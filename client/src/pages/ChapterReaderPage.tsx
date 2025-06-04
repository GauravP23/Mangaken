import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, List, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChapterPages } from '../services/mangaApi';
// import { AtHomeServerResponse } from '../types';
import './ChapterReaderPage.css';

const ChapterReaderPage: React.FC = () => {
    const { chapterId } = useParams<{ chapterId: string }>();
    const navigate = useNavigate();
    const [pages, setPages] = useState<string[]>([]);
    const [serverInfo, setServerInfo] = useState<AtHomeServerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [readingMode, setReadingMode] = useState<'long-strip' | 'single-page'>('long-strip');
    const [showControls, setShowControls] = useState(true);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

    useEffect(() => {
        if (!chapterId) return;
        setLoading(true);
        setError(null);
        setPages([]);

        getChapterPages(chapterId)
            .then(data => {
                setServerInfo(data);
                const imageUrls = data.chapter.data.map(fileName =>
                    `${data.baseUrl}/data/${data.chapter.hash}/${fileName}`
                );
                setPages(imageUrls);
                setCurrentImageIndex(0);
                imageRefs.current = imageUrls.map(() => null);
            })
            .catch(err => {
                console.error("Failed to fetch chapter pages:", err);
                setError("Could not load chapter pages.");
            })
            .finally(() => setLoading(false));
    }, [chapterId]);

    // Keyboard navigation for single page mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (readingMode !== 'single-page' || pages.length === 0) return;
            if (event.key === 'ArrowRight') {
                setCurrentImageIndex(prev => Math.min(prev + 1, pages.length - 1));
            } else if (event.key === 'ArrowLeft') {
                setCurrentImageIndex(prev => Math.max(prev - 1, 0));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [readingMode, pages.length]);

    // Scroll to current image in single page mode
    useEffect(() => {
        if (readingMode === 'single-page' && imageRefs.current[currentImageIndex]) {
            imageRefs.current[currentImageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentImageIndex, readingMode]);

    const goToChapter = (chapter: number) => {
        if (chapter >= 1 && chapter <= (serverInfo?.chapter?.totalPages || 1)) {
            navigate(`/manga/${serverInfo?.mangaId}/chapter/${chapter}`);
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    if (loading) return <p>Loading chapter...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!serverInfo || pages.length === 0) return <p>No pages found for this chapter.</p>;

    return (
        <div className="chapter-reader-page min-h-screen bg-black">
            {/* Header Controls */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={`/manga/${serverInfo.mangaId}`}>
                                <Button variant="ghost" size="sm" className="text-white hover:text-red-400">
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="ghost" size="sm" className="text-white hover:text-red-400">
                                    <Home className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center">
                            <h1 className="text-white font-semibold">{serverInfo.mangaTitle}</h1>
                            <p className="text-gray-400 text-sm">Chapter {serverInfo.chapterId}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-white hover:text-red-400">
                                <List className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-white hover:text-red-400">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapter Navigation */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            disabled={currentImageIndex <= 0}
                            onClick={() => setCurrentImageIndex(prev => Math.max(prev - 1, 0))}
                            className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>

                        <div className="text-center">
                            <p className="text-white text-sm">
                                Page {currentImageIndex + 1} of {pages.length}
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            disabled={currentImageIndex >= pages.length - 1}
                            onClick={() => setCurrentImageIndex(prev => Math.min(prev + 1, pages.length - 1))}
                            className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div 
                className="pt-16 pb-16 cursor-pointer"
                onClick={toggleControls}
            >
                <div className="max-w-4xl mx-auto">
                    {pages.map((pageUrl, index) => (
                        <div key={index} className="mb-1">
                            <img
                                src={pageUrl}
                                alt={`Page ${index + 1}`}
                                className="w-full h-auto block"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>

                {/* End of Chapter Navigation */}
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h3 className="text-white text-xl font-semibold mb-4">End of Chapter {serverInfo.chapterId}</h3>
                        <div className="flex gap-4 justify-center">
                          {serverInfo.chapterId > 1 && (
                            <Button
                              variant="outline"
                              onClick={() => goToChapter(currentChapter - 1)}
                              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous Chapter
                            </Button>
                          )}
                          
                          <Link to={`/manga/${serverInfo.mangaId}`}>
                            <Button variant="outline" className="border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-white">
                              <List className="w-4 h-4 mr-1" />
                              All Chapters
                            </Button>
                          </Link>

                          {serverInfo.chapterId < serverInfo.totalChapters && (
                            <Button
                              onClick={() => goToChapter(currentChapter + 1)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Next Chapter
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterReaderPage;