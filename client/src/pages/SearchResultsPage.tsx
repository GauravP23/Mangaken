import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getMangaDetails, searchManga, getMangaFeed } from '../services/mangaApi';
import { Star } from 'lucide-react';
import { Button } from '../components/ui/button';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
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
          data.map(async (manga: any) => {
            let chapters = 0;
            let author = '';
            try {
              const feed = await getMangaFeed(manga.id, 500, 0);
              chapters = feed.length;
            } catch {}
            try {
              const details = await getMangaDetails(manga.id);
              const authorRel = details.relationships?.find((r: any) => r.type === 'author');
              author = authorRel?.attributes?.name || '';
            } catch {}
            return { ...manga, chapters, author };
          })
        );
        setResults(withDetails);
      })
      .catch(() => setError('Failed to fetch search results.'))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-6">Search Results for "{query}"</h1>
        {loading && <div className="text-white">Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && results.length === 0 && (
          <div className="text-gray-400">No results found.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((manga) => {
            const coverRel = manga.relationships?.find((r: any) => r.type === 'cover_art');
            const image = coverRel?.attributes?.fileName
              ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`
              : '/placeholder.svg';
            const title = manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'No Title';
            const description = manga.attributes?.description?.en || Object.values(manga.attributes?.description || {})[0] || '';
            const rating = (manga.attributes?.bayesianRating || manga.attributes?.averageRating || 0).toFixed(1);
            return (
              <div
                key={manga.id}
                className="bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow cursor-pointer border border-gray-800"
                onClick={() => navigate(`/manga/${manga.id}`)}
              >
                <img src={image} alt={title} className="w-full h-56 object-cover" />
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-white mb-1 line-clamp-1">{title}</h2>
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">{description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold text-sm">{rating}</span>
                  </div>
                  <div className="text-gray-400 text-xs mb-1">Author: {manga.author || 'N/A'}</div>
                  <div className="text-gray-400 text-xs">Chapters: {manga.chapters || 0}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;