import React, { useState, useRef, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Filter, Grid3X3, Shuffle, Star, Clock, TrendingUp, RotateCcw, Trophy, User, BookMarked, Bell, Settings, LogOut, BookOpen, Download, Sun, Moon, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { searchManga } from '../services/mangaApi';
import { AuthContext } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useTheme } from 'next-themes';
import './Header.css'; // For styling

type Manga = {
  id: string;
  attributes: {
    title: { [lang: string]: string };
    // Add other attributes as needed
  };
  relationships?: Array<{
    type: string;
    attributes?: {
      fileName?: string;
    };
  }>;
};

const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Always go to search results page on enter
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const value = e.target.value;
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      // cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        const results = await searchManga(value, 10, 0, abortRef.current.signal); // limit 10 for dropdown
        setSearchResults(results);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 250);
  };

  const handleResultClick = (mangaId: string) => {
    navigate(`/manga/${mangaId}`);
    setShowDropdown(false);
  };

  // Top bar filter handlers
  const handleGenres = () => {
    navigate('/browse');
  };
  const handleNew = () => {
    navigate('/browse?sortBy=latest');
  };
  const handleOngoing = () => {
    navigate('/browse?status=ongoing');
  };
  const handleTop = () => {
    navigate('/top');
  };

  const handleAniList = () => {
    navigate('/anilist');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <>
    <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 w-full transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors flex-shrink-0">
            <div className="bg-primary px-2.5 py-1 rounded-lg font-black text-primary-foreground text-xs tracking-wider uppercase shadow-lg shadow-primary/25">
              Manga
            </div>
            <span className="text-xl font-black tracking-wide hidden sm:block text-foreground">Ken</span>
          </Link>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8 relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full pl-10 pr-4 bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-full transition-all"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                  {searchResults.map((manga) => (
                    <div
                      key={manga.id}
                      className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer flex items-center gap-3 border-b border-border last:border-0"
                      onMouseDown={() => handleResultClick(manga.id)}
                    >
                      <img
                        src={
                          manga.relationships?.find(r => r.type === 'cover_art')?.attributes?.fileName
                            ? `/api/manga/cover/${manga.id}/${encodeURIComponent(manga.relationships.find(r => r.type === 'cover_art').attributes.fileName)}?size=256`
                            : '/placeholder.svg'
                        }
                        alt={manga.attributes?.title?.en || 'No Title'}
                        className="w-8 h-12 object-cover rounded shadow border border-border"
                      />
                      <span className="text-foreground font-medium line-clamp-1 hover:text-primary transition-colors">{manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'No Title'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold tracking-wider text-muted-foreground hover:text-primary hover:bg-transparent uppercase transition-colors"
              onClick={handleGenres}
            >
              <Grid3X3 className="h-3.5 w-3.5 mr-1" />
              GENRES
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold tracking-wider text-muted-foreground hover:text-primary hover:bg-transparent uppercase transition-colors"
              onClick={handleNew}
            >
              <Star className="h-3.5 w-3.5 mr-1" />
              NEW
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold tracking-wider text-muted-foreground hover:text-primary hover:bg-transparent uppercase transition-colors"
              onClick={handleOngoing}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              ONGOING
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold tracking-wider text-muted-foreground hover:text-primary hover:bg-transparent uppercase transition-colors"
              onClick={handleTop}
            >
              <Trophy className="h-3.5 w-3.5 mr-1" />
              TOP
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold tracking-wider bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg uppercase transition-all border border-blue-600/30"
              onClick={handleAniList}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              AniList
            </Button>
          </nav>

          {/* User / Theme Toggle / Auth Links */}
          <div className="hidden md:flex items-center flex-shrink-0 ml-2 space-x-3">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-primary hover:bg-transparent"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl transition-colors hover:bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary/10">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block font-medium text-xs tracking-wide">{user.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-2xl border border-border py-2.5 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-bold text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate('/continue-reading'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Continue Reading
                    </button>
                    <button
                      onClick={() => { navigate('/bookmarks'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <BookMarked className="h-4 w-4" />
                      Bookmark
                    </button>
                    <button
                      onClick={() => { navigate('/notifications'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      Notification
                    </button>
                    <button
                      onClick={() => { navigate('/import-export'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Import / Export
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>

                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button, Mobile Avatar & Mobile Theme Toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-primary hover:bg-transparent p-2"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-primary/20"
                title="My Profile"
              >
                {user.username.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors"
              >
                Sign In
              </button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-foreground flex-shrink-0 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            {/* User Info / Auth Prompt on Mobile */}
            {user ? (
              <div className="mb-4 p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 px-2.5"
                    onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                  >
                    Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { openAuthModal('login'); setIsMenuOpen(false); }}
                  className="w-full text-center py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { openAuthModal('register'); setIsMenuOpen(false); }}
                  className="w-full text-center py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/25 transition-all"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 bg-muted/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl text-base h-11"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-1 font-medium">
              <Button
                variant="ghost"
                className="justify-start text-foreground hover:text-primary hover:bg-muted/50 h-11 text-sm font-semibold rounded-xl"
                onClick={() => { handleGenres(); setIsMenuOpen(false); }}
              >
                <Grid3X3 className="h-4 w-4 mr-3 text-primary" />
                BROWSE & GENRES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-foreground hover:text-primary hover:bg-muted/50 h-11 text-sm font-semibold rounded-xl"
                onClick={() => { handleNew(); setIsMenuOpen(false); }}
              >
                <Star className="h-4 w-4 mr-3 text-amber-500" />
                NEW RELEASES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-foreground hover:text-primary hover:bg-muted/50 h-11 text-sm font-semibold rounded-xl"
                onClick={() => { handleOngoing(); setIsMenuOpen(false); }}
              >
                <TrendingUp className="h-4 w-4 mr-3 text-emerald-500" />
                ONGOING SERIES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-foreground hover:text-primary hover:bg-muted/50 h-11 text-sm font-semibold rounded-xl"
                onClick={() => { handleTop(); setIsMenuOpen(false); }}
              >
                <Trophy className="h-4 w-4 mr-3 text-amber-500" />
                TOP RANKED MANGA
              </Button>

              <Button
                variant="ghost"
                className="justify-start text-blue-500 hover:text-white hover:bg-blue-600 h-11 text-sm font-semibold rounded-xl border border-blue-500/20 bg-blue-500/10"
                onClick={() => { handleAniList(); setIsMenuOpen(false); }}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                ANILIST STATS HUB
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>

    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      initialMode={authMode}
    />
    </>
  );
};

export default Header;