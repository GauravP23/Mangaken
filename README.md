# MangaKen

A modern, fullstack Manga reader web application built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui, and Radix UI. It features a robust client and server, fetching real manga and chapter data from the MangaDex API, enhanced with AniList metadata for deeper insights.

![Homepage Hero Section](client/src/assets/images/Screenshot%20from%202026-10-01%2014-48-17.png)

## Screenshots

### Homepage and Trending Manga
![Trending Manga Section](client/src/assets/images/Screenshot%20from%202026-10-01%2014-48-32.png)

### Browse & Filter
![Browse and Filter](client/src/assets/images/Screenshot%20from%202026-10-01%2014-48-40.png)

### Manga Details and Related Manga
![Manga Details and Related Manga](client/src/assets/images/Screenshot%20from%202026-10-01%2014-48-48.png)

### Related Manga Drawer (while Browsing)
![Related Manga Drawer](client/src/assets/images/Screenshot%20from%202026-10-01%2014-50-08.png)

## Features

- **Modern UI**: Built with Tailwind CSS, shadcn/ui, and Radix UI for a beautiful, accessible, and responsive experience.
- **Hero Slider**: Showcases featured manga with real-time chapter counts and cover images.
- **Live Search**: Instant search with dropdown suggestions and a full search results page.
- **Homepage Sections**: Trending, Latest Updates, Most Viewed, and Completed Series, all using real API data.
- **Manga Details**: Detailed manga info, author, genres, and a full chapter list with navigation.
- **Chapter Reader**: Seamless reading experience with navigation, reading modes, and progress tracking.
- **Browse & Filter**: Browse all manga with advanced 3-state genre tag filters, status, demographic, year, and rating filters.
- **Related & Recommended Manga**: Franchise connections (prequels, sequels, spin-offs) and genre-based recommendations shown on every manga's detail page.
- **Related Manga Drawer**: Explore related series from the Browse page without losing your scroll position or filters — opens as a smooth slide-over panel.
- **Bookmarks / Library**: Save manga to your personal library using localStorage — persists across sessions.
- **AniList Analytics**: Community stats, popularity, and metadata powered by the AniList GraphQL API.
- **Robust Error Handling**: Graceful loading and error states throughout the app.
- **Server**: Node.js/Express backend with CORS enabled, proxying and normalizing MangaDex + AniList API data.

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Recharts
- **Backend**: Node.js, Express
- **APIs**: MangaDex (https://api.mangadex.org), AniList GraphQL (https://graphql.anilist.co)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd MangaKen
   ```

2. **Install dependencies:**
   - To install all dependencies (client, server, and root) with a single command:
     ```sh
     # From the root directory
     npm run install-all
     ```
   - Or install them separately:
     ```sh
     cd client
     npm install
     cd ../server
     npm install
     ```

3. **Start the development servers:**
   - To run both client and server concurrently with a single command:
     ```sh
     # From the root directory
     npm run dev
     ```
   - Or run them separately:
     - In one terminal, start the backend:
       ```sh
       cd server
       npm run dev
       ```
     - In another terminal, start the frontend:
       ```sh
       cd client
       npm run dev
       ```

4. **Open the app:**
   - Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- `client/` - Frontend React app (Vite, TypeScript, Tailwind, shadcn/ui)
- `server/` - Backend API server (Node.js, Express)

## Customization
- Update the list of featured manga in `HeroSlider.tsx`.
- Add or modify homepage sections in `Homepage.tsx`.
- Adjust API endpoints or normalization logic in `server/src/services/mangadexService.ts`.

## Credits
- [MangaDex API](https://api.mangadex.org)
- [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
