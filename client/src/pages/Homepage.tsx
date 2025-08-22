import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import MangaSection from '../components/MangaSection';
import MangaCard from '../components/MangaCard';
import { mapApiMangaToUICard } from '../utils';
import GenreGrid from '../components/GenreGrid';
import Footer from '../components/Footer';
import { getLatestManga, getPopularManga, getMangaStatisticsBatch } from '../services/mangaApi';
import { Manga, UIManga } from '../types';


const PAGE_SIZE = 10;

// Helper function to enhance manga data with batch statistics for the provided list
const enhanceMangaWithBatchStats = async (mangaList: Manga[]): Promise<UIManga[]> => {
    const uiList = mangaList.map((apiManga) => {
        const baseUI = mapApiMangaToUICard(apiManga);
        return baseUI;
    });

    // Gather IDs for batch stats
    const ids = mangaList.map(m => m.id);
    try {
        const statsMap = await getMangaStatisticsBatch(ids);
        return uiList.map((ui) => {
            const stats = statsMap[ui.id];
            return {
                ...ui,
                rating: typeof stats?.rating === 'number' ? stats.rating : (ui.rating ?? 0),
                views: typeof stats?.follows === 'number' ? stats.follows : (ui.views ?? 0),
            } as UIManga;
        });
    } catch {
        return uiList;
    }
};

// Utility to deduplicate manga by id, works for any object with an id
function uniqueManga<T extends { id: string }>(mangaList: T[]): T[] {
    const seen = new Set<string>();
    return mangaList.filter((manga) => {
        if (seen.has(manga.id)) return false;
        seen.add(manga.id);
        return true;
    });
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [latestManga, setLatestManga] = useState<UIManga[]>([]);
    const [popularManga, setPopularManga] = useState<UIManga[]>([]);
    const [trendingManga, setTrendingManga] = useState<UIManga[]>([]);
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
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setLatestManga(withDetails);
                setError((e) => ({ ...e, latest: '' }));
            })
            .catch(() => setError((e) => ({ ...e, latest: 'Failed to load latest manga.' })))
            .finally(() => setLoading((l) => ({ ...l, latest: false })));
    }, [latestPage]);

    useEffect(() => {
        setLoading((l) => ({ ...l, popular: true }));
        getPopularManga(PAGE_SIZE, (popularPage - 1) * PAGE_SIZE)
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setPopularManga(withDetails);
                setError((e) => ({ ...e, popular: '' }));
            })
            .catch(() => setError((e) => ({ ...e, popular: 'Failed to load popular manga.' })))
            .finally(() => setLoading((l) => ({ ...l, popular: false })));
    }, [popularPage]);

    // For trending, reuse popular as placeholder
    useEffect(() => {
        setLoading((l) => ({ ...l, trending: true }));
        getPopularManga(PAGE_SIZE, 0)
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setTrendingManga(withDetails);
                setError((e) => ({ ...e, trending: '' }));
            })
            .catch(() => setError((e) => ({ ...e, trending: 'Failed to load trending manga.' })))
            .finally(() => setLoading((l) => ({ ...l, trending: false })));
    }, []);

    const handleGenreClick = (genre: string) => {
        navigate(`/browse?genre=${encodeURIComponent(genre)}`);
    };

    const handleViewAll = (section: string) => {
        navigate(`/browse?section=${section}`);
    };

    // Hero Section derives from popular+trending
    const topRated = popularManga.slice(0, 5);
    const topTrending = trendingManga.slice(0, 5);
    const heroMangaList: UIManga[] = [];
    for (let i = 0; i < 5; i++) {
        if (topRated[i]) heroMangaList.push(topRated[i]);
        if (topTrending[i]) heroMangaList.push(topTrending[i]);
    }
    const uniqueHeroMangaList = uniqueManga(heroMangaList);

    const mostViewed: UIManga[] = uniqueManga([...popularManga, ...trendingManga]).slice(0, 6);
    const completedSeries: UIManga[] = uniqueManga([...popularManga, ...trendingManga, ...latestManga]).slice(0, 6);
    const latestUpdates: UIManga[] = uniqueManga([...latestManga, ...popularManga, ...trendingManga]).slice(0, 10);

    return (
        <div className="main-content-frame">
            <Header />
            <HeroSlider />
            <div className="px-4 py-8">
                <MangaSection 
                    title="Trending Now" 
                    showViewAll={false}
                >
                    {loading.trending ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.trending ? (
                        <div className="text-center text-red-500 py-8">{error.trending}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {trendingManga.slice(0, 12).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 3 === 0}
                                />
                            ))}
                        </div>
                    )}
                </MangaSection>

                <MangaSection 
                    title="Explore Genres" 
                    subtitle="Discover manga by your favorite genre categories" 
                    showViewAll={false}
                    variant="highlight"
                >
                    <GenreGrid onGenreClick={handleGenreClick} />
                </MangaSection>

                <MangaSection 
                    title="Latest Updates"
                    showViewAll={false}
                >
                    {loading.latest ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.latest ? (
                        <div className="text-center text-red-500 py-8">{error.latest}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {latestUpdates.slice(0, 12).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 4 === 0}
                                />
                            ))}
                        </div>
                    )}
                </MangaSection>

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
                            {mostViewed.slice(0, 6).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 2 === 0}
                                />
                            ))}
                        </div>
                    )}
                </MangaSection>

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
                            {completedSeries.slice(0, 6).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index === 1 || index === 4}
                                />
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