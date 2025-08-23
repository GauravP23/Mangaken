
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getMangaDetails, searchManga, getMangaFeed, getMangaChapterCount } from '../services/mangaApi';
import { Star, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { Manga, Relationship } from '../types';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<(Manga & { chapters: number; author: string; rating: number; follows: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError('');
    searchManga(query, 30, 0)
      .then(async (data) => {
        // For each manga, fetch chapter count and author
        const withDetails = await Promise.all(
          data.map(async (manga: Manga) => {
            let chapters = 0;
            let author = '';
            let follows = 0;
            let rating = 0;
            try {
              chapters = await getMangaChapterCount(manga.id);
            } catch (err) {
              console.error('Error fetching chapter count:', err);
            }
            try {
              const details = await getMangaDetails(manga.id);
              const authorRel = details.relationships?.find((r: Relationship) => r.type === 'author');
              author = (authorRel?.attributes as { name?: string })?.name || '';
              // Fetch statistics for rating and follows
              const statsRes = await axios.get(`/api/manga/statistics/${manga.id}`);
              if (statsRes.data && statsRes.data.statistics && statsRes.data.statistics[manga.id]) {
                const stat = statsRes.data.statistics[manga.id];
                rating = typeof stat.rating === 'object' ? (stat.rating.bayesian ?? stat.rating.average ?? 0) : stat.rating ?? 0;
                follows = stat.follows ?? 0;
              }
            } catch (err) {
              console.error('Error fetching manga details or stats:', err);
            }
            return { ...manga, chapters, author, rating, follows };
          })
        );
        setResults(withDetails);
      })
      .catch(() => setError('Failed to fetch search results.'))
      .finally(() => setLoading(false));
  }, [query]);

return (
  <div className="main-content-frame bg-gray-950 min-h-screen flex flex-col">
    <Header />
    <div className="flex-1">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Search Results for "{query}"</h1>
        {loading && <div className="text-white text-sm sm:text-base">Loading...</div>}
        {error && <div className="text-red-400 text-sm sm:text-base">{error}</div>}
        {!loading && !error && results.length === 0 && (
          <div className="text-gray-400 text-sm sm:text-base">No results found.</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {results.map((manga) => {
            const coverRel = manga.relationships?.find((r: Relationship) => r.type === 'cover_art');
            const image = coverRel?.attributes && (coverRel.attributes as { fileName?: string }).fileName
              ? `/api/manga/cover/${manga.id}/${(coverRel.attributes as { fileName: string }).fileName}`
              : '/placeholder.svg';
            const title = manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'No Title';
            const description = manga.attributes?.description?.en || Object.values(manga.attributes?.description || {})[0] || '';
            const rating = typeof manga.rating === 'number' ? manga.rating.toFixed(1) : 'N/A';
            return (
              <div
                key={manga.id}
                className="bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow cursor-pointer border border-gray-800"
                onClick={() => navigate(`/manga/${manga.id}`)}
              >
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-32 sm:h-44 lg:h-56 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-1 line-clamp-1">{title}</h2>
                  <p className="text-gray-300 text-xs sm:text-sm mb-2 line-clamp-2 hidden sm:block">{description}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    <span className="text-white font-semibold text-xs sm:text-sm">{manga.rating !== undefined ? Number(manga.rating).toFixed(1) : 'N/A'}</span>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 ml-1 sm:ml-2" />
                    <span className="text-white font-semibold text-xs sm:text-sm">{typeof manga.follows === 'number' ? manga.follows : 'N/A'}</span>
                  </div>
                  <div className="text-gray-400 text-xs mb-1 hidden sm:block">Author: {manga.author || 'N/A'}</div>
                  <div className="text-gray-400 text-xs">Ch: {manga.chapters || 0}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);
};

export default SearchResultsPage;