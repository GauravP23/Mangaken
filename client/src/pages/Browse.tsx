import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MangaCard from '../components/MangaCard';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { X, Search, Filter, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { browseManga, getMangaStatisticsBatch, BrowseParams } from '../services/mangaApi';
import { mapApiMangaToUICard } from '../utils';
import { Manga, UIManga } from '../types';

// Genre list with colors for badges
const GENRES_WITH_COLORS: { name: string; color: string }[] = [
  { name: 'Action', color: 'bg-red-500' },
  { name: 'Adventure', color: 'bg-orange-500' },
  { name: 'Comedy', color: 'bg-yellow-500' },
  { name: 'Drama', color: 'bg-purple-500' },
  { name: 'Fantasy', color: 'bg-indigo-500' },
  { name: 'Horror', color: 'bg-gray-700' },
  { name: 'Mystery', color: 'bg-slate-600' },
  { name: 'Romance', color: 'bg-pink-500' },
  { name: 'Sci-Fi', color: 'bg-cyan-500' },
  { name: 'Slice of Life', color: 'bg-green-500' },
  { name: 'Sports', color: 'bg-emerald-500' },
  { name: 'Supernatural', color: 'bg-violet-500' },
  { name: 'Thriller', color: 'bg-rose-600' },
  { name: 'Historical', color: 'bg-amber-600' },
  { name: 'School Life', color: 'bg-blue-400' },
  { name: 'Magic', color: 'bg-fuchsia-500' },
  { name: 'Martial Arts', color: 'bg-orange-600' },
  { name: 'Psychological', color: 'bg-gray-500' },
  { name: 'Isekai', color: 'bg-teal-500' },
  { name: 'Shounen', color: 'bg-blue-500' },
  { name: 'Shoujo', color: 'bg-pink-400' },
  { name: 'Seinen', color: 'bg-gray-600' },
  { name: 'Mecha', color: 'bg-zinc-500' },
  { name: 'Harem', color: 'bg-rose-400' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any Status' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DEMOGRAPHIC_OPTIONS = [
  { value: 'all', label: 'Any Demographic' },
  { value: 'shounen', label: 'Shounen' },
  { value: 'shoujo', label: 'Shoujo' },
  { value: 'seinen', label: 'Seinen' },
  { value: 'josei', label: 'Josei' },
];

const SORT_OPTIONS = [
  { value: 'followedCount', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'latestUploadedChapter', label: 'Latest Updates' },
  { value: 'createdAt', label: 'Newest Added' },
  { value: 'year', label: 'Release Year' },
  { value: 'title', label: 'Title A-Z' },
];

// Generate year options from current year to 1990
const YEAR_OPTIONS = [
  { value: 'all', label: 'Any Year' },
  ...Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  }),
];

const PAGE_SIZE = 24;

// Helper function to enhance manga data with batch statistics
const enhanceMangaWithBatchStats = async (mangaList: Manga[]): Promise<UIManga[]> => {
  const uiList = mangaList.map((apiManga) => mapApiMangaToUICard(apiManga));
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

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get('genres')?.split(',').filter(Boolean) || []
  );
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [demographic, setDemographic] = useState(searchParams.get('demographic') || 'all');
  const [year, setYear] = useState(searchParams.get('year') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'followedCount');
  
  // UI states
  const [showGenres, setShowGenres] = useState(false);
  const [mangaList, setMangaList] = useState<UIManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch manga when filters change
  const fetchManga = useCallback(async () => {
    setLoading(true);
    
    const params: BrowseParams = {
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
      sortBy,
    };

    if (debouncedQuery) params.query = debouncedQuery;
    if (selectedGenres.length > 0) params.genres = selectedGenres;
    if (status !== 'all') params.status = status;
    if (demographic !== 'all') params.demographic = demographic;
    if (year !== 'all') params.year = parseInt(year);

    try {
      const result = await browseManga(params);
      const enhanced = await enhanceMangaWithBatchStats(result.data);
      setMangaList(enhanced);
      setTotalResults(result.total);
    } catch (error) {
      console.error('Failed to fetch manga:', error);
      setMangaList([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedGenres, status, demographic, year, sortBy, currentPage]);

  useEffect(() => {
    fetchManga();
  }, [fetchManga]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
    if (status !== 'all') params.set('status', status);
    if (demographic !== 'all') params.set('demographic', demographic);
    if (year !== 'all') params.set('year', year);
    if (sortBy !== 'followedCount') params.set('sortBy', sortBy);
    setSearchParams(params);
  }, [debouncedQuery, selectedGenres, status, demographic, year, sortBy, setSearchParams]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setStatus('all');
    setDemographic('all');
    setYear('all');
    setSortBy('followedCount');
    setCurrentPage(1);
  };

  const getGenreColor = (genre: string) => {
    return GENRES_WITH_COLORS.find(g => g.name === genre)?.color || 'bg-gray-500';
  };

  const hasActiveFilters = searchQuery || selectedGenres.length > 0 || status !== 'all' || 
                           demographic !== 'all' || year !== 'all';

  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div className="main-content-frame bg-gray-950 min-h-screen">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Browse Manga</h1>
          <p className="text-gray-400 text-sm sm:text-base">Discover manga with advanced filters</p>
        </div>

        {/* Filter Bar - AniList Style */}
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 mb-6 border border-gray-800">
          {/* Main Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {/* Search */}
            <div className="col-span-2 sm:col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Genres Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowGenres(!showGenres)}
                className={`w-full justify-between bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 ${
                  selectedGenres.length > 0 ? 'border-orange-500 text-orange-400' : ''
                }`}
              >
                <span>Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}</span>
                {showGenres ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Year */}
            <Select value={year} onValueChange={(v) => { setYear(v); setCurrentPage(1); }}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {YEAR_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={status} onValueChange={(v) => { setStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Demographic */}
            <Select value={demographic} onValueChange={(v) => { setDemographic(v); setCurrentPage(1); }}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Demographic" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {DEMOGRAPHIC_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genres Grid - Expandable */}
          {showGenres && (
            <div className="border-t border-gray-700 pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Select Genres</h3>
                {selectedGenres.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGenres([])}
                    className="text-orange-400 hover:text-orange-300 h-7"
                  >
                    Clear Genres
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {GENRES_WITH_COLORS.map(({ name, color }) => (
                  <Badge
                    key={name}
                    variant="outline"
                    onClick={() => toggleGenre(name)}
                    className={`cursor-pointer transition-all ${
                      selectedGenres.includes(name)
                        ? `${color} text-white border-transparent`
                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              {/* Selected Genre Badges */}
              {selectedGenres.map(genre => (
                <Badge
                  key={genre}
                  className={`${getGenreColor(genre)} text-white cursor-pointer`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              
              {/* Clear All Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-400 hover:text-white h-7"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-300 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {loading ? 'Loading...' : `Showing ${mangaList.length} of ${totalResults} results`}
          </p>
        </div>

        {/* Manga Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-3 text-gray-400">Loading manga...</span>
          </div>
        ) : mangaList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8">
              {mangaList.map((manga, index) => (
                <MangaCard 
                  key={manga.id} 
                  manga={manga} 
                  size="medium"
                  showLanguageBadge={index % 5 === 0}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 ${
                          currentPage === pageNum 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No manga found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
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
