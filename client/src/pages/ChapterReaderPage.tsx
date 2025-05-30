import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getChapterPages } from '../services/mangaApi';
import { AtHomeServerResponse } from '../types';
import './ChapterReaderPage.css';

const ChapterReaderPage: React.FC = () => {
    const { chapterId } = useParams<{ chapterId: string }>();
    const [pages, setPages] = useState<string[]>([]);
    const [serverInfo, setServerInfo] = useState<AtHomeServerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [readingMode, setReadingMode] = useState<'long-strip' | 'single-page'>('long-strip');
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

    useEffect(() => {
        if (!chapterId) return;
        setLoading(true);
        setError(null);
        setPages([]);

        getChapterPages(chapterId)
            .then(data => {
                setServerInfo(data);
                const imageUrls = data.chapter.data.map(fileName =>
                    `${data.baseUrl}/data/${data.chapter.hash}/${fileName}`
                );
                setPages(imageUrls);
                setCurrentImageIndex(0);
                imageRefs.current = imageUrls.map(() => null);
            })
            .catch(err => {
                console.error("Failed to fetch chapter pages:", err);
                setError("Could not load chapter pages.");
            })
            .finally(() => setLoading(false));
    }, [chapterId]);

    // Keyboard navigation for single page mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (readingMode !== 'single-page' || pages.length === 0) return;
            if (event.key === 'ArrowRight') {
                setCurrentImageIndex(prev => Math.min(prev + 1, pages.length - 1));
            } else if (event.key === 'ArrowLeft') {
                setCurrentImageIndex(prev => Math.max(prev - 1, 0));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [readingMode, pages.length]);

    // Scroll to current image in single page mode
    useEffect(() => {
        if (readingMode === 'single-page' && imageRefs.current[currentImageIndex]) {
            imageRefs.current[currentImageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentImageIndex, readingMode]);

    if (loading) return <p>Loading chapter...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!serverInfo || pages.length === 0) return <p>No pages found for this chapter.</p>;

    return (
        <div className="chapter-reader-page">
            <div className="reader-controls">
                <button onClick={() => setReadingMode('long-strip')} disabled={readingMode === 'long-strip'}>Long Strip</button>
                <button onClick={() => setReadingMode('single-page')} disabled={readingMode === 'single-page'}>Single Page</button>
                {readingMode === 'single-page' && (
                    <span>Page {currentImageIndex + 1} of {pages.length}</span>
                )}
                {/* Add Prev/Next chapter buttons here */}
            </div>

            <div className={`reader-content ${readingMode}`}>
                {readingMode === 'long-strip' && pages.map((pageUrl, index) => (
                    <img key={index} src={pageUrl} alt={`Page ${index + 1}`} className="manga-page" />
                ))}
                {readingMode === 'single-page' && pages.length > 0 && (
                    pages.map((pageUrl, index) => (
                        <img
                            key={index}
                            ref={el => imageRefs.current[index] = el}
                            src={pageUrl}
                            alt={`Page ${index + 1}`}
                            className="manga-page"
                            style={{ display: index === currentImageIndex ? 'block' : 'none' }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ChapterReaderPage;