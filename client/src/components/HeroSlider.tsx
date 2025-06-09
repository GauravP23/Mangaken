import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Play, Bookmark } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Manga } from '../types';
import { mapApiMangaToUICard } from './MangaCard';

interface HeroSliderProps {
  mangaList: Manga[];
}

const HeroSlider = ({ mangaList }: HeroSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!mangaList.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mangaList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [mangaList.length]);

  if (!mangaList.length) return null;
  const currentManga = mapApiMangaToUICard(mangaList[currentSlide]);

  // Truncate description to 3 lines (about 240 chars, word boundary)
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
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />
      {/* Content */}
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
            {currentManga.genres.slice(0, 4).map((genre) => (
              <Badge key={genre} className="bg-gray-700/80 text-gray-200 border-gray-600">
                {genre}
              </Badge>
            ))}
          </div>
          <div className="flex gap-4">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-3 text-lg font-semibold">
              Read Now
            </Button>
            <Button size="lg" variant="outline" className="border-gray-400 text-white hover:bg-gray-800 px-8 py-3 text-lg font-semibold">
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
