import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MangaCard from '../components/MangaCard';
import { getMangaDetails, searchManga, getMangaFeed, getMangaChapterCount, getMangaStatisticsBatch } from '../services/mangaApi';
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
    const controller = new AbortController();
    if (!query) return;
    setLoading(true);
    setError('');
    searchManga(query, 30, 0, controller.signal)
      .then(async (data) => {
        const ids = data.map(m => m.id);
        const stats = await getMangaStatisticsBatch(ids);
        const withDetails = await Promise.all(
          data.map(async (manga: Manga) => {
            let chapters = 0;
            const last = (manga.attributes as { lastChapter?: string })?.lastChapter;
            if (last) {
              const parsed = parseFloat(String(last));
              chapters = isNaN(parsed) ? 0 : Math.floor(parsed);
            } else {
              try {
                chapters = await getMangaChapterCount(manga.id);
              } catch (err) {
                // ignore
              }
            }

            let author = '';
            const authorRel = manga.relationships?.find((r: Relationship) => r.type === 'author');
            if (authorRel && authorRel.attributes && typeof (authorRel.attributes as { name?: unknown }).name === 'string') {
              author = (authorRel.attributes as { name?: string }).name || '';
            } else {
              try {
                const details = await getMangaDetails(manga.id);
                const aRel = details.relationships?.find((r: Relationship) => r.type === 'author');
                author = (aRel?.attributes as { name?: string })?.name || '';
              } catch (err) {
                // ignore
              }
            }

            const s: { rating: number; follows: number } | undefined = (stats as Record<string, { rating: number; follows: number }>)[manga.id];
            const rating = s ? (typeof s.rating === 'number' ? s.rating : 0) : 0;
            const follows = s ? (typeof s.follows === 'number' ? s.follows : 0) : 0;
            return { ...manga, chapters, author, rating, follows };
          })
        );
        setResults(withDetails);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError('Failed to fetch search results.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [query]);

  return (
    <div className="main-content-frame bg-background min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-10">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Search Results for "{query}"</h1>
          {loading && <div className="text-foreground text-sm sm:text-base py-4"><span className="loading mr-2"></span>Loading...</div>}
          {error && <div className="text-red-400 text-sm sm:text-base py-4">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="text-muted-foreground text-sm sm:text-base py-4">No results found.</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {results.map((manga) => {
              const coverRel = manga.relationships?.find((r: Relationship) => r.type === 'cover_art');
              const coverFileName = (coverRel?.attributes as { fileName?: string })?.fileName;
              const image = coverFileName
                ? `/api/manga/cover/${manga.id}/${encodeURIComponent(coverFileName)}?size=256`
                : '/placeholder.svg';
              const title = manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'No Title';
              const genres = (manga.attributes?.tags || []).map((tag: any) => tag.attributes?.name?.en || '').filter(Boolean);
              
              const uiManga = {
                id: manga.id,
                title,
                image,
                coverImage: image,
                status: manga.attributes?.status || 'ongoing',
                rating: manga.rating,
                views: manga.follows,
                chapters: manga.chapters,
                author: manga.author,
                genres,
                year: manga.attributes?.year ? Number(manga.attributes.year) : null,
              };

              return (
                <MangaCard
                  key={manga.id}
                  manga={uiManga}
                  size="medium"
                />
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