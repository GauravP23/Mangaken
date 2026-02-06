import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Star, Users, BookOpen, Trophy, TrendingUp, Loader2 } from 'lucide-react';
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
  'Slice of Life': 'bg-green-500',
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
    case 'completed': return 'bg-emerald-500';
    case 'ongoing': return 'bg-blue-500';
    case 'hiatus': return 'bg-amber-500';
    default: return 'bg-gray-500';
  }
};

// Get rank badge style
const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
  if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
  if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
  return 'bg-gray-700 text-white';
};

const TopManga = () => {
  const [mangaList, setMangaList] = useState<UIManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

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
    <div className="main-content-frame bg-gray-950 min-h-screen">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Top Manga</h1>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              Ranked lists using trending, popular and most-followed data
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="inline-flex bg-gray-900/80 border border-gray-800 rounded-full p-1 text-xs sm:text-sm">
              {([
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
              ] as const).map(option => (
                <button
                  key={option.key}
                  onClick={() => setTimeRange(option.key)}
                  className={`px-4 py-1 rounded-full transition-colors ${
                    timeRange === option.key
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
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
            <div className="bg-gray-900/60 rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{mangaList.length}</div>
              <div className="text-xs text-gray-400">Total Ranked</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-4 text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {mangaList[0]?.rating ? mangaList[0].rating.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-400">#1 Rating</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {mangaList[0]?.views ? formatNumber(mangaList[0].views) : '—'}
              </div>
              <div className="text-xs text-gray-400">#1 Followers</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-4 text-center">
              <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {mangaList.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-3 text-gray-400">Loading top manga...</span>
          </div>
        ) : (
          <>
            {/* Ranking List */}
            <div className="space-y-3">
              {mangaList.slice(0, visibleCount).map((manga, index) => {
                const rank = index + 1;
                return (
                  <Link
                    key={manga.id}
                    to={`/manga/${manga.id}`}
                    className="block"
                  >
                    <div className={`bg-gray-900/60 hover:bg-gray-800/80 rounded-lg p-3 sm:p-4 transition-all border border-gray-800 hover:border-gray-700 ${
                      rank <= 3 ? 'border-l-4' : ''
                    } ${rank === 1 ? 'border-l-yellow-500' : rank === 2 ? 'border-l-gray-400' : rank === 3 ? 'border-l-amber-600' : ''}`}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Rank */}
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg font-bold text-lg ${getRankStyle(rank)}`}>
                          #{rank}
                        </div>

                        {/* Cover Image */}
                        <div className="w-12 h-16 sm:w-16 sm:h-22 flex-shrink-0">
                          <img
                            src={manga.image || '/placeholder.svg'}
                            alt={manga.title}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1 mb-1">
                            {manga.title}
                          </h3>
                          
                          {/* Genre Badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {manga.genres.slice(0, 4).map((genre) => (
                              <Badge
                                key={genre}
                                className={`${GENRE_COLORS[genre] || 'bg-gray-600'} text-white text-[10px] px-1.5 py-0`}
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>

                          {/* Meta Info - Mobile Hidden */}
                          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
                            {manga.author && (
                              <span>by {manga.author}</span>
                            )}
                            {manga.year && (
                              <span>{manga.year}</span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 text-right">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-white font-semibold text-sm">
                              {manga.rating ? (manga.rating * 10).toFixed(0) + '%' : '—'}
                            </span>
                          </div>

                          {/* Followers */}
                          <div className="hidden sm:flex items-center gap-1 text-gray-400 text-sm">
                            <Users className="w-4 h-4" />
                            <span>{manga.views ? formatNumber(manga.views) : '—'}</span>
                          </div>

                          {/* Chapters */}
                          <div className="hidden md:flex items-center gap-1 text-gray-400 text-sm">
                            <BookOpen className="w-4 h-4" />
                            <span>{manga.chapters || '—'} ch</span>
                          </div>

                          {/* Status Badge */}
                          <Badge className={`${getStatusColor(manga.status)} text-white text-xs capitalize`}>
                            {manga.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More Button */}
            {visibleCount < mangaList.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8"
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
