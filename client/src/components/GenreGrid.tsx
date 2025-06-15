import { genres } from '../data/mangaData';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface GenreGridProps {
  onGenreClick?: (genre: string) => void;
}

const GenreGrid = ({ onGenreClick }: GenreGridProps) => {
  return (
    <div className="grid grid-cols-6 gap-4 mt-4">
      {genres.map((genre) => (
        <button
          key={genre}
          className="text-lg md:text-xl font-bold w-full h-16 md:h-14 px-8 py-3 border border-white text-white bg-[#0b101a] transition-all duration-200 hover:bg-[#13131a] hover:border-red-500 hover:text-red-400 shadow-none flex items-center justify-center"
          onClick={() => onGenreClick?.(genre)}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};

export default GenreGrid;
