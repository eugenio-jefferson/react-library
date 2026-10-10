import type { RateLimiter } from "../services/rateLimiter";

export interface OpenLibraryServiceConfig {
  baseUrl?: string;
  rateLimiter?: RateLimiter;
  fetcher?: typeof fetch;
}

export interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  subject?: string[];
  first_publish_year?: number;
  ratings_average?: number;
  ratings_count?: number;
  readinglog_count?: number;
  edition_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound?: number;
  start?: number;
  docs?: OpenLibraryDoc[];
}

export interface OpenLibrarySubjectWork {
  key?: string;
  title?: string;
  authors?: Array<{ name: string; key?: string }>;
  author_name?: string[];
  cover_id?: number;
  cover_i?: number;
  subject?: string[];
  first_publish_year?: number;
  edition_count?: number;
}

export interface OpenLibrarySubjectResponse {
  name?: string;
  work_count?: number;
  works?: OpenLibrarySubjectWork[];
}

export interface OpenLibraryTrendingResponse {
  works?: OpenLibrarySubjectWork[];
  docs?: OpenLibraryDoc[];
}
