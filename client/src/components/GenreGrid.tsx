import { genres } from '@/data/mangaData';
import { Button } from '@/components/ui/button';

interface GenreGridProps {
  onGenreClick?: (genre: string) => void;
}

const GenreGrid = ({ onGenreClick }: GenreGridProps) => {
  const genreColors = [
    'bg-red-500 hover:bg-red-600',
    'bg-blue-500 hover:bg-blue-600',
    'bg-green-500 hover:bg-green-600',
    'bg-purple-500 hover:bg-purple-600',
    'bg-yellow-500 hover:bg-yellow-600',
    'bg-pink-500 hover:bg-pink-600',
    'bg-indigo-500 hover:bg-indigo-600',
    'bg-teal-500 hover:bg-teal-600'
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {genres.map((genre, index) => (
        <Button
          key={genre}
          variant="default"
          className={`${genreColors[index % genreColors.length]} text-white h-12 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          onClick={() => onGenreClick?.(genre)}
        >
          {genre}
        </Button>
      ))}
    </div>
  );
};

export default GenreGrid;
