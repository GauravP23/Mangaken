import React, { useState } from 'react';
import { genres } from '../data/mangaData';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface GenreGridProps {
  onGenreClick?: (genre: string) => void;
}

// These genre icons are just examples - in a real app, you might want to use actual icons
const genreIcons: Record<string, string> = {
  'Action': '🥊',
  'Adventure': '🗺️',
  'Comedy': '😂',
  'Drama': '🎭',
  'Fantasy': '🧙‍♂️',
  'Horror': '👻',
  'Mystery': '🔍',
  'Romance': '❤️',
  'Sci-Fi': '🚀',
  'Slice of Life': '☕',
  'Sports': '⚽',
  'Supernatural': '👽',
  'Thriller': '😱',
  'Historical': '📜',
  'School': '🏫',
  'Magic': '✨',
  'Martial Arts': '🥋',
  'Psychological': '🧠'
};

// Generate random background color for each genre
const getGenreColor = (genre: string) => {
  const colors = [
    'from-red-500 to-rose-900',
    'from-blue-500 to-indigo-900',
    'from-green-500 to-emerald-900',
    'from-purple-500 to-violet-900',
    'from-yellow-500 to-amber-900',
    'from-pink-500 to-fuchsia-900',
    'from-indigo-500 to-blue-900',
    'from-orange-500 to-red-900'
  ];
  
  // Use genre name to consistently select a color
  const index = genre.charCodeAt(0) % colors.length;
  return colors[index];
};

const GenreGrid = ({ onGenreClick }: GenreGridProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  // Filter genres based on search term
  const filteredGenres = genres.filter(genre => 
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Display limited genres unless showAll is true
  const displayedGenres = showAll ? filteredGenres : filteredGenres.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-gray-900 border border-gray-700 text-white w-full pl-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Search genres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Genre grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedGenres.map((genre) => (
          <button
            key={genre}
            className={`relative group h-24 rounded-lg overflow-hidden bg-gradient-to-br ${getGenreColor(genre)} transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-900/30`}
            onClick={() => onGenreClick?.(genre)}
          >
            {/* Overlay for hover effect */}
            <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity"></div>
            
            {/* Icon */}
            <div className="absolute top-3 left-3 text-2xl">
              {genreIcons[genre] || '📚'}
            </div>
            
            {/* Genre name */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="font-bold text-white text-lg">{genre}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Show more/less button */}
      {filteredGenres.length > 12 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800 hover:text-red-400"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show More Genres
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GenreGrid;
