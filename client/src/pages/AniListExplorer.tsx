import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AniListMediaCard from '../components/anilist/AniListMediaCard';
import {
  UserProfileHeader,
  OverviewStats,
  GenreRadarChart,
  ScoreDistributionChart,
  TasteScatterChart,
  ContrarianPanel,
  BingeMetricsPanel,
  PopularityBiasPanel,
  TopStudiosPanel,
  GenreComparisonChart,
} from '../components/anilist/UserStatsComponents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tv,
  Book,
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  ChevronDown,
  Trophy,
  Flame,
  TrendingUp,
  Heart,
  Calendar,
  User as UserIcon,
  Filter,
  RefreshCw,
  Star,
} from 'lucide-react';
import {
  fetchTopMedia,
  fetchUserProfileAndStats,
  fetchUserMediaList,
  type MediaSort,
} from '../services/anilistService';
import {
  flattenEntries,
  computeTasteDifferences,
  computeBingeMetrics,
  computePopularityBias,
  computeGenrePreferences,
  computeStudioLoyalty,
} from '../utils/anilistAnalytics';

// ─────────────────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────────────────

interface SortOption {
  value: MediaSort;
  label: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'SCORE_DESC', label: 'Top Rated', icon: <Trophy className="w-3.5 h-3.5" /> },
  { value: 'POPULARITY_DESC', label: 'Most Popular', icon: <Heart className="w-3.5 h-3.5" /> },
  { value: 'TRENDING_DESC', label: 'Trending', icon: <Flame className="w-3.5 h-3.5" /> },
  { value: 'FAVOURITES_DESC', label: 'Most Favourite', icon: <Star className="w-3.5 h-3.5" /> },
  { value: 'START_DATE_DESC', label: 'Newest', icon: <Calendar className="w-3.5 h-3.5" /> },
];

const ANIME_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

const MANGA_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Historical', 'Isekai',
];

// ─────────────────────────────────────────────────────────
// Top Media Browser Tab (Anime or Manga)
// ─────────────────────────────────────────────────────────

interface MediaBrowserTabProps {
  type: 'ANIME' | 'MANGA';
}

const MediaBrowserTab: React.FC<MediaBrowserTabProps> = ({ type }) => {
  const [sort, setSort] = useState<MediaSort>('SCORE_DESC');
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState<string>('');
  const genres = type === 'ANIME' ? ANIME_GENRES : MANGA_GENRES;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['anilist-top', type, sort, page, genre],
    queryFn: () => fetchTopMedia(type, sort, page, 24, genre || undefined),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  const mediaList = data?.Page?.media ?? [];
  const pageInfo = data?.Page?.pageInfo;

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Top Rated';

  return (
    <div>
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Sort Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                sort === opt.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Genre Filter */}
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={genre}
            onChange={e => { setGenre(e.target.value); setPage(1); }}
            className="text-xs bg-muted border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {genre && (
            <button
              onClick={() => setGenre('')}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading from AniList…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-foreground font-semibold">Failed to load data</p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            {(error as Error)?.message || 'AniList API is unavailable. Try again in a moment.'}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && !isError && (
        <>
          {genre && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtered by:</span>
              <Badge variant="secondary" className="text-xs font-semibold">{genre}</Badge>
            </div>
          )}

          {mediaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-muted-foreground">No results found for this combination.</p>
              <Button variant="ghost" size="sm" onClick={() => { setGenre(''); setSort('SCORE_DESC'); }}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {mediaList.map((media, i) => (
                <AniListMediaCard
                  key={media.id}
                  media={media}
                  rank={(page - 1) * 24 + i + 1}
                  type={type}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pageInfo && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="text-xs"
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground font-semibold">
                Page {page}
                {pageInfo.lastPage ? ` of ${pageInfo.lastPage}` : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pageInfo.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// User Stats Tab
// ─────────────────────────────────────────────────────────

interface UserStatsTabProps {
  username: string | null;
  onUsernameSearch: (name: string) => void;
}

const UserStatsTab: React.FC<UserStatsTabProps> = ({ username, onUsernameSearch }) => {
  const [inputVal, setInputVal] = useState(username || '');
  const [activeStatType, setActiveStatType] = useState<'ANIME' | 'MANGA'>('ANIME');

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorObj,
  } = useQuery({
    queryKey: ['anilist-user-profile', username],
    queryFn: () => fetchUserProfileAndStats(username!),
    enabled: !!username,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const {
    data: animeListData,
    isLoading: animeListLoading,
  } = useQuery({
    queryKey: ['anilist-user-anime-list', username],
    queryFn: () => fetchUserMediaList(username!, 'ANIME'),
    enabled: !!username,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const {
    data: mangaListData,
    isLoading: mangaListLoading,
  } = useQuery({
    queryKey: ['anilist-user-manga-list', username],
    queryFn: () => fetchUserMediaList(username!, 'MANGA'),
    enabled: !!username,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Derived analytics from entry lists
  const entries = React.useMemo(() => {
    const listData = activeStatType === 'ANIME' ? animeListData : mangaListData;
    if (!listData?.MediaListCollection?.lists) return [];
    return flattenEntries(listData.MediaListCollection.lists);
  }, [activeStatType, animeListData, mangaListData]);

  const tastePoints = React.useMemo(() => computeTasteDifferences(entries), [entries]);
  const bingeMetrics = React.useMemo(() => computeBingeMetrics(entries), [entries]);
  const popularityBias = React.useMemo(() => computePopularityBias(entries), [entries]);
  const genrePrefs = React.useMemo(() => computeGenrePreferences(entries), [entries]);
  const studioLoyalty = React.useMemo(() => computeStudioLoyalty(entries), [entries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onUsernameSearch(inputVal.trim());
    }
  };

  // Empty state: no username entered yet
  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center border border-primary/30">
          <UserIcon className="w-9 h-9 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground mb-2">
            Analyze Any AniList Profile
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter a public AniList username to unlock deep insights: taste contrarian score, binge speed, genre DNA, studio loyalty, and more.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm">
          <Input
            type="text"
            placeholder="e.g. TheSensei, Gintama_fan123…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="bg-muted/50 border-border w-full h-11 text-base sm:text-sm rounded-xl"
            autoFocus
          />
          <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto shrink-0 h-11 px-6 rounded-xl font-bold">
            <Search className="w-4 h-4 mr-1.5" />
            Analyze
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground">
          Profile must be public on AniList. No login required.
        </p>
      </div>
    );
  }

  // Loading state
  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Fetching {username}'s profile…</p>
      </div>
    );
  }

  // Error state
  if (profileError) {
    const msg = (profileErrorObj as Error)?.message || '';
    const isNotFound = msg.toLowerCase().includes('not found') || msg.toLowerCase().includes("doesn't exist");
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div>
          <p className="text-base font-bold text-foreground">
            {isNotFound ? `User "${username}" not found` : 'Failed to load profile'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {isNotFound
              ? 'Make sure the username is spelled correctly and the profile is public.'
              : msg || 'AniList API may be temporarily unavailable.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onUsernameSearch('')}>
          Try another username
        </Button>
      </div>
    );
  }

  const user = profileData?.User;
  if (!user) return null;

  const listLoadingBoth = animeListLoading || mangaListLoading;
  const currentGenres = activeStatType === 'ANIME'
    ? user.statistics.anime.genres
    : user.statistics.manga.genres;
  const currentScores = activeStatType === 'ANIME'
    ? user.statistics.anime.scores
    : user.statistics.manga.scores;

  return (
    <div className="space-y-6">
      {/* Search again bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm">
        <Input
          type="text"
          placeholder="Search another username…"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          className="bg-muted/50 border-border text-sm"
        />
        <Button type="submit" variant="outline" size="sm" className="shrink-0">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Switch
        </Button>
      </form>

      {/* Profile Header */}
      <UserProfileHeader user={user} />

      {/* ANIME / MANGA Stat Type Toggle */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {(['ANIME', 'MANGA'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveStatType(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
              activeStatType === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
            }`}
          >
            {t === 'ANIME' ? <Tv className="w-3.5 h-3.5" /> : <Book className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
        {listLoadingBoth && (
          <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading list data…
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <OverviewStats user={user} activeType={activeStatType} />

      {/* Charts Row 1: Genre Radar + Score Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentGenres.length > 0 && (
          <GenreRadarChart genres={currentGenres} activeType={activeStatType} />
        )}
        {currentScores.length > 0 && (
          <ScoreDistributionChart scores={currentScores} />
        )}
      </div>

      {/* Advanced Analytics (from full list) */}
      {!listLoadingBoth && entries.length > 0 ? (
        <>
          {/* Taste vs Global */}
          {tastePoints.length > 5 && (
            <TasteScatterChart tastePoints={tastePoints} />
          )}

          {/* Genre Comparison + Popularity Bias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genrePrefs.length > 0 && (
              <GenreComparisonChart genrePrefs={genrePrefs} />
            )}
            <PopularityBiasPanel bias={popularityBias} />
          </div>

          {/* Contrarian Picks */}
          {tastePoints.length > 5 && (
            <ContrarianPanel tastePoints={tastePoints} />
          )}

          {/* Binge Metrics + Studio Loyalty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BingeMetricsPanel metrics={bingeMetrics} activeType={activeStatType} />
            {activeStatType === 'ANIME' && studioLoyalty.length > 0 && (
              <TopStudiosPanel studios={studioLoyalty} />
            )}
          </div>
        </>
      ) : !listLoadingBoth && entries.length === 0 && username ? (
        <div className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No {activeStatType.toLowerCase()} list data found. The list may be private.
          </p>
        </div>
      ) : null}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main AniList Explorer Page
// ─────────────────────────────────────────────────────────

const AniListExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabFromUrl = searchParams.get('tab') as 'anime' | 'manga' | 'stats' | null;
  const userFromUrl = searchParams.get('user') || null;

  const [activeTab, setActiveTab] = useState<'anime' | 'manga' | 'stats'>(tabFromUrl || 'anime');
  const [activeUser, setActiveUser] = useState<string | null>(userFromUrl);

  // Header search bar input
  const [headerInput, setHeaderInput] = useState(userFromUrl || '');

  const handleTabChange = useCallback((val: string) => {
    const tab = val as 'anime' | 'manga' | 'stats';
    setActiveTab(tab);
    const params: Record<string, string> = { tab };
    if (activeUser) params.user = activeUser;
    setSearchParams(params);
  }, [activeUser, setSearchParams]);

  const handleUsernameSearch = useCallback((name: string) => {
    setActiveUser(name || null);
    if (name) {
      setHeaderInput(name);
      setActiveTab('stats');
      setSearchParams({ tab: 'stats', user: name });
    } else {
      setHeaderInput('');
      setSearchParams({ tab: 'stats' });
    }
  }, [setSearchParams]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerInput.trim()) {
      handleUsernameSearch(headerInput.trim());
    }
  };

  return (
    <div className="main-content-frame bg-background text-foreground flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-blue-600 text-white rounded-lg shadow shadow-blue-600/30">
                  AniList
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Anime Hub & Analytics
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Browse top-rated anime &amp; manga worldwide, or enter any public AniList username to unlock deep personal analytics.
              </p>
            </div>

            {/* Quick username search */}
            <form onSubmit={handleHeaderSearch} className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[300px]">
              <div className="relative flex-1">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="AniList username…"
                  value={headerInput}
                  onChange={e => setHeaderInput(e.target.value)}
                  className="bg-muted/50 border-border pl-9 text-base sm:text-sm h-10 rounded-xl"
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-10 rounded-xl font-bold">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Analyze
              </Button>
            </form>
          </div>

          {/* Active user pill */}
          {activeUser && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Viewing analytics for:</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
                <UserIcon className="w-3 h-3" />
                {activeUser}
                <button
                  onClick={() => handleUsernameSearch('')}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              <a
                href={`https://anilist.co/user/${activeUser}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Open on AniList ↗
              </a>
            </div>
          )}
        </div>

        {/* ── Tab Navigation ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted/60 border border-border p-1 mb-6 h-auto w-full grid grid-cols-3 sm:inline-flex sm:w-auto gap-1">
            <TabsTrigger
              value="anime"
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/20"
            >
              <Tv className="w-3.5 h-3.5 shrink-0" />
              <span>Top Anime</span>
            </TabsTrigger>
            <TabsTrigger
              value="manga"
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-600/20"
            >
              <Book className="w-3.5 h-3.5 shrink-0" />
              <span>Top Manga</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Analytics</span>
              {activeUser && (
                <span className="hidden sm:inline ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black">
                  {activeUser}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime">
            <MediaBrowserTab type="ANIME" />
          </TabsContent>

          <TabsContent value="manga">
            <MediaBrowserTab type="MANGA" />
          </TabsContent>

          <TabsContent value="stats">
            <UserStatsTab
              username={activeUser}
              onUsernameSearch={handleUsernameSearch}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AniListExplorer;
