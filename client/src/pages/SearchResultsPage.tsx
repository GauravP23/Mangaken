import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MangaCard from '../components/MangaCard';
import Footer from '../components/Footer';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, X } from 'lucide-react';
import { topManga, latestUpdates, trendingManga, genres } from '../data/mangaData';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('rating');
    const [statusFilter, setStatusFilter] = useState('all');
    const [minRating, setMinRating] = useState('0');

    const allManga = [...trendingManga, ...topManga, ...latestUpdates];

    const searchResults = useMemo(() => {
        let filtered = allManga.filter(manga => {
            // Text search
            const titleMatch = manga.title.toLowerCase().includes(searchQuery.toLowerCase());
            const authorMatch = manga.author.toLowerCase().includes(searchQuery.toLowerCase());
            const genreMatch = manga.genres.some(genre => 
                genre.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const textMatch = searchQuery === '' || titleMatch || authorMatch || genreMatch;

            // Genre filter
            const genreFilterMatch = selectedGenres.length === 0 || 
                selectedGenres.some(genre => manga.genres.includes(genre));
            
            // Status filter
            const statusMatch = statusFilter === 'all' || manga.status === statusFilter;
            
            // Rating filter
            const ratingMatch = manga.rating >= parseFloat(minRating);
            
            return textMatch && genreFilterMatch && statusMatch && ratingMatch;
        });

        // Remove duplicates
        filtered = filtered.filter((manga, index, self) => 
            index === self.findIndex(m => m.id === manga.id)
        );

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'views':
                    return b.views - a.views;
                case 'chapters':
                    return b.chapters - a.chapters;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'latest':
                    return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
                default:
                    return 0;
            }
        });

        return filtered;
    }, [searchQuery, selectedGenres, sortBy, statusFilter, minRating]);

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev => 
            prev.includes(genre) 
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGenres([]);
        setSortBy('rating');
        setStatusFilter('all');
        setMinRating('0');
    };

    if (!searchQuery) return <p>Enter a search term in the header.</p>;

    return (
        <div className="min-h-screen bg-gray-950">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Advanced Search</h1>
                    <p className="text-gray-400">Find exactly what you're looking for</p>
                </div>

                {/* Search Form */}
                <div className="bg-gray-900 rounded-lg p-6 mb-8">
                    {/* Main Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">Search</label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Search by title, author, or genre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-orange-400 pl-10"
                            />
                            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Genres */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-white">Genres</label>
                                    {selectedGenres.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedGenres([])}
                                            className="text-orange-400 hover:text-orange-300"
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                
                                {selectedGenres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedGenres.map(genre => (
                                            <Badge
                                                key={genre}
                                                variant="secondary"
                                                className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                                                onClick={() => toggleGenre(genre)}
                                            >
                                                {genre}
                                                <X className="w-3 h-3 ml-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                    {genres.map(genre => (
                                        <Button
                                            key={genre}
                                            variant={selectedGenres.includes(genre) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleGenre(genre)}
                                            className={selectedGenres.includes(genre) 
                                                ? "bg-orange-500 hover:bg-orange-600 text-white text-xs" 
                                                : "border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-xs"
                                            }
                                        >
                                            {genre}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Sort by</label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="rating">Rating</SelectItem>
                                        <SelectItem value="views">Most Viewed</SelectItem>
                                        <SelectItem value="chapters">Chapter Count</SelectItem>
                                        <SelectItem value="title">Title A-Z</SelectItem>
                                        <SelectItem value="latest">Latest Update</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="ongoing">Ongoing</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Minimum Rating */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Minimum Rating</label>
                                <Select value={minRating} onValueChange={setMinRating}>
                                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="0">Any Rating</SelectItem>
                                        <SelectItem value="7">7.0+</SelectItem>
                                        <SelectItem value="8">8.0+</SelectItem>
                                        <SelectItem value="9">9.0+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear All Filters */}
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="w-full border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="mb-6">
                    <p className="text-gray-400">
                        {searchQuery && `Search results for "${searchQuery}" - `}
                        {searchResults.length} manga found
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
                    {searchResults.map(manga => (
                        <MangaCard key={manga.id} manga={manga} size="medium" />
                    ))}
                </div>

                {searchResults.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg mb-4">
                            {searchQuery 
                                ? `No manga found for "${searchQuery}"`
                                : "No manga found matching your criteria"
                            }
                        </p>
                        <Button
                            variant="outline"
                            className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                            onClick={clearFilters}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default SearchResultsPage;