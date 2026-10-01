import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MangaCard from '../components/MangaCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Star, Users, BookOpen, Trophy, TrendingUp, Loader2, LayoutGrid, List } from 'lucide-react';
import { getMostViewedManga, getMangaStatisticsBatch, getTrendingManga, getPopularManga } from '../services/mangaApi';
import { mapApiMangaToUICard } from '../utils';
import { Manga, UIManga } from '../types';

// Genre colors mapping
const GENRE_COLORS: Record<string, string> = {
  'Action': 'bg-red-500',
  'Adventure': 'bg-orange-500',
  'Comedy': 'bg-yellow-500',
  'Drama': 'bg-purple-500',
  'Fantasy': 'bg-indigo-500',
  'Horror': 'bg-gray-700',
  'Mystery': 'bg-slate-600',
  'Romance': 'bg-pink-500',
  'Sci-Fi': 'bg-cyan-500',
  'Slice of Life': 'bg-emerald-600',
  'Sports': 'bg-emerald-500',
  'Supernatural': 'bg-violet-500',
  'Thriller': 'bg-rose-600',
  'Historical': 'bg-amber-600',
  'School Life': 'bg-blue-400',
  'Magic': 'bg-fuchsia-500',
  'Martial Arts': 'bg-orange-600',
  'Psychological': 'bg-gray-500',
  'Isekai': 'bg-teal-500',
  'Shounen': 'bg-blue-500',
  'Shoujo': 'bg-pink-400',
  'Seinen': 'bg-gray-600',
};

// Helper to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Helper to enhance manga with stats
const enhanceMangaWithStats = async (mangaList: Manga[]): Promise<UIManga[]> => {
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

// Get badge color for status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-600 text-white';
    case 'ongoing': return 'bg-primary text-primary-foreground';
    case 'hiatus': return 'bg-amber-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Get rank badge style
const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black shadow-md shadow-amber-500/20';
  if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-bold';
  if (rank === 3) return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold';
  return 'bg-muted text-foreground border border-border font-bold';
};

const TopManga = () => {
  const [mangaList, setMangaList] = useState<UIManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const fetchTopManga = async () => {
      setLoading(true);
      try {
        let data: Manga[] = [];
        if (timeRange === 'today') {
          data = await getTrendingManga(100, 0);
        } else if (timeRange === 'week') {
          data = await getPopularManga(100, 0);
        } else {
          data = await getMostViewedManga(100, 0);
        }
        const enhanced = await enhanceMangaWithStats(data);
        // Sort by views (followers) descending
        enhanced.sort((a, b) => (b.views || 0) - (a.views || 0));
        setMangaList(enhanced);
        setVisibleCount(20);
      } catch (error) {
        console.error('Failed to fetch top manga:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopManga();
  }, [timeRange]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, mangaList.length));
  };

  return (
    <div className="main-content-frame bg-background min-h-screen">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Top Manga</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ranked lists using trending, popular and most-followed data
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex bg-card border border-border rounded-xl p-1 text-xs shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted'
                }`}
                title="Ranked List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Time Filter */}
            <div className="inline-flex bg-card border border-border rounded-xl p-1 text-xs sm:text-sm shadow-sm">
              {([
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
              ] as const).map(option => (
                <button
                   key={option.key}
                   onClick={() => setTimeRange(option.key)}
                   className={`px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                     timeRange === option.key
                       ? 'bg-primary text-primary-foreground font-bold'
                       : 'text-muted-foreground hover:bg-muted'
                   }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && mangaList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{mangaList.length}</div>
              <div className="text-xs text-muted-foreground">Total Ranked</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {mangaList[0]?.rating ? mangaList[0].rating.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">#1 Rating</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {mangaList[0]?.views ? formatNumber(mangaList[0].views) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">#1 Followers</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <BookOpen className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {mangaList.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading top manga...</span>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Grid View Mode */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mangaList.slice(0, visibleCount).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} size="medium" />
                ))}
              </div>
            ) : (
              /* Ranked Table List View Mode (AniList Style) */
              <div className="space-y-3">
                {mangaList.slice(0, visibleCount).map((manga, index) => {
                  const rank = index + 1;
                  return (
                    <Link
                      key={manga.id}
                      to={`/manga/${manga.id}`}
                      className="block"
                    >
                      <div className={`bg-card hover:bg-muted/70 rounded-2xl p-3 sm:p-4 transition-all border border-border hover:border-primary/40 shadow-xs ${
                        rank <= 3 ? 'border-l-4' : ''
                      } ${rank === 1 ? 'border-l-amber-400' : rank === 2 ? 'border-l-slate-400' : rank === 3 ? 'border-l-amber-700' : ''}`}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Rank */}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl text-base sm:text-lg ${getRankStyle(rank)}`}>
                            #{rank}
                          </div>

                          {/* Cover Image */}
                          <div className="w-14 h-20 sm:w-16 sm:h-24 flex-shrink-0 overflow-hidden rounded-xl border border-border shadow-xs">
                            <img
                              src={manga.image || '/placeholder.svg'}
                              alt={manga.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground font-bold text-sm sm:text-base line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                              {manga.title}
                            </h3>
                            
                            {/* Genre Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {manga.genres.slice(0, 3).map((genre) => (
                                <Badge
                                  key={genre}
                                  className={`${GENRE_COLORS[genre] || 'bg-slate-600'} text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-md border-none font-semibold`}
                                >
                                  {genre}
                                </Badge>
                              ))}
                            </div>

                            {/* Meta Info */}
                            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-medium">
                              {manga.author && (
                                <span>by {manga.author}</span>
                              )}
                              {manga.year && (
                                <span>Release: {manga.year}</span>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 text-right">
                            {/* Rating */}
                            <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-foreground font-bold text-sm">
                                {manga.rating && manga.rating > 0 ? manga.rating.toFixed(1) : '—'}
                              </span>
                            </div>

                            {/* Followers */}
                            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground text-sm font-semibold">
                              <Users className="w-4 h-4 text-primary" />
                              <span>{manga.views ? formatNumber(manga.views) : '—'}</span>
                            </div>

                            {/* Status Badge */}
                            <Badge className={`${getStatusColor(manga.status)} text-xs capitalize font-bold rounded-lg px-2.5 py-1 border-none`}>
                              {manga.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < mangaList.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-2.5 rounded-xl shadow-md"
                >
                  Load More ({mangaList.length - visibleCount} remaining)
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

export default TopManga;

