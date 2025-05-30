import React from 'react';
import { Link } from 'react-router-dom';
import { Manga } from '../types'; // Make sure Manga type is defined in your types

interface MangaCardProps {
    manga: Manga;
}

// Function to get cover URL from MangaDex relationships
const getCoverImageUrl = (manga: Manga) => {
    const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
    if (coverArt && coverArt.attributes && coverArt.attributes.fileName) {
        return `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}`;
    }
    return '/placeholder-cover.jpg'; // Use a local placeholder image if cover not found
};

const MangaCard: React.FC<MangaCardProps> = ({ manga }) => {
    // Use English title if available, otherwise fallback to first available title
    const title =
        manga.attributes.title.en ||
        Object.values(manga.attributes.title)[0] ||
        'Untitled';
    const coverUrl = getCoverImageUrl(manga);

    return (
        <Link to={`/manga/${manga.id}`} className="manga-card">
            <img
                src={coverUrl}
                alt={title}
                className="manga-card-cover"
                loading="lazy"
            />
            <h3 className="manga-card-title">{title}</h3>
            {/* Optionally add more info here, like latest chapter */}
        </Link>
    );
};

export default MangaCard;