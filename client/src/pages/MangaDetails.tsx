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
        // Ensure chapters are sorted by chapter number ascending
        const sortedCh = (data.chapters || []).slice().sort((a: any, b: any) => {
          const aNum = parseFloat(a.attributes?.chapter || '0');
          const bNum = parseFloat(b.attributes?.chapter || '0');
          return (isNaN(aNum) ? 1 : aNum) - (isNaN(bNum) ? 1 : bNum);
        });
        setChapters(sortedCh);
        setChapterCount(data.totalChapters || data.chapters?.length || null);
        setError('');
      })
      .catch(() => setError('Manga not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="main-content-frame bg-[#0B0C0E] min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center text-white">
            <span className="loading mr-2"></span> Loading details...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="main-content-frame bg-[#0B0C0E] min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl text-white font-bold">Manga not found</h1>
            <Link to="/" className="text-[#FF5C00] hover:text-[#FF8C00] mt-4 inline-block font-semibold transition-colors uppercase tracking-wider text-sm">
              ← Return to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const firstChapterId = chapters[0]?.id;

  return (
    <div className="main-content-frame bg-[#0B0C0E] min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Manga Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
            {/* Cover Image */}
            <div className="lg:col-span-1 flex justify-center">
              <img
                src={manga.coverImage || manga.image || '/placeholder.svg'}
                alt={manga.title}
                className="w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl border border-white/[0.05]"
              />
            </div>
            {/* Manga Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Manga Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">{manga.title}</h1>
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <Star className="w-5 h-5 text-[#FF5C00] fill-[#FF5C00] mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white">{manga.rating !== undefined && manga.rating > 0 ? manga.rating.toFixed(1) : '—'}</div>
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Rating</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <Eye className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white">{typeof manga.follows === 'number' ? manga.follows.toLocaleString() : '—'}</div>
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Views</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white">{chapterCount !== null ? chapterCount : '—'}</div>
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Chapters</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <Calendar className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white capitalize">{manga.status || '—'}</div>
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Status</div>
                </div>
              </div>
              {/* Description/Synopsis */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 shadow-sm">
                <h3 className="text-md font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#FF5C00] rounded"></span>
                  Synopsis
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {manga.description && manga.description.length > 300 && !showFullDescription
                    ? <>
                        {manga.description.slice(0, 300)}... <span className="text-[#FF5C00] font-semibold cursor-pointer hover:underline" onClick={() => setShowFullDescription(true)}>See more</span>
                      </>
                    : manga.description}
                  {manga.description && manga.description.length > 300 && showFullDescription && (
                    <span className="text-[#FF5C00] font-semibold cursor-pointer ml-2 hover:underline" onClick={() => setShowFullDescription(false)}>See less</span>
                  )}
                </p>
              </div>
              {/* Type and Author Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Type</span>
                  <div className="text-lg font-extrabold text-white capitalize">Manga</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-center shadow-sm">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Author</span>
                  <div className="text-lg font-extrabold text-white truncate">{manga.author || 'N/A'}</div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                {firstChapterId ? (
                  <Link to={`/manga/${manga.id}/chapter/${firstChapterId}`}>
                    <Button className="bg-[#FF5C00] hover:bg-[#FF8C00] text-white border-none font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#FF5C00]/25">
                      <Play className="w-4 h-4 mr-2 fill-white text-white" />
                      Start Reading
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="bg-gray-800 text-gray-500 font-bold px-6 py-2.5 rounded-xl">
                    No Chapters Available
                  </Button>
                )}
                <Button variant="outline" className="bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold px-6 py-2.5 rounded-xl transition-all">
                  Add to Library
                </Button>
              </div>
            </div>
          </div>
          {/* Chapters List */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#FF5C00] rounded"></span>
              Chapters List
            </h2>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
              {chapters.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No chapters found.</div>
              ) : (
                chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    to={`/manga/${manga.id}/chapter/${chapter.id}`}
                    className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.04] hover:border-[#FF5C00]/30 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-gray-200 group-hover:text-[#FF5C00] transition-colors text-sm sm:text-base">
                        {chapter.attributes?.title || `Chapter ${chapter.attributes?.chapter || chapter.id}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-xs sm:text-sm font-semibold">
                      {chapter.attributes?.volume && <span>Vol. {chapter.attributes.volume}</span>}
                      {chapter.attributes?.chapter && <span>Ch. {chapter.attributes.chapter}</span>}
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300 tracking-wider border border-white/5">{chapter.attributes?.translatedLanguage?.toUpperCase() || 'EN'}</span>
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