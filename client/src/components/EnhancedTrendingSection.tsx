import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Star, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getEnhancedTrendingManga } from '../services/hybridApi';
import { EnhancedTrendingManga } from '../types';

/**
 * Enhanced Trending Section
 * Uses AniList trending data with MangaDex reading links
 */
const EnhancedTrendingSection: React.FC = () => {
  const [trending, setTrending] = useState<EnhancedTrendingManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEnhancedTrendingManga(10)
      .then(data => {
        setTrending(data || []);
        setError('');
      })
      .catch(err => {
        console.error('Error loading trending manga:', err);
        setError('Failed to load trending manga');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Trending Now</h2>
        </div>
        <div className="text-gray-400">Loading trending manga...</div>
      </div>
    );
  }

  if (error || trending.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Trending Now</h2>
          <Badge variant="secondary" className="ml-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Live from AniList
          </Badge>
        </div>
        <Link 
          to="/browse?sort=trending" 
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {trending.map((manga, index) => (
          <Link
            key={manga.mangadexId || manga.anilistId}
            to={`/manga/${manga.mangadexId}`}
            className="relative group"
          >
            {/* Trending Rank Badge */}
            {index < 3 && (
              <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg">
                #{index + 1}
              </div>
            )}
            
            <Card className="bg-gray-900 border-gray-800 hover:border-primary transition-all duration-300 overflow-hidden">
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={manga.coverImage || '/placeholder.svg'}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {manga.averageScore && (
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-white">
                      {(manga.averageScore / 10).toFixed(1)}
                    </span>
                  </div>
                )}
                {/* Trending Score Indicator */}
                {manga.trending && (
                  <div className="absolute bottom-2 right-2 bg-orange-500/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">
                      {manga.trending}
                    </span>
                  </div>
                )}
              </div>
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
                  {manga.title}
                </CardTitle>
              </CardHeader>
              {manga.popularity && (
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{(manga.popularity / 1000).toFixed(1)}k readers</span>
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          Trending manga updated hourly based on AniList community activity
        </p>
      </div>
    </div>
  );
};

export default EnhancedTrendingSection;
