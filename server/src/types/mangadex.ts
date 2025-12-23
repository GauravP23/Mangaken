// server/src/types/mangadex.ts

// A very simplified set of types. You'll expand these.
export interface MangaDexResponse<T> {
  result: 'ok' | 'error';
  response: string; // e.g., "collection"
  data: T[];
  limit: number;
  offset: number;
  total: number;
  errors?: Array<{id: string, status: number, title: string, detail: string}>; // For error responses
}

export interface MangaDexSingleResponse<T> {
  result: 'ok' | 'error';
  response: string; // e.g., "entity"
  data: T;
  errors?: Array<{id: string, status: number, title: string, detail: string}>;
}

export interface Tag { // Added basic Tag definition
  id: string;
  type: 'tag';
  attributes: {
      name: { [key: string]: string };
      group: string;
      version: number;
  };
  relationships: any[]; // Can be empty or contain other relationships
}

export interface MangaAttributes {
  title: { [key: string]: string }; // e.g., { "en": "Title" }
  altTitles: ({ [key: string]: string })[];
  description: { [key: string]: string };
  originalLanguage: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: Tag[]; // Updated to use Tag interface
  createdAt: string;
  updatedAt: string;
  latestUploadedChapter?: string;
}

export interface Relationship {
  id: string;
  type: string;
  related?: string;
  attributes?: any;
}

export interface Manga {
  id: string;
  type: 'manga';
  attributes: MangaAttributes;
  relationships: Relationship[];
}

export interface CoverArtAttributes {
  description: string;
  volume: string | null;
  fileName: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CoverArtRelationship extends Relationship {
  type: 'cover_art';
  attributes?: CoverArtAttributes;
}

// --- Chapter Related Types ---
export interface ChapterAttributes {
  volume: string | null;
  chapter: string | null;
  title: string | null;
  translatedLanguage: string;
  uploader?: string;
  externalUrl: string | null;
  pages: number;
  publishAt: string;
  readableAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Chapter {
  id: string;
  type: 'chapter';
  attributes: ChapterAttributes;
  relationships: Relationship[];
}

// Ensure this interface is present and exported
export interface ChapterFeedResponse {
  result: 'ok' | 'error';
  data: Chapter[]; // This should be an array of Chapter objects
  limit: number;
  offset: number;
  total: number;
  errors?: Array<{id: string, status: number, title: string, detail: string}>;
}

// --- For /at-home/server/{chapterId} ---
export interface AtHomeServerResponse {
  result: 'ok' | 'error';
  baseUrl: string;
  chapter: {
      hash: string;
      data: string[];
      dataSaver: string[];
  };
  errors?: Array<{id: string, status: number, title: string, detail: string}>;
}