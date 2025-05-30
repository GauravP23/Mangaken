import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchManga } from '../services/mangaApi';
import MangaCard from '../components/MangaCard';
import { Manga } from '../types';

const PAGE_SIZE = 10;

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState<Manga[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (query) {
            searchManga(query, PAGE_SIZE, (page - 1) * PAGE_SIZE).then(setResults);
        } else {
            setResults([]);
        }
    }, [query, page]);

    if (!query) return <p>Enter a search term in the header.</p>;

    return (
        <div className="search-results-page">
            <h2>Search Results for "{query}"</h2>
            <div className="manga-grid">
                {results.map(manga => <MangaCard key={manga.id} manga={manga} />)}
            </div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
    );
};

export default SearchResultsPage;