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
      <div className="h-[100vh] flex items-center justify-center bg-gray-900 text-white text-xl">
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
    <div className="relative min-h-[75vh] overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${currentManga.image})`,
          filter: 'brightness(0.3) blur(2px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent z-0" />

      <div className="relative z-10 flex items-center justify-between min-h-[75vh]">
        <div className="flex flex-col justify-center max-w-xl pl-12 pr-4 py-12">
          <div className="mb-2 text-yellow-300 font-semibold text-lg">
            Chapters: {currentManga.chapters || 'N/A'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {currentManga.title}
          </h1>
          <p className="text-gray-200 text-base md:text-lg mb-4 max-w-lg">
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
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
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

        <div className="flex items-center justify-end h-full pr-16">
          <div className="relative w-48 h-64 rounded-xl shadow-2xl overflow-hidden border-4 border-white/10 bg-gray-900/80">
            <img
              src={currentManga.image}
              alt={currentManga.title}
              className="object-cover w-full h-full rounded-xl"
              onError={e => (e.currentTarget.src = '/placeholder.svg')}
              draggable={false}
            />
          </div>
        </div>
      </div>

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
