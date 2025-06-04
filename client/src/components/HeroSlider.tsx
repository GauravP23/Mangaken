import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Play, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trendingManga } from '@/data/mangaData';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingManga.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % trendingManga.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + trendingManga.length) % trendingManga.length);
  };

  const currentManga = trendingManga[currentSlide];

  return (
    <div className="relative h-[80vh] overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentManga.image})`,
          filter: 'brightness(0.2) blur(1px)',
        }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-8">
          <div className="max-w-3xl">
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {currentManga.title}
            </h1>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-yellow-400" />
                <span className="text-white font-medium">{currentManga.rating}</span>
              </div>
              <div className="flex gap-2">
                {currentManga.genres.slice(0, 3).map((genre) => (
                  <Badge 
                    key={genre} 
                    className="bg-gray-700/80 text-gray-200 hover:bg-gray-600/80 border-gray-600"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              <span className="text-gray-300">{currentManga.chapters} chapters</span>
            </div>

            {/* Description */}
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
              {currentManga.description}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-medium flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                READ NOW
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg font-medium flex items-center gap-2"
              >
                <Bookmark className="w-5 h-5" />
                Add to Library
              </Button>
            </div>
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
          {currentSlide + 1} / {trendingManga.length}
        </span>
        <div className="flex gap-2">
          {trendingManga.map((_, index) => (
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
