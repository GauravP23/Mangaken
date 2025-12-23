import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getEnhancedRecommendations } from '../services/hybridApi';
import { EnhancedRecommendation } from '../types';

interface RecommendationsProps {
  mangaId: string;
}

/**
 * Enhanced Recommendations Component
 * Shows AniList recommendations with MangaDex reading links
 */
const EnhancedRecommendations: React.FC<RecommendationsProps> = ({ mangaId }) => {
  const [recommendations, setRecommendations] = useState<EnhancedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mangaId) return;

    setLoading(true);
    setError('');

    getEnhancedRecommendations(mangaId)
      .then(data => {
        setRecommendations(data || []);
      })
      .catch(err => {
        console.error('Error loading recommendations:', err);
        setError('Failed to load recommendations');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mangaId]);

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-white mb-4">Recommended for You</h2>
        <div className="text-gray-400">Loading recommendations...</div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
        <Badge variant="secondary" className="ml-2">
          Powered by AniList
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.mangadexId}
            to={`/manga/${rec.mangadexId}`}
            className="group"
          >
            <Card className="bg-gray-900 border-gray-800 hover:border-primary transition-all duration-300 overflow-hidden">
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={rec.coverImage || '/placeholder.svg'}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {rec.averageScore && (
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-white">
                      {rec.averageScore / 10}
                    </span>
                  </div>
                )}
              </div>
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
                  {rec.title}
                </CardTitle>
                {rec.genres && rec.genres.length > 0 && (
                  <CardDescription className="text-xs text-gray-400 line-clamp-1">
                    {rec.genres.slice(0, 2).join(', ')}
                  </CardDescription>
                )}
              </CardHeader>
              {rec.popularity && (
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{(rec.popularity / 1000).toFixed(1)}k readers</span>
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          Recommendations based on community data from AniList
        </p>
      </div>
    </div>
  );
};

export default EnhancedRecommendations;
