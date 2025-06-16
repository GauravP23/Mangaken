import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import MangaSection from '../components/MangaSection';
import MangaCard from '../components/MangaCard';
import GenreGrid from '../components/GenreGrid';
import Footer from '../components/Footer';
import { getLatestManga, getPopularManga, getMangaChapterCount, getMangaStatistics } from '../services/mangaApi';
import { Manga } from '../types';
import { UIManga } from '../types';


const PAGE_SIZE = 10;

// Utility to deduplicate manga by id
function uniqueManga(mangaList: Manga[]): Manga[] {
    const seen = new Set();
    return mangaList.filter((manga) => {
        if (seen.has(manga.id)) return false;
        seen.add(manga.id);
        return true;
    });
}

// Helper function to extract cover image from manga relationships
const extractCoverImage = (manga: Manga): string => {
    if (!manga.relationships) return '';
    
    const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
    if (!coverRel || !coverRel.attributes) return '';
    
    const fileName = coverRel.attributes.fileName || (coverRel.attributes as any).filename;
    if (!fileName) return '';
    
    return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
};

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
    const [popularPage, setPopularPage] = useState(1);    useEffect(() => {
        setLoading((l) => ({ ...l, latest: true }));
        getLatestManga(PAGE_SIZE, (latestPage - 1) * PAGE_SIZE)
            .then(async (data) => {
                // Fetch real chapter counts and statistics for each manga
                const withDetails = await Promise.all(data.map(async (manga) => {
                    const chapters = await getMangaChapterCount(manga.id).catch(() => 0);
                    const stats = await getMangaStatistics(manga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const coverImage = extractCoverImage(manga);
                    return { 
                        ...manga, 
                        chapters,
                        rating: stats.rating || 0,
                        follows: stats.follows || 0,
                        coverImage,
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
                // Fetch real chapter counts and statistics for each manga
                const withDetails = await Promise.all(data.map(async (manga) => {
                    const chapters = await getMangaChapterCount(manga.id).catch(() => 0);
                    const stats = await getMangaStatistics(manga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const coverImage = extractCoverImage(manga);
                    return { 
                        ...manga, 
                        chapters,
                        rating: stats.rating || 0,
                        follows: stats.follows || 0,
                        coverImage,
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
                // Fetch real chapter counts and statistics for each manga
                const withDetails = await Promise.all(data.map(async (manga) => {
                    const chapters = await getMangaChapterCount(manga.id).catch(() => 0);
                    const stats = await getMangaStatistics(manga.id).catch(() => ({ rating: 0, follows: 0 }));
                    const coverImage = extractCoverImage(manga);
                    return { 
                        ...manga, 
                        chapters,
                        rating: stats.rating || 0,
                        follows: stats.follows || 0,
                        coverImage,
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
    const heroMangaList: Manga[] = [];
    for (let i = 0; i < 5; i++) {
        if (topRated[i]) heroMangaList.push(topRated[i]);
        if (topTrending[i]) heroMangaList.push(topTrending[i]);
    }
    // Deduplicate by id
    const uniqueHeroMangaList = uniqueManga(heroMangaList);

    // Most viewed and completed series are derived from popular/trending for now
    // Since 'views' and 'status' do not exist, just show a unique, shuffled, or sliced list
    const mostViewed = uniqueManga([...popularManga, ...trendingManga]).slice(0, 6);
    const completedSeries = uniqueManga([...popularManga, ...trendingManga, ...latestManga]).slice(0, 6);
    // For Latest Updates, combine latestManga and popularManga (or trendingManga) and deduplicate
    const latestUpdates = uniqueManga([...latestManga, ...popularManga, ...trendingManga]).slice(0, 10);

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