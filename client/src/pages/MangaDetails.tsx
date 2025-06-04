import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Eye, Calendar, User, BookOpen, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { trendingManga, topManga, latestUpdates } from '../data/mangaData';

const MangaDetail = () => {
  const { id } = useParams();
  
  // Find manga from all data sources
  const allManga = [...trendingManga, ...topManga, ...latestUpdates];
  const manga = allManga.find(m => m.id === id);

  if (!manga) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl text-white">Manga not found</h1>
          <Link to="/" className="text-red-400 hover:text-red-300 mt-4 inline-block">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Generate mock chapters
  const chapters = Array.from({ length: manga.chapters }, (_, i) => ({
    id: i + 1,
    title: `Chapter ${i + 1}`,
    date: new Date(Date.now() - (manga.chapters - i) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    views: Math.floor(Math.random() * 50000) + 10000
  }));

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Manga Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <img
              src={manga.image}
              alt={manga.title}
              className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
            />
          </div>

          {/* Manga Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{manga.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="border-red-400 text-red-400">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{manga.rating}</div>
                <div className="text-gray-400 text-sm">Rating</div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{(manga.views / 1000000).toFixed(1)}M</div>
                <div className="text-gray-400 text-sm">Views</div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <BookOpen className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{manga.chapters}</div>
                <div className="text-gray-400 text-sm">Chapters</div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white capitalize">{manga.status}</div>
                <div className="text-gray-400 text-sm">Status</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{manga.description}</p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-5 h-5" />
              <span>Author: {manga.author}</span>
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
            {chapters.reverse().map((chapter) => (
              <Link
                key={chapter.id}
                to={`/manga/${manga.id}/chapter/${chapter.id}`}
                className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                    {chapter.title}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{(chapter.views / 1000).toFixed(0)}k</span>
                  </div>
                  <span>{chapter.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MangaDetail;