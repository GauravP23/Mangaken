import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Bookmark } from 'lucide-react';
import { Button } from './ui/button';
import { getHeroManga, getMangaFeed } from '../services/mangaApi';
import { useNavigate } from 'react-router-dom';

interface HeroManga {
  id: string;
  title: string;
  description: string;
  image: string;
  genres: string[];
  chapters?: number;
  rating?: number;
  status?: string;
  year?: number;
  author?: string;
  views?: number;
  demographic?: string;
  type?: string;
}

const HeroSlider = () => {
  const [mangaList, setMangaList] = useState<HeroManga[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingReadNow, setLoadingReadNow] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const list = await getHeroManga();
        if (isMounted) {
          setMangaList(list);
        }
      } catch (error) {
        console.error('Failed to fetch hero manga:', error);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!mangaList.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mangaList.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [mangaList.length]);

  if (!mangaList.length) {
    return (
      <div className="h-[45vh] flex flex-col items-center justify-center bg-card text-foreground text-base font-medium rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-md text-primary"></span>
          <span>Loading featured manga...</span>
        </div>
      </div>
    );
  }

  const currentManga = mangaList[currentSlide];

  function truncateDescription(desc: string, maxLen = 180) {
    if (!desc) return '';
    if (desc.length <= maxLen) return desc;
    const truncated = desc.slice(0, maxLen);
    return truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mangaList.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mangaList.length) % mangaList.length);
  };

  const handleReadNow = async () => {
    setLoadingReadNow(true);
    try {
      const chapters = await getMangaFeed(currentManga.id);
      const sorted = [...chapters].sort((a, b) => {
        const aNum = parseFloat(a.attributes?.chapter || '0');
        const bNum = parseFloat(b.attributes?.chapter || '0');
        return (isNaN(aNum) ? 1 : aNum) - (isNaN(bNum) ? 1 : bNum);
      });
      const firstChapter = sorted[0];
      if (firstChapter) {
        navigate(`/manga/${currentManga.id}/chapter/${firstChapter.id}`);
      } else {
        navigate(`/manga/${currentManga.id}`);
      }
    } catch {
      navigate(`/manga/${currentManga.id}`);
    } finally {
      setLoadingReadNow(false);
    }
  };

  // Format type/genres for stats box
  const formatGenreList = () => {
    if (currentManga.genres && currentManga.genres.length > 0) {
      return currentManga.genres.slice(0, 3).join(', ');
    }
    if (currentManga.demographic) {
      return `${currentManga.demographic}, Action, Fantasy`;
    }
    return 'Seinen, Horror, Action';
  };

  return (
    <div className="relative w-full overflow-hidden py-4 sm:py-8 group/hero select-none rounded-[2.5rem] bg-gradient-to-b from-[#e3edf7] via-[#ebf3fa] to-[#e3edf7] dark:from-slate-950 dark:via-background dark:to-slate-950 border border-border/40 shadow-inner">
      {/* Full-bleed Manga Panel Wallpaper Overlay (Desaturated dual-panel background framing the floating hero card) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-between items-center opacity-30 dark:opacity-20 grayscale contrast-125">
        {/* Left background artwork panel */}
        <div className="w-1/2 h-full relative">
          <img
            src={currentManga.image}
            alt=""
            className="w-full h-full object-cover object-left filter scale-110 -translate-x-10 blur-[1px]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-background" />
        </div>
        {/* Right background artwork panel */}
        <div className="w-1/2 h-full relative">
          <img
            src={currentManga.image}
            alt=""
            className="w-full h-full object-cover object-right filter scale-110 translate-x-10 blur-[1px]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/40 to-background" />
        </div>
      </div>

      {/* Main Floating Hero Card */}
      <div className="relative z-10 max-w-6xl mx-auto my-2 sm:my-4 bg-white/40 dark:bg-card/45 backdrop-blur-md border border-white/70 dark:border-border/60 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 min-h-[440px] overflow-hidden">
        {/* Left Side Accent Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-20 bg-[#124d73] dark:bg-primary rounded-r-full shadow-md shadow-primary/40 hidden sm:block" />

        {/* Left Column: Info & Actions */}
        <div className="w-full md:w-[55%] lg:w-[52%] flex flex-col justify-center space-y-4 text-left z-10">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-[#124d73] dark:bg-primary text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              MANGA
            </span>
            <span className="bg-slate-100/70 dark:bg-muted/70 text-slate-700 dark:text-muted-foreground border border-slate-200/60 dark:border-border/60 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
              {currentManga.status ? currentManga.status.toUpperCase() : 'ONGOING'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-foreground leading-tight line-clamp-2 drop-shadow-xs">
            {currentManga.title}
          </h1>

          {/* Synopsis */}
          <p className="text-slate-700 dark:text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-3 font-normal">
            {truncateDescription(currentManga.description, 210)}
          </p>

          {/* Stats Box (Animekai / Anilist style) */}
          <div className="bg-white/35 dark:bg-muted/20 border border-white/60 dark:border-border/40 rounded-2xl p-3 sm:p-4 max-w-lg shadow-xs grid grid-cols-4 gap-2 text-left backdrop-blur-xs">
            <div className="pr-2">
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-0.5">RATING</span>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 dark:text-foreground flex items-center gap-1">
                <span>{currentManga.rating && currentManga.rating > 0 ? currentManga.rating.toFixed(1) : '8.8'}</span>
                <span className="text-amber-400 text-xs">★</span>
              </div>
            </div>
            <div className="border-l border-slate-200 dark:border-border/60 pl-3 pr-2">
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-0.5">RELEASE</span>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 dark:text-foreground truncate">
                {currentManga.year || '2023'}
              </div>
            </div>
            <div className="border-l border-slate-200 dark:border-border/60 pl-3 pr-2">
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-0.5">FORMAT</span>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 dark:text-foreground capitalize truncate">
                {currentManga.type || 'Manga'}
              </div>
            </div>
            <div className="border-l border-slate-200 dark:border-border/60 pl-3">
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-0.5">TYPE</span>
              <div className="text-xs sm:text-xs font-bold text-slate-800 dark:text-foreground truncate capitalize" title={formatGenreList()}>
                {formatGenreList()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleReadNow}
              disabled={loadingReadNow}
              className="bg-[#3880a3] hover:bg-[#2b6582] dark:bg-primary dark:hover:bg-primary/90 text-white font-bold rounded-full px-8 py-3 text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border-none h-auto"
            >
              {loadingReadNow ? (
                <span>LOADING...</span>
              ) : (
                <span>EXPLORE</span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setBookmarked(!bookmarked)}
              className={`rounded-2xl border border-slate-200 dark:border-border p-3 h-auto transition-all shadow-xs ${bookmarked ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-background hover:bg-slate-100 dark:hover:bg-muted text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
                }`}
              title={bookmarked ? 'Bookmarked' : 'Add to Bookmark'}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Right Column: Character Artwork & Watermark */}
        <div className="w-full md:w-[45%] lg:w-[48%] relative flex items-center justify-center min-h-[260px] sm:min-h-[320px] md:min-h-[360px] overflow-hidden rounded-2xl">
          {/* Kanji Typography Watermark */}
          <div className="absolute inset-0 flex flex-col justify-center items-center select-none pointer-events-none opacity-[0.08] dark:opacity-[0.14] z-0 font-serif leading-none tracking-widest text-slate-900 dark:text-foreground text-center">
            <span className="text-6xl sm:text-7xl md:text-8xl font-black">東京</span>
            <span className="text-5xl sm:text-6xl md:text-7xl font-bold mt-1">喰種</span>
            <span className="text-xs sm:text-sm tracking-widest font-sans uppercase mt-2 opacity-80">{currentManga.title}</span>
          </div>

          {/* Featured Manga Artwork / Character Cutout */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
            <img
              key={currentManga.id}
              src={currentManga.image}
              alt={currentManga.title}
              className="max-h-[280px] sm:max-h-[340px] md:max-h-[380px] w-auto object-contain rounded-2xl drop-shadow-2xl transition-all duration-700 hover:scale-[1.02]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>

          {/* Floating Pagination Controls (< 5 / 10 >) */}
          <div className="absolute bottom-3 right-3 z-20 bg-[#0c1c36] dark:bg-card/95 text-white border border-white/10 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-3 shadow-lg backdrop-blur-md">
            <button
              onClick={prevSlide}
              className="hover:text-cyan-400 transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="tracking-wider text-[11px] font-bold">
              {currentSlide + 1} / {mangaList.length}
            </span>
            <button
              onClick={nextSlide}
              className="hover:text-cyan-400 transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
