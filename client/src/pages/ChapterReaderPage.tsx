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
    const [fitMode, setFitMode] = useState<'fit-container' | 'fit-width' | 'fit-height'>('fit-container');
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerSearch, setDrawerSearch] = useState('');
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

    const filteredDrawerChapters = chapterList.filter(ch => {
        const title = ch.attributes?.title || '';
        const num = ch.attributes?.chapter || '';
        const q = drawerSearch.toLowerCase();
        return title.toLowerCase().includes(q) || num.toLowerCase().includes(q);
    });

    const getFitClass = () => {
        if (fitMode === 'fit-width') return 'w-full max-w-full';
        if (fitMode === 'fit-height') return 'max-h-[92vh] w-auto mx-auto object-contain';
        return 'max-w-4xl mx-auto w-full';
    };

    return (
        <div className="chapter-reader-page min-h-screen bg-slate-950 text-foreground relative">
            {/* Top Header Controls */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link to={`/manga/${serverInfo.mangaId}`}>
                                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Back to Manga</span>
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                                    <Home className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Chapter Title & Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold text-sm sm:text-base line-clamp-1 max-w-[200px] sm:max-w-md">{serverInfo?.mangaTitle}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={currentChapterIndex <= 0}
                                onClick={() => goToChapter(currentChapterIndex - 1)}
                                className="text-foreground hover:text-primary"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <select
                                value={currentChapterIndex}
                                onChange={handleChapterSelect}
                                className="bg-card text-foreground px-3 py-1.5 rounded-xl border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {chapterList.map((ch, idx) => (
                                    <option key={ch.id} value={idx}>
                                        Ch. {ch.attributes?.chapter || idx + 1} {ch.attributes?.title ? `- ${ch.attributes.title}` : ''}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={currentChapterIndex >= chapterList.length - 1}
                                onClick={() => goToChapter(currentChapterIndex + 1)}
                                className="text-foreground hover:text-primary"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Fit Modes & Drawer Toggle */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Fit Mode Toggle */}
                            <div className="hidden sm:flex bg-card border border-border rounded-xl p-1 text-xs">
                                <button
                                    onClick={() => setFitMode('fit-container')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${fitMode === 'fit-container' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    Normal
                                </button>
                                <button
                                    onClick={() => setFitMode('fit-width')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${fitMode === 'fit-width' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    Full Width
                                </button>
                                <button
                                    onClick={() => setFitMode('fit-height')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${fitMode === 'fit-height' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    Fit Screen
                                </button>
                            </div>

                            {/* Chapter List Drawer Toggle */}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowDrawer(true)}
                                className="text-foreground hover:text-primary"
                                title="Open Chapter List Drawer"
                            >
                                <List className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* In-Reader Chapter Drawer */}
            {showDrawer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-card border-l border-border h-full p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                                <List className="w-5 h-5 text-primary" />
                                Chapter Select
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowDrawer(false)} className="rounded-full w-8 h-8 p-0">
                                ✕
                            </Button>
                        </div>

                        {/* Search Input */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search chapter number or title..."
                                value={drawerSearch}
                                onChange={(e) => setDrawerSearch(e.target.value)}
                                className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Chapter List */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                            {filteredDrawerChapters.map((ch) => {
                                const indexInList = chapterList.findIndex(c => c.id === ch.id);
                                const isCurrent = ch.id === selectedChapter?.id;
                                return (
                                    <button
                                        key={ch.id}
                                        onClick={() => {
                                            goToChapter(indexInList);
                                            setShowDrawer(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${
                                            isCurrent
                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                                        }`}
                                    >
                                        <span className="line-clamp-1">
                                            Ch. {ch.attributes?.chapter || '?'} {ch.attributes?.title ? `- ${ch.attributes.title}` : ''}
                                        </span>
                                        {isCurrent && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Active</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Pages */}
            <div 
                className="pt-20 pb-28 cursor-pointer min-h-screen"
                onClick={toggleControls}
            >
                <div className={getFitClass()}>
                    {pages.map((pageUrl, index) => (
                        <div key={index} className="mb-1 flex justify-center">
                            <img
                                src={pageUrl}
                                alt={`Page ${index + 1}`}
                                className={`block ${fitMode === 'fit-height' ? 'max-h-[92vh] w-auto object-contain' : 'w-full h-auto'}`}
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
                  style={{background: 'rgba(15,23,42,0.95)', borderTop: '1px solid #1e293b'}}
                >
                  <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Button
                        variant="outline"
                        disabled={currentChapterIndex <= 0}
                        onClick={() => goToChapter(currentChapterIndex - 1)}
                        className="border-primary/40 text-primary hover:bg-primary hover:text-white font-bold disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <div className="text-center flex-1 flex flex-col items-center">
                        <span className="text-white text-base font-bold">Rate this Chapter</span>
                        <div className="flex gap-1 mt-0.5">
                            {[1,2,3,4,5].map(star => (
                                <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                            ))}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        disabled={currentChapterIndex >= chapterList.length - 1}
                        onClick={() => goToChapter(currentChapterIndex + 1)}
                        className="border-primary/40 text-primary hover:bg-primary hover:text-white font-bold disabled:opacity-50"
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