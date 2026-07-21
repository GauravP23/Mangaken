import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getHeroManga, getMangaFeed } from '../services/mangaApi';
import { useNavigate } from 'react-router-dom';

// Type for hero slider items
interface HeroManga {
  id: string;
  title: string;
  description: string;
  image: string;
  genres: string[];
  chapters: number;
}

const HeroSlider = () => {
  const [mangaList, setMangaList] = useState<HeroManga[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingReadNow, setLoadingReadNow] = useState(false);
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
    }, 6000);
    return () => clearInterval(timer);
  }, [mangaList.length]);

  if (!mangaList.length) {
    return (
      <div className="h-[40vh] flex items-center justify-center bg-black text-white text-xl">
        <span className="loading mr-3"></span>
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
        return (isNaN(aNum) ? 1 : aNum) - (isNaN(bNum) ? 1 : bNum);
      });
      const firstChapter = sorted[0];
      if (firstChapter) {
        navigate(`/manga/${currentManga.id}/chapter/${firstChapter.id}`);
      } else {
        alert('No chapters found for this manga.');
      }
    } catch {
      alert('Failed to fetch chapters.');
    } finally {
      setLoadingReadNow(false);
    }
  };

  const handleViewInfo = () => {
    navigate(`/manga/${currentManga.id}`);
  };

  return (
    <div className="relative h-[50vh] sm:h-[60vh] min-h-[350px] sm:min-h-[400px] overflow-hidden text-white bg-[#0B0C0E] w-full group border-b border-white/[0.05]">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentManga.image})`,
          filter: 'brightness(0.2) blur(3px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/50 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0E] via-[#0B0C0E]/70 to-transparent z-0" />

    <div className="px-4 sm:px-6 lg:px-8 mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between h-full container">
      <div className="flex flex-col justify-center w-full md:max-w-xl h-full py-4 md:py-10 overflow-hidden md:ml-10">
        <div className="mb-3 flex-shrink-0">
          <span className="bg-white/10 text-white backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-lg border border-white/10 shadow-sm">
            Chapters: {currentManga.chapters || 'N/A'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-tight text-white flex-shrink-0 tracking-tight">
          {currentManga.title}
        </h1>
        <p className="text-gray-300 text-sm md:text-base mb-5 max-w-lg overflow-hidden line-clamp-3 leading-relaxed">
          {truncateDescription(currentManga.description, 180)}
        </p>
        <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
          {currentManga.genres?.slice(0, 4).map((genre) => (
            <Badge key={genre} className="bg-white/[0.04] border border-white/[0.08] text-gray-300 text-xs px-3.5 py-1 rounded-full hover:bg-[#FF5C00]/20 hover:border-[#FF5C00]/50 hover:text-white transition-all cursor-default">
              {genre}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Button
            size="default"
            className="bg-[#FF5C00] hover:bg-[#FF8C00] text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-[#FF5C00]/30 border-none w-full sm:w-auto transition-all hover:-translate-y-0.5"
            onClick={handleReadNow}
            disabled={loadingReadNow}
          >
            {loadingReadNow ? (
              <>
                <span className="loading mr-2"></span>
                Loading...
              </>
            ) : (
              'Read Now'
            )}
          </Button>
          <Button
            size="default"
            variant="outline"
            className="bg-white/5 hover:bg-white/10 text-white border-white/10 px-6 py-2.5 rounded-xl text-sm font-bold w-full sm:w-auto transition-all"
            onClick={handleViewInfo}
          >
            View Info
          </Button>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-end h-full md:mr-10">
        <div className="relative w-32 h-44 md:w-40 md:h-56 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-600 bg-black/80 film-poster">
          <img
            src={currentManga.image}
            alt={currentManga.title}
            className="object-cover w-full h-full rounded-lg film-poster-img"
            onError={e => (e.currentTarget.src = '/placeholder.svg')}
            draggable={false}
          />
        </div>
      </div>
    </div>

      {/* Navigation Controls - side arrows, only visible on hover */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden group-hover:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none w-12 h-12 rounded-full z-20 transition-opacity duration-200"
        onClick={prevSlide}
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="hidden group-hover:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none w-12 h-12 rounded-full z-20 transition-opacity duration-200"
        onClick={nextSlide}
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default HeroSlider;
