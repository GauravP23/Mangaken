import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MangaCard from '../components/MangaCard';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { X } from 'lucide-react';
import { genres, topManga, latestUpdates, trendingManga } from '../data/mangaData';
import { getMangaChapterCount } from '../services/mangaApi';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get('genre') ? [searchParams.get('genre')!] : []
  );
  const [sortBy, setSortBy] = useState('rating');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chapterCounts, setChapterCounts] = useState<{ [id: string]: number }>({});

  const allManga = useMemo(() => [...trendingManga, ...topManga, ...latestUpdates], []);

  useEffect(() => {
    // Fetch chapter counts for all manga in Browse page
    const ids = allManga.map(m => m.id);
    Promise.all(ids.map(async (id) => {
      const count = await getMangaChapterCount(id).catch(() => 0);
      return { id, count };
    })).then(results => {
      const counts: { [id: string]: number } = {};
      results.forEach(({ id, count }) => { counts[id] = count; });
      setChapterCounts(counts);
    });
  }, [allManga]);

  const filteredAndSortedManga = useMemo(() => {
    let filtered = allManga.filter(manga => {
      const genreMatch = selectedGenres.length === 0 || 
        selectedGenres.some(genre => manga.genres.includes(genre));
      const statusMatch = statusFilter === 'all' || manga.status === statusFilter;
      return genreMatch && statusMatch;
    });
    // Remove duplicates
    filtered = filtered.filter((manga, index, self) => 
      index === self.findIndex(m => m.id === manga.id)
    );
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'views':
          return b.views - a.views;
        case 'chapters':
          return b.chapters - a.chapters;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'latest':
          return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
        default:
          return 0;
      }
    });
    // Add real chapter count to each manga
    return filtered.map(manga => ({ ...manga, chapters: chapterCounts[manga.id] ?? manga.chapters }));
  }, [allManga, selectedGenres, statusFilter, sortBy, chapterCounts]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearGenres = () => {
    setSelectedGenres([]);
    setSearchParams({});
  };

  return (
    <div className="main-content-frame bg-gray-950 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Manga</h1>
          <p className="text-gray-400">Discover your next favorite manga</p>
        </div>
        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
          {/* Genres */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">Genres</h3>
              {selectedGenres.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearGenres}
                  className="text-orange-400 hover:text-orange-300"
                >
                  Clear All
                </Button>
              )}
            </div>
            {selectedGenres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedGenres.map(genre => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {genres.map(genre => (
                <Button
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleGenre(genre)}
                  className={selectedGenres.includes(genre) 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                  }
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          {/* Sort and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="chapters">Chapter Count</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="latest">Latest Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredAndSortedManga.length} results
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
          {filteredAndSortedManga.map(manga => (
            <MangaCard key={manga.id} manga={manga} size="medium" />
          ))}
        </div>

        {filteredAndSortedManga.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No manga found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
              onClick={clearGenres}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Browse;
