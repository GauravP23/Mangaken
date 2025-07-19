import { Link } from 'react-router-dom';
import { Book, Facebook, Twitter, Instagram } from 'lucide-react';
import { Badge } from './ui/badge';

const Footer = () => {
  return (
    <footer className="bg-content-frame border-t border-border mt-20 w-full">
      <div className="px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary-white">
              <Book className="h-8 w-8 accent-purple" />
              <span className="text-xl font-bold">MangaKen</span>
            </div>
            <p className="text-secondary-gray text-sm">
              Your ultimate destination for reading manga online. Discover thousands of manga titles and stay updated with the latest chapters.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-primary-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-clickable hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <Link to="/browse" className="block text-clickable hover:text-primary transition-colors text-sm">
                Browse Manga
              </Link>
              <Link to="/search" className="block text-clickable hover:text-primary transition-colors text-sm">
                Advanced Search
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-primary-white font-semibold mb-4">Popular Genres</h3>
            <div className="space-y-2">
              <div className="text-clickable hover:text-primary transition-colors text-sm cursor-pointer">Action</div>
              <div className="text-clickable hover:text-primary transition-colors text-sm cursor-pointer">Romance</div>
              <div className="text-clickable hover:text-primary transition-colors text-sm cursor-pointer">Fantasy</div>
              <div className="text-clickable hover:text-primary transition-colors text-sm cursor-pointer">Adventure</div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-primary-white font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-secondary-gray hover:accent-cyan cursor-pointer transition-colors" />
              <Twitter className="h-6 w-6 text-secondary-gray hover:accent-cyan cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 text-secondary-gray hover:accent-purple cursor-pointer transition-colors" />
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-secondary-gray text-sm">
            © 2024 MangaKen. All rights reserved. This is a demo project for educational purposes.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
