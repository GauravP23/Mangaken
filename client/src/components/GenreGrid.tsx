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
          className="text-lg font-semibold w-full p-3  rounded-lg border-2 border-red-400 text-red-400 bg-[#13131a] transition-all duration-200 hover:shadow-[0_0_16px_2px_rgba(239,68,68,0.5)] hover:border-red-500 hover:text-red-400"
          onClick={() => onGenreClick?.(genre)}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};

export default GenreGrid;
