import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import MangaSection from '../components/MangaSection';
import MangaCard from '../components/MangaCard';
import { mapApiMangaToUICard } from '../utils';
import Footer from '../components/Footer';
import ContinueReadingSection from '../components/ContinueReadingSection';
import TopMangaMiniList from '../components/TopMangaMiniList';
import { 
    getLatestManga, 
    getTrendingManga, 
    getCompletedManga, 
    getMostViewedManga,
    getMangaStatisticsBatch 
} from '../services/mangaApi';
import { Manga, UIManga } from '../types';


const PAGE_SIZE = 12;

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

// Global deduplication: removes manga IDs that exist in excludeIds set
function deduplicateManga<T extends { id: string }>(mangaList: T[], excludeIds: Set<string>): T[] {
    const seen = new Set<string>(excludeIds);
    return mangaList.filter((manga) => {
        if (seen.has(manga.id)) return false;
        seen.add(manga.id);
        return true;
    });
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    
    // Separate state for each category
    const [trendingManga, setTrendingManga] = useState<UIManga[]>([]);
    const [latestManga, setLatestManga] = useState<UIManga[]>([]);
    const [mostViewedManga, setMostViewedManga] = useState<UIManga[]>([]);
    const [completedManga, setCompletedManga] = useState<UIManga[]>([]);
    
    const [loading, setLoading] = useState({
        trending: true,
        latest: true,
        mostViewed: true,
        completed: true,
    });
    const [error, setError] = useState({
        trending: '',
        latest: '',
        mostViewed: '',
        completed: '',
    });

    // Fetch trending manga (recently updated popular series)
    useEffect(() => {
        setLoading((l) => ({ ...l, trending: true }));
        getTrendingManga(PAGE_SIZE, 0)
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setTrendingManga(withDetails);
                setError((e) => ({ ...e, trending: '' }));
            })
            .catch(() => setError((e) => ({ ...e, trending: 'Failed to load trending manga.' })))
            .finally(() => setLoading((l) => ({ ...l, trending: false })));
    }, []);

    // Fetch latest updates (most recently uploaded chapters)
    useEffect(() => {
        setLoading((l) => ({ ...l, latest: true }));
        getLatestManga(PAGE_SIZE + 6, 0) // Fetch extra to account for deduplication
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setLatestManga(withDetails);
                setError((e) => ({ ...e, latest: '' }));
            })
            .catch(() => setError((e) => ({ ...e, latest: 'Failed to load latest manga.' })))
            .finally(() => setLoading((l) => ({ ...l, latest: false })));
    }, []);

    // Fetch most viewed manga (highest followed count) - use offset to get different results from trending
    useEffect(() => {
        setLoading((l) => ({ ...l, mostViewed: true }));
        getMostViewedManga(PAGE_SIZE + 6, 0) // Different from popular - uses dedicated endpoint
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setMostViewedManga(withDetails);
                setError((e) => ({ ...e, mostViewed: '' }));
            })
            .catch(() => setError((e) => ({ ...e, mostViewed: 'Failed to load most viewed manga.' })))
            .finally(() => setLoading((l) => ({ ...l, mostViewed: false })));
    }, []);

    // Fetch completed manga (status = completed)
    useEffect(() => {
        setLoading((l) => ({ ...l, completed: true }));
        getCompletedManga(PAGE_SIZE + 6, 0) // Uses dedicated completed endpoint
            .then(async (data) => {
                const withDetails = await enhanceMangaWithBatchStats(data);
                setCompletedManga(withDetails);
                setError((e) => ({ ...e, completed: '' }));
            })
            .catch(() => setError((e) => ({ ...e, completed: 'Failed to load completed manga.' })))
            .finally(() => setLoading((l) => ({ ...l, completed: false })));
    }, []);

    const handleGenreClick = (genre: string) => {
        navigate(`/browse?genre=${encodeURIComponent(genre)}`);
    };

    const handleViewAll = (section: string) => {
        navigate(`/browse?section=${section}`);
    };

    // Smart deduplication - each section excludes manga from previous sections
    const displayTrending = useMemo(() => {
        return trendingManga.slice(0, 12);
    }, [trendingManga]);

    const displayLatest = useMemo(() => {
        const trendingIds = new Set(trendingManga.map(m => m.id));
        return deduplicateManga(latestManga, trendingIds).slice(0, 12);
    }, [latestManga, trendingManga]);

    const displayMostViewed = useMemo(() => {
        const excludeIds = new Set([
            ...trendingManga.map(m => m.id),
            ...latestManga.map(m => m.id)
        ]);
        return deduplicateManga(mostViewedManga, excludeIds).slice(0, 6);
    }, [mostViewedManga, trendingManga, latestManga]);

    const displayCompleted = useMemo(() => {
        const excludeIds = new Set([
            ...trendingManga.map(m => m.id),
            ...latestManga.map(m => m.id),
            ...mostViewedManga.map(m => m.id)
        ]);
        return deduplicateManga(completedManga, excludeIds).slice(0, 6);
    }, [completedManga, trendingManga, latestManga, mostViewedManga]);

    return (
        <div className="main-content-frame">
            <Header />
            <HeroSlider />
            <div className="px-2 sm:px-4 py-4 sm:py-8">
                <ContinueReadingSection />
                <MangaSection 
                    title="Top Manga" 
                    subtitle="Most followed series right now" 
                    showViewAll={false}
                >
                    <TopMangaMiniList items={mostViewedManga} limit={5} />
                </MangaSection>
                <MangaSection 
                    title="Trending Now" 
                    subtitle="Currently hot and recently updated series"
                    showViewAll={false}
                >
                    {loading.trending ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.trending ? (
                        <div className="text-center text-red-500 py-8">{error.trending}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                            {displayTrending.map((manga, index) => (
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
                    title="Latest Updates"
                    subtitle="Recently uploaded chapters"
                    showViewAll={false}
                >
                    {loading.latest ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.latest ? (
                        <div className="text-center text-red-500 py-8">{error.latest}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                            {displayLatest.map((manga, index) => (
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
                    subtitle="Popular series with the most followers"
                    onViewAll={() => handleViewAll('popular')}
                >
                    {loading.mostViewed ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.mostViewed ? (
                        <div className="text-center text-red-500 py-8">{error.mostViewed}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                            {displayMostViewed.map((manga, index) => (
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
                    subtitle="Finished manga you can binge read"
                    onViewAll={() => handleViewAll('completed')}
                >
                    {loading.completed ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.completed ? (
                        <div className="text-center text-red-500 py-8">{error.completed}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                            {displayCompleted.map((manga, index) => (
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