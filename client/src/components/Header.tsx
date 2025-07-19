import React, { useState, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Filter, Grid3X3, Shuffle, Star, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { searchManga } from '../services/mangaApi';
import { AuthContext } from '../contexts/AuthContext';
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
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
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
      try {
        const results = await searchManga(value, 10, 0); // limit 10 for dropdown
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

  return (
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
                      <img src={manga.relationships?.find(r => r.type === 'cover_art')?.attributes?.fileName ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.relationships.find(r => r.type === 'cover_art').attributes.fileName}.256.jpg` : '/placeholder.svg'} alt={manga.attributes?.title?.en || 'No Title'} className="w-8 h-12 object-cover rounded shadow" />
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
          </nav>

          {/* User Avatar / Auth Links */}
          <div className="hidden md:flex items-center flex-shrink-0 ml-2 space-x-2">
            {user ? (
              <>
                <button
                  onClick={logout}
                  className="text-clickable hover:text-primary hover:bg-muted/50 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-clickable hover:text-primary hover:bg-muted/50 px-3 py-1 rounded"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary-cta px-3 py-1 rounded"
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
  );
};

export default Header;