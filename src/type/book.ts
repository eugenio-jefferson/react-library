export interface Book {
  id: string;
  key?: string;
  title: string;
  author: string;
  genre: string;
  status: string;
  cover_image: string;
  subjects?: string[];
  first_publish_year?: number;
  ratings_average?: number;
  ratings_count?: number;
  readinglog_count?: number;
  edition_count?: number;
}

export type BookSortOption =
  | "relevance"
  | "popularity"
  | "rating"
  | "author"
  | "newest"
  | "oldest"
  | "title";

export interface BookSearchParams {
  query?: string;
  author?: string;
  genre?: string;
  sort?: BookSortOption;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface BookSearchResult {
  books: Book[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CategoryDefinition {
  key: string;
  label: string;
}

export interface CategoryBooks {
  category: string;
  categoryLabel: string;
  books: Book[];
}

export interface HomeCatalogData {
  trending: Book[];
  categories: CategoryBooks[];
}

export interface BookDetails {
  id: string;
  key: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover_image: string;
  subjects: string[];
  publish_date?: string;
}
