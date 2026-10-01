import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Eye, Calendar, User, BookOpen, Play, Bookmark } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCompleteMangaInfo } from '../services/mangaApi';
import { UIManga } from '../types';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';

const MangaDetail = () => {
  const { id } = useParams();
  const [manga, setManga] = useState<UIManga | null>(null);
  const [chapters, setChapters] = useState<import('../types').Chapter[]>([]);
  const [chapterCount, setChapterCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCompleteMangaInfo(id)
      .then((data) => {
        setManga(data);
        // Sync bookmark state from localStorage
        setBookmarked(isBookmarked(data.id || id || ''));
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
      <div className="main-content-frame bg-background min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center text-foreground">
            <span className="loading mr-2"></span> Loading details...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="main-content-frame bg-background text-foreground min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold">Manga not found</h1>
            <Link to="/" className="text-primary hover:text-primary/80 mt-4 inline-block font-semibold transition-colors uppercase tracking-wider text-sm">
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
    <div className="main-content-frame bg-background text-foreground min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {/* Manga Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 mb-8 sm:mb-10">
            {/* Cover Image */}
            <div className="lg:col-span-1 flex justify-center">
              <img
                src={manga.coverImage || manga.image || '/placeholder.svg'}
                alt={manga.title}
                className="w-48 sm:w-64 lg:w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl border border-border object-cover aspect-[2/3]"
              />
            </div>
            {/* Manga Info */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              {/* Manga Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight text-center sm:text-left">{manga.title}</h1>
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <Star className="w-5 h-5 text-primary fill-primary mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-black text-foreground">{manga.rating !== undefined && manga.rating > 0 ? manga.rating.toFixed(1) : '—'}</div>
                  <div className="text-muted-foreground text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Rating</div>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <Eye className="w-5 h-5 text-primary mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-black text-foreground">{typeof manga.follows === 'number' ? manga.follows.toLocaleString() : '—'}</div>
                  <div className="text-muted-foreground text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Views</div>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-primary mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-black text-foreground">{chapterCount !== null ? chapterCount : '—'}</div>
                  <div className="text-muted-foreground text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Chapters</div>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-black text-foreground capitalize">{manga.status || '—'}</div>
                  <div className="text-muted-foreground text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Status</div>
                </div>
              </div>
              {/* Description/Synopsis */}
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm sm:text-md font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded"></span>
                  Synopsis
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {manga.description && manga.description.length > 300 && !showFullDescription
                    ? <>
                        {manga.description.slice(0, 300)}... <span className="text-primary font-semibold cursor-pointer hover:underline" onClick={() => setShowFullDescription(true)}>See more</span>
                      </>
                    : manga.description}
                  {manga.description && manga.description.length > 300 && showFullDescription && (
                    <span className="text-primary font-semibold cursor-pointer ml-2 hover:underline" onClick={() => setShowFullDescription(false)}>See less</span>
                  )}
                </p>
              </div>
              {/* Type and Author Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <span className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Type</span>
                  <div className="text-base sm:text-lg font-extrabold text-foreground capitalize">Manga</div>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center shadow-sm">
                  <span className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Author</span>
                  <div className="text-base sm:text-lg font-extrabold text-foreground truncate">{manga.author || 'N/A'}</div>
                </div>
              </div>
              {/* Genre Badges */}
              {manga.genres && manga.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {manga.genres.slice(0, 8).map((g: string) => (
                    <Badge key={g} variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs px-3 py-1 rounded-full">{g}</Badge>
                  ))}
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                {firstChapterId ? (
                  <Link to={`/manga/${manga.id}/chapter/${firstChapterId}`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground border-none font-bold px-7 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 text-sm h-11">
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Start Reading
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full sm:w-auto bg-muted text-muted-foreground font-bold px-7 py-3 rounded-xl text-sm h-11">
                    No Chapters Available
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newState = toggleBookmark({
                      mangaId: manga.id || id || '',
                      title: manga.title,
                      coverImage: manga.coverImage || manga.image,
                      genres: manga.genres,
                      status: manga.status,
                      rating: manga.rating,
                    });
                    setBookmarked(newState);
                  }}
                  className={`w-full sm:w-auto font-bold px-7 py-3 rounded-xl transition-all border text-sm h-11 ${
                    bookmarked
                      ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                      : 'bg-muted hover:bg-muted/80 border-border text-foreground'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Bookmarked' : 'Add to Library'}
                </Button>
              </div>
            </div>
          </div>
          {/* Chapters List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded"></span>
              Chapters List
            </h2>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
              {chapters.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">No chapters found.</div>
              ) : (
                chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    to={`/manga/${manga.id}/chapter/${chapter.id}`}
                    className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted border border-border hover:border-primary/30 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                        {chapter.attributes?.title || `Chapter ${chapter.attributes?.chapter || chapter.id}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs sm:text-sm font-semibold">
                      {chapter.attributes?.volume && <span>Vol. {chapter.attributes.volume}</span>}
                      {chapter.attributes?.chapter && <span>Ch. {chapter.attributes.chapter}</span>}
                      <span className="bg-muted border border-border px-2 py-0.5 rounded text-[10px] text-muted-foreground tracking-wider">{chapter.attributes?.translatedLanguage?.toUpperCase() || 'EN'}</span>
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