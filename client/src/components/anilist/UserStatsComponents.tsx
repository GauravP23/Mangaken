import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Tv, Book, Clock, Star, Target, Zap, BarChart3, TrendingUp, TrendingDown, Trophy, RefreshCw, Eye, User as UserIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { AniListUser } from '../../services/anilistService';
import { formatWatchTime, formatCount, getDisplayTitle } from '../../services/anilistService';
import type {
  TastePoint,
  BingeMetrics,
  PopularityBias,
  GenrePreference,
  StudioLoyalty,
  RatingDistribution,
} from '../../utils/anilistAnalytics';
import { getContrarianPicks } from '../../utils/anilistAnalytics';

// ─────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // tailwind class
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, accent = 'text-primary' }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/40 transition-colors">
    <div className={`p-2 rounded-lg bg-muted mt-0.5 ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">{label}</p>
      <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Profile Header
// ─────────────────────────────────────────────────────────

interface UserProfileHeaderProps {
  user: AniListUser;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user }) => {
  const joinYear = user.createdAt
    ? new Date(user.createdAt * 1000).getFullYear()
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border mb-6">
      {/* Banner */}
      {user.bannerImage ? (
        <div className="h-32 sm:h-40 w-full overflow-hidden">
          <img
            src={user.bannerImage}
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-primary/40 via-blue-600/30 to-purple-600/30" />
      )}

      {/* User info row */}
      <div className="bg-card px-5 py-4 flex items-end gap-4 -mt-10">
        <div className="relative z-10 flex-shrink-0">
          {user.avatar?.large ? (
            <img
              src={user.avatar.large}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-card shadow-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-card shadow-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-foreground truncate">{user.name}</h2>
            <Badge variant="secondary" className="text-[10px] font-bold uppercase">
              AniList
            </Badge>
            {joinYear && (
              <span className="text-xs text-muted-foreground">since {joinYear}</span>
            )}
          </div>
          <a
            href={`https://anilist.co/user/${user.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-0.5 inline-block"
          >
            anilist.co/user/{user.name} ↗
          </a>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Anime/Manga Overview Stats
// ─────────────────────────────────────────────────────────

interface OverviewStatsProps {
  user: AniListUser;
  activeType: 'ANIME' | 'MANGA';
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ user, activeType }) => {
  const stats = activeType === 'ANIME' ? user.statistics.anime : user.statistics.manga;
  const animeStats = user.statistics.anime;
  const mangaStats = user.statistics.manga;

  if (!stats) return null;

  const completedStatus = stats.statuses?.find(s => s.status === 'COMPLETED');
  const totalEntries = stats.count || 0;
  const completionRate =
    totalEntries > 0 && completedStatus
      ? Math.round((completedStatus.count / totalEntries) * 100)
      : 0;

  return (
    <div>
      {/* Dual type switcher summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Tv className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Anime</p>
            <p className="text-2xl font-black">{formatCount(animeStats?.count || 0)}</p>
            <p className="text-xs text-muted-foreground">{formatWatchTime(animeStats?.minutesWatched || 0)} watched</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Book className="w-8 h-8 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Manga</p>
            <p className="text-2xl font-black">{formatCount(mangaStats?.count || 0)}</p>
            <p className="text-xs text-muted-foreground">{formatCount(mangaStats?.chaptersRead || 0)} chapters read</p>
          </div>
        </div>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Total Entries"
          value={formatCount(stats.count)}
          accent="text-primary"
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label="Mean Score"
          value={stats.meanScore > 0 ? (stats.meanScore / 10).toFixed(2) : '—'}
          sub={`Std Dev: ±${((stats.standardDeviation || 0) / 10).toFixed(1)}`}
          accent="text-amber-500"
        />
        {activeType === 'ANIME' ? (
          <>
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Watch Time"
              value={formatWatchTime(animeStats.minutesWatched)}
              sub={`${formatCount(animeStats.episodesWatched)} episodes`}
              accent="text-blue-500"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={<Book className="w-4 h-4" />}
              label="Chapters Read"
              value={formatCount(mangaStats.chaptersRead)}
              sub={`${formatCount(mangaStats.volumesRead)} volumes`}
              accent="text-rose-500"
            />
          </>
        )}
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Completion Rate"
          value={`${completionRate}%`}
          sub={`${completedStatus?.count || 0} of ${totalEntries}`}
          accent="text-emerald-500"
        />
      </div>

      {/* Status breakdown */}
      {stats.statuses && stats.statuses.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            List Status Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {stats.statuses.map(s => {
              const colorMap: Record<string, string> = {
                COMPLETED: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                CURRENT: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                PLANNING: 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400',
                DROPPED: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400',
                PAUSED: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                REPEATING: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
              };
              const label: Record<string, string> = {
                COMPLETED: 'Completed',
                CURRENT: activeType === 'ANIME' ? 'Watching' : 'Reading',
                PLANNING: 'Plan to Watch',
                DROPPED: 'Dropped',
                PAUSED: 'Paused',
                REPEATING: 'Rewatching',
              };
              return (
                <div
                  key={s.status}
                  className={`rounded-lg border px-3 py-2.5 text-center ${colorMap[s.status] || 'border-border bg-card text-foreground'}`}
                >
                  <p className="text-lg font-black">{s.count}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                    {label[s.status] || s.status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Genre Radar Chart
// ─────────────────────────────────────────────────────────

interface GenreRadarProps {
  genres: { genre: string; count: number; meanScore: number }[];
  activeType: 'ANIME' | 'MANGA';
}

export const GenreRadarChart: React.FC<GenreRadarProps> = ({ genres, activeType }) => {
  const top = genres.slice(0, 8);
  const data = top.map(g => ({
    genre: g.genre,
    count: g.count,
    score: g.meanScore > 0 ? Math.round(g.meanScore / 10) : 0,
  }));

  const color = activeType === 'ANIME' ? '#3b82f6' : '#f43f5e';

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Top Genres — Count
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="genre"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 600 }}
          />
          <Radar
            dataKey="count"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--popover-foreground)',
            }}
            formatter={(v: number) => [v, 'Entries']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Score Distribution Bar Chart
// ─────────────────────────────────────────────────────────

interface ScoreDistributionProps {
  scores: { score: number; count: number }[];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionProps> = ({ scores }) => {
  const data = scores
    .filter(s => s.score > 0)
    .slice()
    .sort((a, b) => a.score - b.score)
    .map(s => ({
      score: `${s.score}`,
      count: s.count,
    }));

  const getBarColor = (score: string) => {
    const n = Number(score);
    if (n >= 90) return '#10b981';
    if (n >= 70) return '#3b82f6';
    if (n >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" />
        Rating Distribution
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="score"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--popover-foreground)',
            }}
            formatter={(v: number) => [v, 'Titles']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.score} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Taste Divergence Scatter Chart
// ─────────────────────────────────────────────────────────

interface TasteScatterProps {
  tastePoints: TastePoint[];
}

export const TasteScatterChart: React.FC<TasteScatterProps> = ({ tastePoints }) => {
  const data = tastePoints.slice(0, 80).map(t => ({
    x: t.globalScore,
    y: t.userScore,
    title: t.title,
    delta: t.delta,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
        <Target className="w-4 h-4" />
        Your Taste vs Global (User Score vs AniList Mean)
      </h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Dots above the diagonal = you rated higher than average · Below = lower
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[40, 100]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            label={{ value: 'Global Score', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[40, 100]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            label={{ value: 'Your Score', angle: -90, position: 'insideLeft', offset: 15, style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine
            segment={[{ x: 40, y: 40 }, { x: 100, y: 100 }]}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--popover-foreground)',
            }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="p-2 max-w-[180px]">
                  <p className="font-bold text-xs line-clamp-2">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    You: {d.y} · Global: {d.x}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 ${d.delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {d.delta > 0 ? '+' : ''}{d.delta}
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill="hsl(var(--primary))"
            fillOpacity={0.65}
            stroke="hsl(var(--primary))"
            strokeWidth={0.5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Contrarian Picks Panel
// ─────────────────────────────────────────────────────────

interface ContrarianPanelProps {
  tastePoints: TastePoint[];
}

export const ContrarianPanel: React.FC<ContrarianPanelProps> = ({ tastePoints }) => {
  const { lovedMore, lovedLess } = getContrarianPicks(tastePoints);

  const renderList = (items: TastePoint[], positive: boolean) => (
    <div className="space-y-2.5">
      {items.map(t => (
        <div key={t.id} className="flex items-center gap-3">
          {t.coverImage && (
            <img
              src={t.coverImage}
              alt={t.title}
              className="w-10 h-14 object-cover rounded-lg flex-shrink-0 border border-border shadow-xs"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">{t.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">You: {t.userScore}</span>
              <span className="text-xs text-muted-foreground">· Global: {t.globalScore}</span>
              <span className={`text-xs font-bold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                {positive ? '+' : ''}{t.delta}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Hidden Gems (You Loved More)
        </h3>
        {lovedMore.length > 0 ? renderList(lovedMore, true) : (
          <p className="text-xs text-muted-foreground">Not enough data yet.</p>
        )}
      </div>
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Overrated (You Liked Less)
        </h3>
        {lovedLess.length > 0 ? renderList(lovedLess, false) : (
          <p className="text-xs text-muted-foreground">Not enough data yet.</p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Binge Metrics Panel
// ─────────────────────────────────────────────────────────

interface BingeMetricsPanelProps {
  metrics: BingeMetrics;
  activeType: 'ANIME' | 'MANGA';
}

export const BingeMetricsPanel: React.FC<BingeMetricsPanelProps> = ({ metrics, activeType }) => (
  <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
      <Zap className="w-4 h-4" />
      {activeType === 'ANIME' ? 'Binge & Viewing' : 'Reading'} Habits
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label="Avg Days to Finish"
        value={metrics.avgDaysToComplete > 0 ? `${metrics.avgDaysToComplete}d` : '—'}
        sub="Per completed title"
        accent="text-blue-500"
      />
      <StatCard
        icon={<Trophy className="w-4 h-4" />}
        label="Fastest Finish"
        value={metrics.fastestEntry ? `${metrics.fastestEntry.days}d` : '—'}
        sub={metrics.fastestEntry?.title ? metrics.fastestEntry.title.slice(0, 20) + '…' : ''}
        accent="text-amber-500"
      />
      <StatCard
        icon={<RefreshCw className="w-4 h-4" />}
        label="Total Rewatches"
        value={metrics.totalRewatches}
        sub="Repeated entries"
        accent="text-purple-500"
      />
      <StatCard
        icon={<Target className="w-4 h-4" />}
        label="Completion Rate"
        value={`${metrics.completionRate}%`}
        sub={`${metrics.completedCount} completed`}
        accent="text-emerald-500"
      />
      {metrics.slowestEntry && (
        <div className="col-span-2 sm:col-span-3 bg-muted/30 border border-border/50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Slowest Completion</p>
          <p className="text-sm font-bold mt-0.5 line-clamp-1">{metrics.slowestEntry.title}</p>
          <p className="text-xs text-muted-foreground">{metrics.slowestEntry.days} days</p>
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Popularity Bias Panel
// ─────────────────────────────────────────────────────────

interface PopularityBiasPanelProps {
  bias: PopularityBias;
}

export const PopularityBiasPanel: React.FC<PopularityBiasPanelProps> = ({ bias }) => {
  const pieData = [
    { name: 'Niche (< 5K)', value: bias.nicheCount, fill: '#8b5cf6' },
    { name: 'Mid-tier', value: bias.midtierCount, fill: '#3b82f6' },
    { name: 'Mainstream (> 100K)', value: bias.mainstreamCount, fill: '#f59e0b' },
  ].filter(d => d.value > 0);

  const biasColorMap: Record<string, string> = {
    'Niche Explorer': 'text-purple-500',
    'Mainstream Fan': 'text-amber-500',
    'Balanced Watcher': 'text-blue-500',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Popularity Bias
      </h3>
      <p className={`text-lg font-black mb-3 ${biasColorMap[bias.biasLabel] || 'text-primary'}`}>
        {bias.biasLabel}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map(entry => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--popover-foreground)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.fill }} />
              <span className="text-xs text-foreground flex-1">{d.name}</span>
              <span className="text-xs font-bold text-foreground">{d.value}</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-1">
            Avg popularity: {formatCount(bias.avgPopularity)} users
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Top Studios Panel
// ─────────────────────────────────────────────────────────

interface TopStudiosPanelProps {
  studios: StudioLoyalty[];
}

export const TopStudiosPanel: React.FC<TopStudiosPanelProps> = ({ studios }) => {
  const top = studios.slice(0, 8);
  const maxCount = Math.max(...top.map(s => s.count), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Favourite Studios
      </h3>
      <div className="space-y-3">
        {top.map((studio, i) => (
          <div key={studio.studioId} className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <a
                  href={`https://anilist.co/studio/${studio.studioId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
                >
                  {studio.studioName}
                </a>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {studio.avgUserScore > 0 && (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-500" />
                      {(studio.avgUserScore / 10).toFixed(1)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{studio.count}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${(studio.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Genre Preferences Comparison Bar Chart
// ─────────────────────────────────────────────────────────

interface GenreComparisonChartProps {
  genrePrefs: GenrePreference[];
}

export const GenreComparisonChart: React.FC<GenreComparisonChartProps> = ({ genrePrefs }) => {
  const top = genrePrefs.filter(g => g.avgUserScore > 0).slice(0, 10);
  const data = top.map(g => ({
    genre: g.genre.length > 12 ? g.genre.slice(0, 11) + '…' : g.genre,
    fullGenre: g.genre,
    you: g.avgUserScore,
    global: g.avgGlobalScore,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Your Scores vs Global by Genre
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 30, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="genre"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            domain={[40, 100]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--popover-foreground)',
            }}
            formatter={(v: number, name: string) => [v, name === 'you' ? 'Your Score' : 'Global Avg']}
            labelFormatter={(_: unknown, payload: {payload?: {fullGenre?: string}}[]) => payload?.[0]?.payload?.fullGenre || ''}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => value === 'you' ? 'Your Score' : 'Global Avg'}
          />
          <Bar dataKey="global" fill="hsl(var(--muted-foreground))" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
          <Bar dataKey="you" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
