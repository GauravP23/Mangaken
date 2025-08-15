"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapApiMangaToUICard = mapApiMangaToUICard;
// Map a MangaDex API Manga to a simplified UIManga shape
function mapApiMangaToUICard(manga) {
    var _a;
    // Title
    const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || '';
    // Description
    const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || '';
    // Cover image
    let cover = '';
    const coverRel = (_a = manga.relationships) === null || _a === void 0 ? void 0 : _a.find(r => r.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
        const fileName = coverRel.attributes.fileName;
        cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
    }
    // Genres/tags
    const genres = manga.attributes.tags.map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || '');
    return { id: manga.id, title, description, image: cover, genres };
}
