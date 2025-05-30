import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Homepage with manga lists
import MangaDetailsPage from './pages/MangaDetailsPage'; // Manga details and chapters
import ChapterReaderPage from './pages/ChapterReaderPage'; // Manga chapter reader
import SearchResultsPage from './pages/SearchResultsPage'; // Search results
import NotFoundPage from './pages/NotFoundPage'; // 404 page
import Header from './components/Layout/Header'; // Navigation and search
import Footer from './components/Layout/Footer'; // Footer
import './App.css'; // Global styles

function App() {
    return (
        <Router>
            <div className="app-container">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/manga/:mangaId" element={<MangaDetailsPage />} />
                        <Route path="/chapter/:chapterId" element={<ChapterReaderPage />} />
                        <Route path="/search" element={<SearchResultsPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;