import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MangaCard from '../components/MangaCard';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { X } from 'lucide-react';
import { genres } from '../data/mangaData';
import { getLatestManga, getPopularManga, getMangaStatisticsBatch } from '../services/mangaApi';
import { mapApiMangaToUICard } from '../utils';
import { Manga, UIManga } from '../types';

// Helper function to enhance manga data with batch statistics for the provided list
const enhanceMangaWithBatchStats = async (mangaList: Manga[]): Promise<UIManga[]> => {
    const uiList = mangaList.map((apiManga) => {
        const baseUI = mapApiMangaToUICard(apiManga);
        return baseUI;
    });

    // Gather IDs for batch stats
    const ids = mangaList.map(m => m.id);
    try {
        const statsMap = await getMangaStatisticsBatch(ids);
        return uiList.map((ui) => {
            const stats = statsMap[ui.id];
            return {
                ...ui,
                rating: typeof stats?.rating === 'number' ? stats.rating : (ui.rating ?? 0),
                views: typeof stats?.follows === 'number' ? stats.follows : (ui.views ?? 0),
            } as UIManga;
        });
    } catch {
        return uiList;
    }
};

// Utility to deduplicate manga by id, works for any object with an id
function uniqueManga<T extends { id: string }>(mangaList: T[]): T[] {
    const seen = new Set<string>();
    return mangaList.filter((manga) => {
        if (seen.has(manga.id)) return false;
        seen.add(manga.id);
        return true;
    });
}

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get('genre') ? [searchParams.get('genre')!] : []
  );
  const [sortBy, setSortBy] = useState('rating');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allManga, setAllManga] = useState<UIManga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real manga data from API
    setLoading(true);
    Promise.all([
      getLatestManga(20, 0),
      getPopularManga(20, 0),
      getPopularManga(20, 20) // Get more for variety
    ]).then(async ([latest, popular1, popular2]) => {
      const combinedData = [...latest, ...popular1, ...popular2];
      const uniqueData = uniqueManga(combinedData);
      const enhancedData = await enhanceMangaWithBatchStats(uniqueData);
      setAllManga(enhancedData);
    }).catch((error) => {
      console.error('Failed to fetch manga data:', error);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

    const filteredManga = useMemo(() => {
    let filtered = allManga;

    // Filter by genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(manga =>
        selectedGenres.some(genre => manga.genres.includes(genre))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(manga => manga.status.toLowerCase() === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'chapters':
          return (b.chapters || 0) - (a.chapters || 0);
        case 'latest':
          // Sort by last update if available, otherwise by rating
          if (a.lastUpdate && b.lastUpdate) {
            return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
          }
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allManga, selectedGenres, statusFilter, sortBy]);

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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Browse Manga</h1>
          <p className="text-gray-400 text-sm sm:text-base">Discover your next favorite manga</p>
        </div>
        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Filters</h2>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {genres.map(genre => (
                <Button
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleGenre(genre)}
                  className={`text-xs sm:text-sm ${selectedGenres.includes(genre) 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                  }`}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          {/* Sort and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-lg">Loading manga...</div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-400">
                Showing {filteredManga.length} results
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
              {filteredManga.map(manga => (
                <MangaCard key={manga.id} manga={manga} size="medium" />
              ))}
            </div>

            {filteredManga.length === 0 && (
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Browse;
