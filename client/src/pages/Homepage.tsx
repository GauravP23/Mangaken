import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import MangaSection from '@/components/MangaSection';
import MangaCard from '@/components/MangaCard';
import GenreGrid from '@/components/GenreGrid';
import Footer from '@/components/Footer';
import { topManga, latestUpdates, trendingManga } from '@/data/mangaData';
import { getLatestManga, getPopularManga } from '../services/mangaApi';
import { Manga } from '../types';

const PAGE_SIZE = 10;

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [latestManga, setLatestManga] = useState<Manga[]>([]);
    const [popularManga, setPopularManga] = useState<Manga[]>([]);
    const [latestPage, setLatestPage] = useState(1);
    const [popularPage, setPopularPage] = useState(1);

    useEffect(() => {
        getLatestManga(PAGE_SIZE, (latestPage - 1) * PAGE_SIZE).then(setLatestManga);
    }, [latestPage]);

    useEffect(() => {
        getPopularManga(PAGE_SIZE, (popularPage - 1) * PAGE_SIZE).then(setPopularManga);
    }, [popularPage]);

    const mostViewed = [...topManga, ...trendingManga].sort((a, b) => b.views - a.views);
    const completedSeries = [...topManga, ...trendingManga, ...latestUpdates].filter(manga => manga.status === 'completed');

    const handleGenreClick = (genre: string) => {
        navigate(`/browse?genre=${encodeURIComponent(genre)}`);
    };

    const handleViewAll = (section: string) => {
        navigate(`/browse?section=${section}`);
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <Header />
            {/* Hero Section */}
            <HeroSlider />
            <div className="container mx-auto px-4 py-16 bg-gray-950">
                {/* Trending Now Section */}
                <MangaSection 
                    title="Trending Now" 
                    onViewAll={() => handleViewAll('trending')}
                >
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {topManga.map((manga) => (
                            <div key={manga.id} className="flex-shrink-0">
                                <MangaCard manga={manga} size="medium" />
                            </div>
                        ))}
                    </div>
                </MangaSection>
                {/* Explore Genres Section */}
                <MangaSection title="Explore Genres" showViewAll={false}>
                    <GenreGrid onGenreClick={handleGenreClick} />
                </MangaSection>
                {/* Latest Updates Section */}
                <MangaSection 
                    title="Latest Updates"
                    onViewAll={() => handleViewAll('latest')}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {latestUpdates.map((manga) => (
                            <MangaCard key={manga.id} manga={manga} size="medium" />
                        ))}
                    </div>
                </MangaSection>
                {/* Most Viewed Section */}
                <MangaSection 
                    title="Most Viewed"
                    onViewAll={() => handleViewAll('popular')}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {mostViewed.slice(0, 6).map((manga) => (
                            <MangaCard key={manga.id} manga={manga} size="medium" />
                        ))}
                    </div>
                </MangaSection>
                {/* Completed Series Section */}
                <MangaSection 
                    title="Completed Series"
                    onViewAll={() => handleViewAll('completed')}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {completedSeries.slice(0, 6).map((manga) => (
                            <MangaCard key={manga.id} manga={manga} size="medium" />
                        ))}
                    </div>
                </MangaSection>
            </div>
            <Footer />
        </div>
    );
};

export default HomePage;