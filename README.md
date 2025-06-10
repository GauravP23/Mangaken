# MangaKen

A modern, fullstack Manga reader web application built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui, and Radix UI. It features a robust client and server, fetching real manga and chapter data from the MangaDex API.

## Features

- **Modern UI**: Built with Tailwind CSS, shadcn/ui, and Radix UI for a beautiful, accessible, and responsive experience.
- **Hero Slider**: Showcases featured manga with real-time chapter counts and cover images.
- **Live Search**: Instant search with dropdown suggestions and a full search results page.
- **Homepage Sections**: Trending, Latest Updates, Most Viewed, and Completed Series, all using real API data.
- **Manga Details**: Detailed manga info, author, genres, and a full chapter list with navigation.
- **Chapter Reader**: Seamless reading experience with navigation, reading modes, and progress tracking.
- **Browse & Filter**: Browse all manga, filter by genre/status, and sort by rating, views, chapters, or title.
- **Robust Error Handling**: Graceful loading and error states throughout the app.
- **Server**: Node.js/Express backend with CORS enabled, proxying and normalizing MangaDex API data for the client.

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Node.js, Express
- **API**: MangaDex (https://api.mangadex.org)

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
   ```sh
   cd client
   npm install
   cd ../server
   npm install
   ```

3. **Start the development servers:**
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
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

