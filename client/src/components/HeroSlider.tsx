import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { mapApiMangaToUICard } from './MangaCard';
import { useNavigate } from 'react-router-dom';
import { searchManga, getMangaFeed, getMangaChapterCount } from '../services/mangaApi';
import type { Manga as UIManga } from '../data/mangaData';

const HERO_MANGA_TITLES = [
  'Hunter x Hunter',
  'One-Punch Man',
  'One Piece',
  'Steel Ball Run',
  'Vagabond',
  'Tokyo Ghoul',
  'Kokou no Hito',
  'Fire Punch',
  'Billy Bat',
  'Planetes',
  'The Fragrant Flower Blooms With Dignity',
];

const HeroSlider = () => {
  const [mangaList, setMangaList] = useState<UIManga[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingReadNow, setLoadingReadNow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const fetched = await Promise.all(
        HERO_MANGA_TITLES.map(async (title) => {
          try {
            const results = await searchManga(title, 1, 0);
            if (results && results.length > 0) {
              const uiManga = mapApiMangaToUICard(results[0]);
              // Fetch real chapter count
              const chapterCount = await getMangaChapterCount(uiManga.id);
              return { ...uiManga, chapters: chapterCount };
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      if (isMounted) {
        setMangaList(fetched.filter(Boolean) as UIManga[]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!mangaList.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mangaList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [mangaList.length]);

  if (!mangaList.length) {
    return (
      <div className="h-[80vh] flex items-center justify-center bg-gray-900 text-white text-xl">
        Loading featured manga...
      </div>
    );
  }

  const currentManga = mangaList[currentSlide];

  function truncateDescription(desc: string, maxLen = 240) {
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
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return aNum - bNum;
      });
      const firstChapter = sorted[0];
      if (firstChapter) {
        navigate(`/manga/${currentManga.id}/chapter/${firstChapter.id}`);
      } else {
        alert('No chapters found for this manga.');
      }
    } catch (e) {
      alert('Failed to fetch chapters.');
    } finally {
      setLoadingReadNow(false);
    }
  };

  const handleViewInfo = () => {
    navigate(`/manga/${currentManga.id}`);
  };

  return (
    <div className="relative h-[80vh] overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      {/* Background Image with Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentManga.image})`,
          filter: 'brightness(0.3) blur(2px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />
      <div className="relative z-10 h-full flex items-center justify-between">
        {/* Details Left */}
        <div className="flex flex-col justify-center max-w-xl pl-12 pr-4 py-12">
          <div className="mb-2 text-yellow-300 font-semibold text-lg">
            Chapters: {currentManga.chapters || 'N/A'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight line-clamp-2">
            {currentManga.title}
          </h1>
          <p className="text-gray-200 text-base md:text-lg mb-4 line-clamp-3 max-w-lg">
            {truncateDescription(currentManga.description)}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {currentManga.genres?.slice(0, 4).map((genre) => (
              <Badge key={genre} className="bg-gray-700/80 text-gray-200 border-gray-600">
                {genre}
              </Badge>
            ))}
          </div>
          <div className="flex gap-4">
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-3 text-lg font-semibold"
              onClick={handleReadNow}
              disabled={loadingReadNow}
            >
              {loadingReadNow ? 'Loading...' : 'Read Now'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-400 text-white hover:bg-gray-800 px-8 py-3 text-lg font-semibold"
              onClick={handleViewInfo}
            >
              View Info
            </Button>
          </div>
        </div>
        {/* Cover Card Right */}
        <div className="flex items-center justify-end h-full pr-16">
          <div className="relative w-56 h-80 rounded-xl shadow-2xl overflow-hidden border-4 border-white/10 bg-gray-900/80">
            <img
              src={currentManga.image}
              alt={currentManga.title}
              className="object-cover w-full h-full rounded-xl shadow-lg"
              draggable={false}
              onError={e => (e.currentTarget.src = '/placeholder.svg')}
            />
          </div>
        </div>
      </div>
      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white border-none w-12 h-12 rounded-full"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white border-none w-12 h-12 rounded-full"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
      {/* Slide Indicators */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4">
        <span className="text-white text-lg font-medium">
          {currentSlide + 1} / {mangaList.length}
        </span>
        <div className="flex gap-2">
          {mangaList.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-red-600 w-8' : 'bg-white/30 hover:bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
