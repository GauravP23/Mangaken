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

function toProxyCover(url?: string): string | undefined {
  if (!url) return url;
  try {
    if (url.startsWith('http') && url.includes('/uploads.mangadex.org/covers/')) {
      const u = new URL(url);
      // pathname like: /covers/<id>/<fileName>.256.jpg or .512.jpg
      const parts = u.pathname.split('/').filter(Boolean);
      const idIdx = parts.indexOf('covers') + 1;
      const id = parts[idIdx];
      const fileWithSize = parts[idIdx + 1];
      // fileWithSize = <fileName>.256.jpg  -> need <fileName>
      const fileName = fileWithSize.replace(/\.(256|512)\.jpg$/i, '');
      return `/api/manga/cover/${id}/${fileName}?size=512`;
    }
  } catch {
    // ignore URL parsing errors
  }
  return url;
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
  const heroImg = toProxyCover(currentManga.image) || '/placeholder.svg';

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
    <div className="relative h-[60vh] min-h-[400px] overflow-hidden text-white bg-black w-full group">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${heroImg})`,
          filter: 'brightness(0.3) blur(2px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent z-0" />

    <div className="px-8 mx-auto relative z-10 flex items-center justify-between h-full container">
      <div className="flex flex-col justify-center max-w-xl h-full py-4 md:py-10 overflow-hidden" style={{ marginLeft: '2.5rem' }}>
        <div className="mb-2 text-gray-300 font-semibold text-sm flex-shrink-0">
          Chapters: {currentManga.chapters || 'N/A'}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight text-white flex-shrink-0">
          {currentManga.title}
        </h1>
        <p className="text-gray-300 text-sm md:text-base mb-4 max-w-lg overflow-hidden line-clamp-3">
          {truncateDescription(currentManga.description, 180)}
        </p>
        <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
          {currentManga.genres?.slice(0, 4).map((genre) => (
            <Badge key={genre} className="bg-gray-800/80 text-gray-300 border-gray-600">
              {genre}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            size="default"
            className="btn-primary px-6 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none"
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
            className="border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2 text-sm font-semibold"
            onClick={handleViewInfo}
          >
            View Info
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end h-full" style={{ marginRight: '2.5rem' }}>
        <div className="relative w-32 h-44 md:w-40 md:h-56 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-600 bg-black/80 film-poster">
          <img
            src={heroImg}
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
