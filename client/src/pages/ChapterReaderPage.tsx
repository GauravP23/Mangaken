import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, List, Settings, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getChapterPages, getMangaFeed } from '../services/mangaApi';
import { AtHomeServerResponse, Chapter } from '../types';
import './ChapterReaderPage.css';
import { saveReadingProgress } from '../utils/readingProgress';

// Helper type for local UI state
interface ChapterReaderServerInfo extends AtHomeServerResponse {
  mangaId: string;
  mangaTitle: string;
  chapterId: string; // changed from number to string
  totalChapters: number;
}

const ChapterReaderPage: React.FC = () => {
    const { chapterId, id: mangaId } = useParams<{ chapterId: string, id: string }>();
    const navigate = useNavigate();
    const [pages, setPages] = useState<string[]>([]);
    const [serverInfo, setServerInfo] = useState<ChapterReaderServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [readingMode, setReadingMode] = useState<'long-strip' | 'single-page'>('long-strip');
    const [showControls, setShowControls] = useState(true);
    const [chapterList, setChapterList] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [showBottomBar, setShowBottomBar] = useState(false);
    const bottomBarTimeout = useRef<NodeJS.Timeout | null>(null);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

    useEffect(() => {
        if (!mangaId) return;
        getMangaFeed(mangaId)
            .then(feed => {
                const filtered = feed.filter(
                    ch => ch.id && ch.attributes?.translatedLanguage === 'en' && !(ch.attributes && 'externalUrl' in ch.attributes && ch.attributes.externalUrl)
                );
                setChapterList(filtered);
                if (filtered.length === 0) {
                    setError('No readable chapters found for this manga.');
                    setSelectedChapter(null);
                    return;
                }
                // Only update selectedChapter if it actually changes
                const found = filtered.find(ch => ch.id === chapterId) || filtered[0];
                if (found) {
                    setSelectedChapter(prev => (prev?.id !== found?.id ? found : prev));
                } else {
                    setError('No matching chapter found.');
                    setSelectedChapter(null);
                }
            })
            .catch(() => setError('Could not load chapter list.'));
    }, [mangaId, chapterId]);

    useEffect(() => {
        if (!selectedChapter || !selectedChapter.id) return;
        setLoading(true);
        setError(null);
        setPages([]);
        console.log('Fetching pages for chapter:', selectedChapter.id);
        getChapterPages(selectedChapter.id)
            .then(data => {
                                // Derive a safe, readable title. Chapter.attributes.title is a string or null per API.
                                const rawTitle = selectedChapter.attributes?.title ?? null;
                                const chapterNumber = selectedChapter.attributes?.chapter;
                                const title = (typeof rawTitle === 'string' && rawTitle.trim().length > 0)
                                    ? rawTitle.trim()
                                    : (chapterNumber ? `Chapter ${chapterNumber}` : 'Chapter');
                setServerInfo({
                  ...data,
                  mangaId: mangaId || '',
                  mangaTitle: title,
                  chapterId: selectedChapter.id,
                  totalChapters: chapterList.length
                });
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
    }, [selectedChapter, chapterList.length, mangaId]);

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

    // Show bottom bar on last page (long-strip mode) or on hover near bottom
    useEffect(() => {
      if (readingMode === 'long-strip') {
        const handleScroll = () => {
          const scrollY = window.scrollY || window.pageYOffset;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;
          // Show if user is within 120px of bottom
          if (windowHeight + scrollY >= docHeight - 120) {
            setShowBottomBar(true);
          } else {
            setShowBottomBar(false);
          }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }
    }, [readingMode, pages.length]);

    // Show bottom bar on hover (for both modes)
    const handleBottomBarMouseEnter = () => {
      setShowBottomBar(true);
      if (bottomBarTimeout.current) clearTimeout(bottomBarTimeout.current);
    };
    const handleBottomBarMouseLeave = () => {
      if (bottomBarTimeout.current) clearTimeout(bottomBarTimeout.current);
      bottomBarTimeout.current = setTimeout(() => setShowBottomBar(false), 600);
    };

    // For single-page mode, show on last page
    useEffect(() => {
      if (readingMode === 'single-page') {
        setShowBottomBar(currentImageIndex === pages.length - 1);
      }
    }, [readingMode, currentImageIndex, pages.length]);

        // Persist reading progress locally for Continue Reading section
        useEffect(() => {
            if (!serverInfo || !selectedChapter || pages.length === 0) return;
            const chapterNumber = selectedChapter.attributes?.chapter ?? null;
            saveReadingProgress({
                mangaId: serverInfo.mangaId,
                mangaTitle: serverInfo.mangaTitle,
                chapterId: selectedChapter.id,
                chapterNumber,
                page: currentImageIndex + 1,
                totalPages: pages.length,
            });
        }, [serverInfo, selectedChapter, currentImageIndex, pages.length]);

    const currentChapterIndex = chapterList.findIndex(ch => ch.id === (selectedChapter?.id || chapterId));
    const goToChapter = (index: number) => {
        if (index >= 0 && index < chapterList.length) {
            // Only navigate if chapter exists
            if (chapterList[index]?.id) {
                navigate(`/manga/${mangaId}/chapter/${chapterList[index].id}`);
            }
        }
    };
    const toggleControls = () => {
        setShowControls(!showControls);
    };
    // Add missing handleChapterSelect
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const idx = Number(e.target.value);
        if (!isNaN(idx) && idx >= 0 && idx < chapterList.length) {
            navigate(`/manga/${mangaId}/chapter/${chapterList[idx].id}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <span className="text-white text-xl">Loading chapter...</span>
        </div>
    );
    if (error) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <span className="text-red-400 text-xl">{error}</span>
        </div>
    );
    if (!serverInfo || pages.length === 0) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <span className="text-gray-400 text-xl">No pages found for this chapter.</span>
            {chapterList.length > 1 && (
                <Button onClick={() => goToChapter(currentChapterIndex + 1)} disabled={currentChapterIndex >= chapterList.length - 1}>
                    Try Next Chapter
                </Button>
            )}
        </div>
    );

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
                        {/* Chapter Title, Number, Dropdown, Arrows */}
                        <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-lg">{serverInfo?.mangaTitle}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={currentChapterIndex <= 0}
                                onClick={() => goToChapter(currentChapterIndex - 1)}
                                className="text-white hover:text-red-400"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <select
                                value={currentChapterIndex}
                                onChange={handleChapterSelect}
                                className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                                {chapterList.map((ch, idx) => (
                                    <option key={ch.id} value={idx}>
                                        Chapter {ch.attributes?.chapter || idx + 1} - {ch.attributes?.title || ''}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={currentChapterIndex >= chapterList.length - 1}
                                onClick={() => goToChapter(currentChapterIndex + 1)}
                                className="text-white hover:text-red-400"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
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
            {/* Main Content */}
            <div 
                className="pt-20 pb-28 cursor-pointer"
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
                {/* End of Chapter Navigation (Bottom Bar) */}
                <div
                  className={`fixed bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${showBottomBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  onMouseEnter={handleBottomBarMouseEnter}
                  onMouseLeave={handleBottomBarMouseLeave}
                  style={{background: 'rgba(24,24,27,0.95)', borderTop: '1px solid #27272a'}}
                >
                  <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Button
                        variant="outline"
                        disabled={currentChapterIndex <= 0}
                        onClick={() => goToChapter(currentChapterIndex - 1)}
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <div className="text-center flex-1 flex flex-col items-center">
                        <span className="text-white text-lg font-semibold">Rate this Chapter</span>
                        <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                                <Star key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                            ))}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        disabled={currentChapterIndex >= chapterList.length - 1}
                        onClick={() => goToChapter(currentChapterIndex + 1)}
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white disabled:opacity-50"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterReaderPage;