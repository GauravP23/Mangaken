
import React, { useState } from 'react';
import { genres } from '../data/mangaData';

interface GenreGridProps {
  onGenreClick?: (genre: string) => void;
}

const GenreGrid = ({ onGenreClick }: GenreGridProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => {
              setSelected(genre);
              onGenreClick?.(genre);
            }}
            className={
              `w-full py-3 sm:py-4 rounded-lg text-sm sm:text-base lg:text-lg font-medium transition-colors duration-150 border border-blue-500 ` +
              (selected === genre
                ? 'bg-purple-600 text-white'
                : 'bg-[#181e26] text-white hover:bg-[#232b39]')
            }
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreGrid;
