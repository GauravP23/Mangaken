import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Filter, Grid3X3, Shuffle, Star, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import './Header.css'; // For styling

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors flex-shrink-0">
            <div className="bg-red-600 px-2 py-1 rounded font-bold text-white text-sm">
              Manga
            </div>
            <span className="text-xl font-bold text-red-400 hidden sm:block">Ken</span>
          </Link>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400/20 rounded-full"
              />
            </div>
          </form>

          {/* Desktop Navigation - Simplified for better fit */}
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-xs xl:text-sm"
            >
              <Filter className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              FILTER
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-xs xl:text-sm"
            >
              <Grid3X3 className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              GENRES
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-xs xl:text-sm"
            >
              <Star className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              NEW
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-xs xl:text-sm"
            >
              <TrendingUp className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              ONGOING
            </Button>
          </nav>

          {/* User Avatar */}
          <div className="hidden md:flex items-center flex-shrink-0 ml-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              en
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-800">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-400 focus:border-red-400 rounded-full"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Filter className="h-4 w-4 mr-2" />
                FILTER
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                GENRES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                TYPES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Star className="h-4 w-4 mr-2" />
                NEW RELEASES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Clock className="h-4 w-4 mr-2" />
                UPDATES
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                ONGOING
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white hover:bg-gray-800/50"
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