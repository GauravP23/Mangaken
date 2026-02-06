import React, { useState, useRef, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Filter, Grid3X3, Shuffle, Star, Clock, TrendingUp, RotateCcw, Trophy, User, BookMarked, Bell, Settings, LogOut, BookOpen, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { searchManga } from '../services/mangaApi';
import { AuthContext } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
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
    <header className="bg-content-frame/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 w-full">
      <div className="px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-primary-white hover:text-primary transition-colors flex-shrink-0">
            <div className="bg-primary px-2 py-1 rounded font-bold text-primary-foreground text-sm">
              Manga
            </div>
            <span className="text-xl font-bold accent-purple hidden sm:block">Ken</span>
          </Link>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full pl-10 pr-4 bg-muted/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 rounded-full"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searchResults.map((manga) => (
                    <div
                      key={manga.id}
                      className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-3"
                      onMouseDown={() => handleResultClick(manga.id)}
                    >
                      {/* Use backend proxy to avoid hotlinking */}
                      <img
                        src={
                          manga.relationships?.find(r => r.type === 'cover_art')?.attributes?.fileName
                            ? `/api/manga/cover/${manga.id}/${encodeURIComponent(manga.relationships.find(r => r.type === 'cover_art').attributes.fileName)}?size=256`
                            : '/placeholder.svg'
                        }
                        alt={manga.attributes?.title?.en || 'No Title'}
                        className="w-8 h-12 object-cover rounded shadow"
                      />
                      <span className="text-primary-white font-medium line-clamp-1">{manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'No Title'}</span>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="px-4 py-2 text-secondary-gray">No results found.</div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Desktop Navigation - Simplified for better fit */}
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-clickable hover:text-primary hover:bg-muted/50 text-xs xl:text-sm"
              onClick={handleGenres}
            >
              <Grid3X3 className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              GENRES
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-clickable hover:text-primary hover:bg-muted/50 text-xs xl:text-sm"
              onClick={handleNew}
            >
              <Star className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              NEW
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-clickable hover:text-primary hover:bg-muted/50 text-xs xl:text-sm"
              onClick={handleOngoing}
            >
              <TrendingUp className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              ONGOING
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-clickable hover:text-primary hover:bg-muted/50 text-xs xl:text-sm"
              onClick={handleTop}
            >
              <Trophy className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              TOP
            </Button>
          </nav>

          {/* User Avatar / Auth Links */}
          <div className="hidden md:flex items-center flex-shrink-0 ml-2 space-x-2">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-clickable hover:text-primary hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block font-medium">{user.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1f2e] rounded-lg shadow-2xl border border-gray-700/50 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700/50">
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate('/continue-reading'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Continue Reading
                    </button>
                    <button
                      onClick={() => { navigate('/bookmarks'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <BookMarked className="h-4 w-4" />
                      Bookmark
                    </button>
                    <button
                      onClick={() => { navigate('/notifications'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      Notification
                    </button>
                    <button
                      onClick={() => { navigate('/import-export'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Import / Export
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-muted/50 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>

                    <div className="border-t border-gray-700/50 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
                  className="text-clickable hover:text-primary hover:bg-muted/50 px-3 py-1 rounded transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="btn-primary-cta px-3 py-1 rounded transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-primary-white flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-muted/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-full"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Filter className="h-4 w-4 mr-2" />
                FILTER
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                GENRES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                TYPES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Star className="h-4 w-4 mr-2" />
                NEW RELEASES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Clock className="h-4 w-4 mr-2" />
                UPDATES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                ONGOING
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => { handleTop(); setIsMenuOpen(false); }}
              >
                <Trophy className="h-4 w-4 mr-2" />
                TOP MANGA
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-clickable hover:text-primary hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                RECENT
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