import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'; // For styling

const Header: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <header className="app-header">
            <Link to="/" className="logo">MangaSite</Link>
            <nav>
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/genres" className="nav-link">Genres</Link>
                <Link to="/popular" className="nav-link">Popular</Link>
                <Link to="/trending" className="nav-link">Trending</Link>
                {/* <Link to="/login" className="nav-link">Login</Link> */}
            </nav>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search manga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-button">Search</button>
            </form>
            {/* Add Light/Dark mode toggle, Login button, etc. here later */}
        </header>
    );
};

export default Header;