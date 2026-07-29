import React, { useContext, useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, BookOpen, BookMarked, Settings, Lock, Trash2, ExternalLink, Star, Play, CheckCircle } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getReadingProgressList, ReadingProgressEntry } from '../utils/readingProgress';
import { getBookmarksList, removeBookmark, BookmarkEntry } from '../utils/bookmarks';

type TabType = 'profile' | 'continue-reading' | 'bookmarks' | 'settings';

const Profile: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [readingList, setReadingList] = useState<ReadingProgressEntry[]>([]);
  const [bookmarksList, setBookmarksList] = useState<BookmarkEntry[]>([]);

  useEffect(() => {
    setReadingList(getReadingProgressList());
    setBookmarksList(getBookmarksList());
  }, [activeTab]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleRemoveBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(id);
    setBookmarksList(prev => prev.filter(b => b.mangaId !== id));
  };

  return (
    <div className="main-content-frame bg-background min-h-screen flex flex-col">
      <Header />

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-10 flex-1">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">User Account</h1>
          <p className="text-muted-foreground text-sm">Manage your reading history, saved bookmarks, and account preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm p-2 space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4" />
                <span className="flex-1 text-left">Profile & Stats</span>
              </button>

              <button
                onClick={() => setActiveTab('continue-reading')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'continue-reading'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-left">Continue Reading</span>
                </div>
                {readingList.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'continue-reading' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                  }`}>
                    {readingList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'bookmarks'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="h-4 w-4" />
                  <span className="text-left">Bookmarks</span>
                </div>
                {bookmarksList.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'bookmarks' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                  }`}>
                    {bookmarksList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="flex-1 text-left">Settings</span>
              </button>
            </div>
          </aside>

          {/* Main Content Pane */}
          <main className="flex-1 min-w-0">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-8">
                {/* User Info Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                      <Badge className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 font-bold border-none">
                        Active Member
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Account Activity Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
                    <BookMarked className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-black text-foreground">{bookmarksList.length}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">Bookmarks Saved</div>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
                    <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-black text-foreground">{readingList.length}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">Active In Progress</div>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <div className="text-2xl font-black text-foreground">
                      {readingList.reduce((acc, curr) => acc + (curr.page || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">Pages Read</div>
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="space-y-4 max-w-lg">
                  <h3 className="text-lg font-bold text-foreground">Account Information</h3>
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Username</label>
                    <Input value={user.username} disabled className="bg-muted/50 border-border text-foreground rounded-xl" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Email Address</label>
                    <Input value={user.email} disabled className="bg-muted/50 border-border text-foreground rounded-xl" />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Password management via security settings</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTINUE READING */}
            {activeTab === 'continue-reading' && (
              <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Continue Reading</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Pick up right where you left off</p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{readingList.length} items</span>
                </div>

                {readingList.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-foreground font-bold text-base">No reading history yet</p>
                    <p className="text-muted-foreground text-xs mt-1">Start reading any manga to automatically track your progress!</p>
                    <Link to="/browse" className="inline-block mt-4">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-5">
                        Browse Manga
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {readingList.map((entry) => {
                      const percent = Math.min(100, Math.round((entry.page / (entry.totalPages || 1)) * 100));
                      return (
                        <div
                          key={`${entry.mangaId}-${entry.chapterId}`}
                          className="bg-muted/30 hover:bg-muted/60 border border-border hover:border-primary/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group"
                        >
                          <div className="flex gap-4 items-start">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black text-primary uppercase tracking-wider">MANGA</span>
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                                {entry.mangaTitle}
                              </h3>
                              <p className="text-xs font-semibold text-muted-foreground mt-1">
                                {entry.chapterNumber ? `Chapter ${entry.chapterNumber}` : 'Chapter'} • Page {entry.page} of {entry.totalPages}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-4 space-y-2">
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-bold text-muted-foreground">{percent}% Completed</span>
                              <Link to={`/manga/${entry.mangaId}/chapter/${entry.chapterId}`}>
                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg px-3 h-8 gap-1">
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Resume</span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BOOKMARKS */}
            {activeTab === 'bookmarks' && (
              <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Saved Bookmarks</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Your personal manga library collection</p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{bookmarksList.length} saved</span>
                </div>

                {bookmarksList.length === 0 ? (
                  <div className="text-center py-16">
                    <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-foreground font-bold text-base">No bookmarks saved yet</p>
                    <p className="text-muted-foreground text-xs mt-1">Click the bookmark icon on any manga card or hero slider to save it here!</p>
                    <Link to="/browse" className="inline-block mt-4">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-5">
                        Explore Manga
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {bookmarksList.map((b) => (
                      <div key={b.mangaId} className="group relative bg-muted/20 border border-border hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col">
                        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                          <img
                            src={b.coverImage || '/placeholder.svg'}
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                          <button
                            onClick={(e) => handleRemoveBookmark(b.mangaId, e)}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-lg backdrop-blur-md transition-colors z-10"
                            title="Remove Bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {b.title}
                          </h4>
                          <Link to={`/manga/${b.mangaId}`} className="w-full">
                            <Button size="sm" variant="outline" className="w-full text-xs font-bold rounded-xl h-8 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                              View Manga
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Preferences & Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize your reading experience</p>
                </div>

                <div className="space-y-4 max-w-lg pt-4 border-t border-border">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">Default Reading Mode</p>
                      <p className="text-xs text-muted-foreground">Continuous vertical strip for manhwa & manga</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs">Long Strip</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">Content Language</p>
                      <p className="text-xs text-muted-foreground">Preferred translated chapter language</p>
                    </div>
                    <Badge className="bg-muted text-foreground font-bold text-xs border border-border">English (EN)</Badge>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
