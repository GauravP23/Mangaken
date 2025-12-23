export interface Manga {
  id: string;
  title: string;
  description: string;
  image: string;
  genres: string[];
  rating: number;
  status: 'ongoing' | 'completed';
  chapters: number;
  views: number;
  author: string;
  lastUpdate: string;
}

export const trendingManga: Manga[] = [
  {
    id: '1',
    title: 'Attack on Titan',
    description: 'Humanity fights for survival against giant humanoid Titans in a world where they are confined behind massive walls.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'Drama', 'Fantasy'],
    rating: 9.2,
    status: 'completed',
    chapters: 139,
    views: 15000000,
    author: 'Hajime Isayama',
    lastUpdate: '2021-04-09'
  },
  {
    id: '2',
    title: 'One Piece',
    description: 'Follow Monkey D. Luffy on his quest to become the Pirate King and find the legendary treasure known as One Piece.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Adventure', 'Comedy', 'Shounen'],
    rating: 9.5,
    status: 'ongoing',
    chapters: 1095,
    views: 25000000,
    author: 'Eiichiro Oda',
    lastUpdate: '2024-06-03'
  },
  {
    id: '3',
    title: 'Demon Slayer',
    description: 'A young boy becomes a demon slayer to save his sister and avenge his family in Taisho-era Japan.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'Historical', 'Supernatural'],
    rating: 8.9,
    status: 'completed',
    chapters: 205,
    views: 12000000,
    author: 'Koyoharu Gotouge',
    lastUpdate: '2020-05-18'
  }
];

export const topManga: Manga[] = [
  {
    id: '4',
    title: 'Naruto',
    description: 'The story of Naruto Uzumaki, a young ninja who seeks recognition and dreams of becoming the Hokage.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'Martial Arts', 'Shounen'],
    rating: 8.8,
    status: 'completed',
    chapters: 700,
    views: 20000000,
    author: 'Masashi Kishimoto',
    lastUpdate: '2014-11-10'
  },
  {
    id: '5',
    title: 'Dragon Ball',
    description: 'Goku and friends defend the Earth against various threats while searching for the Dragon Balls.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'Adventure', 'Comedy'],
    rating: 9.0,
    status: 'completed',
    chapters: 519,
    views: 18000000,
    author: 'Akira Toriyama',
    lastUpdate: '1995-06-05'
  },
  {
    id: '6',
    title: 'My Hero Academia',
    description: 'In a world where superpowers are common, a powerless boy dreams of becoming a superhero.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'School', 'Superhero'],
    rating: 8.7,
    status: 'ongoing',
    chapters: 400,
    views: 14000000,
    author: 'Kohei Horikoshi',
    lastUpdate: '2024-06-01'
  }
];

export const latestUpdates: Manga[] = [
  {
    id: '7',
    title: 'Jujutsu Kaisen',
    description: 'A high school student joins a secret organization of sorcerers to eliminate cursed spirits.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'School', 'Supernatural'],
    rating: 8.9,
    status: 'ongoing',
    chapters: 245,
    views: 16000000,
    author: 'Gege Akutami',
    lastUpdate: '2024-06-04'
  },
  {
    id: '8',
    title: 'Black Clover',
    description: 'In a world of magic, a boy born without magical powers aims to become the Wizard King.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Action', 'Comedy', 'Magic'],
    rating: 8.5,
    status: 'ongoing',
    chapters: 370,
    views: 11000000,
    author: 'Yuki Tabata',
    lastUpdate: '2024-06-03'
  }
];

export const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Historical', 'School', 'Magic', 'Martial Arts', 'Psychological'
];
