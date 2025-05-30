import React, { useEffect, useState } from 'react';
import { getLatestManga, getPopularManga } from '../services/mangaApi';
import MangaCard from '../components/MangaCard';
import { Manga } from '../types';

const PAGE_SIZE = 10;

const HomePage: React.FC = () => {
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

    return (
        <div className="homepage">
            <section>
                <h2>Latest Updates</h2>
                <div className="manga-grid">
                    {latestManga.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                </div>
                <button onClick={() => setLatestPage(p => Math.max(1, p - 1))} disabled={latestPage === 1}>Prev</button>
                <button onClick={() => setLatestPage(p => p + 1)}>Next</button>
            </section>
            <section>
                <h2>Popular Manga</h2>
                <div className="manga-grid">
                    {popularManga.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                </div>
                <button onClick={() => setPopularPage(p => Math.max(1, p - 1))} disabled={popularPage === 1}>Prev</button>
                <button onClick={() => setPopularPage(p => p + 1)}>Next</button>
            </section>
        </div>
    );
};

export default HomePage;