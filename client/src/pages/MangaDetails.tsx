import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMangaDetails, getMangaFeed } from '../services/mangaApi';
import { Manga, Chapter } from '../types';
import { getCoverImageUrl } from '../components/MangaCard';
import './MangaDetailsPage.css';

const MangaDetailsPage: React.FC = () => {
    const { mangaId } = useParams<{ mangaId: string }>();
    const [manga, setManga] = useState<Manga | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mangaId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [mangaData, feedData] = await Promise.all([
                    getMangaDetails(mangaId),
                    getMangaFeed(mangaId)
                ]);
                setManga(mangaData);
                // Sort chapters by volume and chapter number
                const sortedChapters = feedData.sort((a, b) => {
                    const volA = parseFloat(a.attributes.volume || "0");
                    const volB = parseFloat(b.attributes.volume || "0");
                    if (volA !== volB) return volA - volB;
                    const chapA = parseFloat(a.attributes.chapter || "0");
                    const chapB = parseFloat(b.attributes.chapter || "0");
                    return chapA - chapB;
                });
                setChapters(sortedChapters);
            } catch (err) {
                console.error("Failed to fetch manga details or feed:", err);
                setError("Could not load manga details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [mangaId]);

    if (loading) return <p>Loading details...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!manga) return <p>Manga not found.</p>;

    const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0];
    const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || "No description available.";

    // Extract genres/tags, author, artist from relationships and tags
    const genres = manga.attributes.tags
        .map(tag => tag.attributes.name.en)
        .filter(Boolean)
        .join(', ');

    const author = manga.relationships.find(rel => rel.type === 'author');
    const artist = manga.relationships.find(rel => rel.type === 'artist');

    return (
        <div className="manga-details-page">
            <div className="manga-info-header">
                <img src={getCoverImageUrl(manga)} alt={title} className="details-cover" />
                <div className="manga-info-text">
                    <h1>{title}</h1>
                    <p><strong>Status:</strong> {manga.attributes.status}</p>
                    <p><strong>Year:</strong> {manga.attributes.year}</p>
                    {author && <p><strong>Author:</strong> {author.attributes?.name || 'Unknown'}</p>}
                    {artist && <p><strong>Artist:</strong> {artist.attributes?.name || 'Unknown'}</p>}
                    {genres && <p><strong>Genres:</strong> {genres}</p>}
                    <div
                        className="manga-description"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                </div>
            </div>

            <div className="chapter-list-section">
                <h2>Chapters</h2>
                {chapters.length === 0 && <p>No chapters found.</p>}
                <ul className="chapter-list">
                    {chapters.map(chap => (
                        <li key={chap.id} className="chapter-item">
                            <Link to={`/chapter/${chap.id}`}>
                                Chapter {chap.attributes.chapter || '?'}
                                {chap.attributes.title && ` - ${chap.attributes.title}`}
                                <span className="chapter-lang">
                                    ({chap.attributes.translatedLanguage || 'N/A'})
                                </span>
                            </Link>
                            {/* Optionally: show scanlation group, upload date */}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MangaDetailsPage;