import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import MangaSection from '../components/MangaSection';
import MangaCard from '../components/MangaCard';
import GenreGrid from '../components/GenreGrid';
import Footer from '../components/Footer';
import { getLatestManga, getPopularManga } from '../services/mangaApi';
import { Manga } from '../types';

const PAGE_SIZE = 10;

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [latestManga, setLatestManga] = useState<Manga[]>([]);
    const [popularManga, setPopularManga] = useState<Manga[]>([]);
    const [trendingManga, setTrendingManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState({
        latest: true,
        popular: true,
        trending: true,
    });
    const [error, setError] = useState({
        latest: '',
        popular: '',
        trending: '',
    });
    const [latestPage, setLatestPage] = useState(1);
    const [popularPage, setPopularPage] = useState(1);

    useEffect(() => {
        setLoading((l) => ({ ...l, latest: true }));
        getLatestManga(PAGE_SIZE, (latestPage - 1) * PAGE_SIZE)
            .then((data) => {
                setLatestManga(data);
                setError((e) => ({ ...e, latest: '' }));
            })
            .catch(() => setError((e) => ({ ...e, latest: 'Failed to load latest manga.' })))
            .finally(() => setLoading((l) => ({ ...l, latest: false })));
    }, [latestPage]);

    useEffect(() => {
        setLoading((l) => ({ ...l, popular: true }));
        getPopularManga(PAGE_SIZE, (popularPage - 1) * PAGE_SIZE)
            .then((data) => {
                setPopularManga(data);
                setError((e) => ({ ...e, popular: '' }));
            })
            .catch(() => setError((e) => ({ ...e, popular: 'Failed to load popular manga.' })))
            .finally(() => setLoading((l) => ({ ...l, popular: false })));
    }, [popularPage]);

    // For trending, use getPopularManga as a placeholder if no trending endpoint exists
    useEffect(() => {
        setLoading((l) => ({ ...l, trending: true }));
        getPopularManga(PAGE_SIZE, 0)
            .then((data) => {
                setTrendingManga(data);
                setError((e) => ({ ...e, trending: '' }));
            })
            .catch(() => setError((e) => ({ ...e, trending: 'Failed to load trending manga.' })))
            .finally(() => setLoading((l) => ({ ...l, trending: false })));
    }, []);

    // Most viewed and completed series are derived from popular/trending for now
    // Since 'views' and 'status' do not exist, just show a unique, shuffled, or sliced list
    const uniqueManga = (arr: Manga[]) => Array.from(new Map(arr.map(m => [m.id, m])).values());
    const mostViewed = uniqueManga([...popularManga, ...trendingManga]).slice(0, 6);
    const completedSeries = uniqueManga([...popularManga, ...trendingManga, ...latestManga]).slice(0, 6);

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
                    {loading.trending ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.trending ? (
                        <div className="text-center text-red-500 py-8">{error.trending}</div>
                    ) : (
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                            {trendingManga.map((manga) => (
                                <div key={manga.id} className="flex-shrink-0">
                                    <MangaCard manga={manga} size="medium" />
                                </div>
                            ))}
                        </div>
                    )}
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
                    {loading.latest ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.latest ? (
                        <div className="text-center text-red-500 py-8">{error.latest}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {latestManga.map((manga) => (
                                <MangaCard key={manga.id} manga={manga} size="medium" />
                            ))}
                        </div>
                    )}
                </MangaSection>
                {/* Most Viewed Section */}
                <MangaSection 
                    title="Most Viewed"
                    onViewAll={() => handleViewAll('popular')}
                >
                    {loading.popular ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.popular ? (
                        <div className="text-center text-red-500 py-8">{error.popular}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {mostViewed.slice(0, 6).map((manga) => (
                                <MangaCard key={manga.id} manga={manga} size="medium" />
                            ))}
                        </div>
                    )}
                </MangaSection>
                {/* Completed Series Section */}
                <MangaSection 
                    title="Completed Series"
                    onViewAll={() => handleViewAll('completed')}
                >
                    {loading.popular && loading.latest && loading.trending ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.popular && error.latest && error.trending ? (
                        <div className="text-center text-red-500 py-8">{error.popular || error.latest || error.trending}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {completedSeries.slice(0, 6).map((manga) => (
                                <MangaCard key={manga.id} manga={manga} size="medium" />
                            ))}
                        </div>
                    )}
                </MangaSection>
            </div>
            <Footer />
        </div>
    );
};

export default HomePage;