import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import MangaSection from '../components/MangaSection';
import MangaCard from '../components/MangaCard';
import { mapApiMangaToUICard } from '../utils';
import GenreGrid from '../components/GenreGrid';
import Footer from '../components/Footer';
import { getLatestManga, getPopularManga, getMangaChapterCount, getMangaStatistics } from '../services/mangaApi';
import { Manga, UIManga } from '../types';


const PAGE_SIZE = 10;

// Utility to deduplicate manga by id, works for any object with an id
function uniqueManga<T extends { id: string }>(mangaList: T[]): T[] {
    const seen = new Set<string>();
    return mangaList.filter((manga) => {
        if (seen.has(manga.id)) return false;
        seen.add(manga.id);
        return true;
    });
}

// Define a type for cover art attributes
type CoverArtAttributes = {
    fileName?: string;
    filename?: string;
};

// Helper function to extract cover image from manga relationships
const extractCoverImage = (manga: Manga): string => {
    if (!manga.relationships) return '';
    
    const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
    if (!coverRel || !coverRel.attributes) return '';
    
    const attrs = coverRel.attributes as CoverArtAttributes;
    const fileName = attrs.fileName || attrs.filename;
    if (!fileName) return '';
    
    return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
};

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
    const [popularPage, setPopularPage] = useState(1);    useEffect(() => {
        setLoading((l) => ({ ...l, latest: true }));
        getLatestManga(PAGE_SIZE, (latestPage - 1) * PAGE_SIZE)
            .then(async (data) => {
                // Map to UI shape and fetch additional details
                const withDetails = await Promise.all(data.map(async (apiManga) => {
                    const baseUI = mapApiMangaToUICard(apiManga);
                    const chapters = await getMangaChapterCount(apiManga.id).catch(() => 0);
                    const stats = await getMangaStatistics(apiManga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const image = extractCoverImage(apiManga) || baseUI.image;
                    return {
                        ...baseUI,
                        chapters,
                        rating: stats.rating || 0,
                        views: stats.follows || 0,
                        coverImage: image,
                    };
                }));
                setLatestManga(withDetails);
                setError((e) => ({ ...e, latest: '' }));
            })
            .catch(() => setError((e) => ({ ...e, latest: 'Failed to load latest manga.' })))
            .finally(() => setLoading((l) => ({ ...l, latest: false })));
    }, [latestPage]);    useEffect(() => {
        setLoading((l) => ({ ...l, popular: true }));
        getPopularManga(PAGE_SIZE, (popularPage - 1) * PAGE_SIZE)
            .then(async (data) => {
                const withDetails = await Promise.all(data.map(async (apiManga) => {
                    const baseUI = mapApiMangaToUICard(apiManga);
                    const chapters = await getMangaChapterCount(apiManga.id).catch(() => 0);
                    const stats = await getMangaStatistics(apiManga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const image = extractCoverImage(apiManga) || baseUI.image;
                    return {
                        ...baseUI,
                        chapters,
                        rating: stats.rating || 0,
                        views: stats.follows || 0,
                        coverImage: image,
                    };
                }));
                setPopularManga(withDetails);
                setError((e) => ({ ...e, popular: '' }));
            })
            .catch(() => setError((e) => ({ ...e, popular: 'Failed to load popular manga.' })))
            .finally(() => setLoading((l) => ({ ...l, popular: false })));
    }, [popularPage]);    // For trending, use getPopularManga as a placeholder if no trending endpoint exists
    useEffect(() => {
        setLoading((l) => ({ ...l, trending: true }));
        getPopularManga(PAGE_SIZE, 0)
            .then(async (data) => {
                const withDetails = await Promise.all(data.map(async (apiManga) => {
                    const baseUI = mapApiMangaToUICard(apiManga);
                    const chapters = await getMangaChapterCount(apiManga.id).catch(() => 0);
                    const stats = await getMangaStatistics(apiManga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const image = extractCoverImage(apiManga) || baseUI.image;
                    return {
                        ...baseUI,
                        chapters,
                        rating: stats.rating || 0,
                        views: stats.follows || 0,
                        coverImage: image,
                    };
                }));
                setTrendingManga(withDetails);
                setError((e) => ({ ...e, trending: '' }));
            })
            .catch(() => setError((e) => ({ ...e, trending: 'Failed to load trending manga.' })))
            .finally(() => setLoading((l) => ({ ...l, trending: false })));
    }, []);

    // Hero Section: Alternate top 5 highest rated and top 5 trending (total 10, unique)
    const topRated = popularManga.slice(0, 5);
    const topTrending = trendingManga.slice(0, 5);
    // Alternate the two lists
    const heroMangaList: UIManga[] = [];
    for (let i = 0; i < 5; i++) {
        if (topRated[i]) heroMangaList.push(topRated[i]);
        if (topTrending[i]) heroMangaList.push(topTrending[i]);
    }
    // Deduplicate by id
    const uniqueHeroMangaList = uniqueManga(heroMangaList);

    // Most viewed and completed series are derived from popular/trending for now
    // Since 'views' and 'status' do not exist, just show a unique, shuffled, or sliced list
    const mostViewed: UIManga[] = uniqueManga([...popularManga, ...trendingManga]).slice(0, 6);
    const completedSeries: UIManga[] = uniqueManga([...popularManga, ...trendingManga, ...latestManga]).slice(0, 6);
    // For Latest Updates, combine latestManga and popularManga (or trendingManga) and deduplicate
    const latestUpdates: UIManga[] = uniqueManga([...latestManga, ...popularManga, ...trendingManga]).slice(0, 10);

    const handleGenreClick = (genre: string) => {
        navigate(`/browse?genre=${encodeURIComponent(genre)}`);
    };

    const handleViewAll = (section: string) => {
        navigate(`/browse?section=${section}`);
    };

    return (
        <div className="main-content-frame">
            <Header />
            {/* Hero Section */}
            <HeroSlider />
            
            {/* Main Content Container */}
            <div className="px-4 py-8">
                {/* Trending Now Section */}
                <MangaSection 
                    title="Trending Now" 
                    showViewAll={false}
                >
                    {loading.trending ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.trending ? (
                        <div className="text-center text-red-500 py-8">{error.trending}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">                            {trendingManga.slice(0, 12).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 3 === 0} // Show language badge for every 3rd manga
                                />
                            ))}
                        </div>
                    )}
                </MangaSection>                {/* Explore Genres Section */}
                <MangaSection 
                    title="Explore Genres" 
                    subtitle="Discover manga by your favorite genre categories" 
                    showViewAll={false}
                    variant="highlight"
                >
                    <GenreGrid onGenreClick={handleGenreClick} />
                </MangaSection>
                {/* Latest Updates Section */}
                <MangaSection 
                    title="Latest Updates"
                    showViewAll={false}
                >
                    {loading.latest ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : error.latest ? (
                        <div className="text-center text-red-500 py-8">{error.latest}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">                            {latestUpdates.slice(0, 12).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 4 === 0} // Show language badge for every 4th manga
                                />
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">                            {mostViewed.slice(0, 6).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index % 2 === 0} // Show language badge for every 2nd manga
                                />
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">                            {completedSeries.slice(0, 6).map((manga, index) => (
                                <MangaCard 
                                    key={manga.id} 
                                    manga={manga} 
                                    size="medium"
                                    showLanguageBadge={index === 1 || index === 4} // Show language badge for specific manga
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