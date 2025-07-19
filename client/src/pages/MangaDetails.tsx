import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Eye, Calendar, User, BookOpen, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCompleteMangaInfo } from '../services/mangaApi';
import { UIManga } from '../types';

const MangaDetail = () => {
  const { id } = useParams();
  const [manga, setManga] = useState<UIManga | null>(null);
  const [chapters, setChapters] = useState<import('../types').Chapter[]>([]);
  const [chapterCount, setChapterCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCompleteMangaInfo(id)
      .then((data) => {
        setManga(data);
        setChapters(data.chapters || []);
        setChapterCount(data.totalChapters || data.chapters?.length || null);
        setError('');
      })
      .catch(() => setError('Manga not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="main-content-frame bg-gray-950 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl text-white">Loading...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="main-content-frame bg-gray-950 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl text-white">Manga not found</h1>
            <Link to="/" className="text-red-400 hover:text-red-300 mt-4 inline-block">
              Return to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="main-content-frame bg-gray-950 min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Manga Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Cover Image */}
            <div className="lg:col-span-1">
              <img
                src={manga.coverImage || manga.image || '/placeholder.svg'}
                alt={manga.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
              />
            </div>
            {/* Manga Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Manga Title */}
              <h1 className="text-4xl font-bold text-white mb-4">{manga.title}</h1>
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{manga.rating !== undefined ? manga.rating.toFixed(1) : 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Rating</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{typeof manga.follows === 'number' ? manga.follows : 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Views</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <BookOpen className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{chapterCount !== null ? chapterCount : 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Chapters</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white capitalize">{manga.status || 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Status</div>
                </div>
              </div>
              {/* Description/Synopsis */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Synopsis</h3>
                <p className="text-gray-300 leading-relaxed">
                  {manga.description && manga.description.length > 300 && !showFullDescription
                    ? <>
                        {manga.description.slice(0, 300)}... <span className="text-red-400 cursor-pointer" onClick={() => setShowFullDescription(true)}>See more</span>
                      </>
                    : manga.description}
                  {manga.description && manga.description.length > 300 && showFullDescription && (
                    <span className="text-red-400 cursor-pointer ml-2" onClick={() => setShowFullDescription(false)}>See less</span>
                  )}
                </p>
              </div>
              {/* Type and Author Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <span className="block text-xs text-gray-400 mb-1">Type</span>
                  <div className="text-2xl font-bold text-white capitalize">Manga</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <User className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{manga.author || 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Author</div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link to={`/manga/${manga.id}/chapter/1`}>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Play className="w-4 h-4 mr-2" />
                    Start Reading
                  </Button>
                </Link>
                <Button variant="outline" className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white">
                  Add to Library
                </Button>
              </div>
            </div>
          </div>
          {/* Chapters List */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-red-600 rounded"></span>
              Chapters
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chapters.length === 0 ? (
                <div className="text-gray-400 text-center">No chapters found.</div>
              ) : (
                chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    to={`/manga/${manga.id}/chapter/${chapter.id}`}
                    className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                        {chapter.attributes?.title || `Chapter ${chapter.attributes?.chapter || chapter.id}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <span>Vol. {chapter.attributes?.volume || '-'}</span>
                      <span>Ch. {chapter.attributes?.chapter || '-'}</span>
                      <span>{chapter.attributes?.translatedLanguage?.toUpperCase() || '-'}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MangaDetail;