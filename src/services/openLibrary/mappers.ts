import type { OpenLibraryDoc, OpenLibrarySubjectWork } from "@/type/openLibrary";
import type { Book } from "../../type/book";

export const DEFAULT_PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="20" y="20" width="260" height="410" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="6,6" rx="8"/>
      <path d="M120 180h60M120 210h60M120 240h40" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="150" cy="130" r="24" fill="#334155"/>
      <text x="50%" y="300" font-size="16" fill="#cbd5e1" font-family="system-ui, sans-serif" text-anchor="middle" font-weight="600">No Cover Available</text>
      <text x="50%" y="325" font-size="12" fill="#64748b" font-family="system-ui, sans-serif" text-anchor="middle">Open Library</text>
    </svg>`
  );

export function formatCoverUrl(
  coverId?: number,
  size: "S" | "M" | "L" = "M",
): string {
  if (!coverId || coverId <= 0) {
    return DEFAULT_PLACEHOLDER_COVER;
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

let fallbackIdSequence = 0;
function createFallbackId(prefix: string): string {
  fallbackIdSequence += 1;
  return `${prefix}-${fallbackIdSequence}`;
}

export function mapDocToBook(doc: OpenLibraryDoc): Book {
  const cleanId = doc.key
    ? doc.key.replace("/works/", "")
    : createFallbackId("book");

  const author =
    Array.isArray(doc.author_name) && doc.author_name.length > 0
      ? doc.author_name.join(", ")
      : "Unknown Author";

  const subjects = doc.subject || [];
  const genre = subjects.length > 0 ? subjects[0] : "General";

  return {
    id: cleanId,
    key: doc.key,
    title: doc.title?.trim() || "Untitled",
    author,
    genre,
    status: "Available",
    cover_image: formatCoverUrl(doc.cover_i, "M"),
    subjects,
    first_publish_year: doc.first_publish_year,
    ratings_average:
      typeof doc.ratings_average === "number"
        ? Math.round(doc.ratings_average * 10) / 10
        : undefined,
    ratings_count: doc.ratings_count,
    readinglog_count: doc.readinglog_count,
    edition_count: doc.edition_count,
  };
}

export function mapSubjectWorkToBook(
  work: OpenLibrarySubjectWork,
  defaultGenre: string,
): Book {
  const cleanId = work.key
    ? work.key.replace("/works/", "")
    : createFallbackId("subject-book");

  let author = "Unknown Author";
  if (work.authors && work.authors.length > 0) {
    author = work.authors.map((a) => a.name).join(", ");
  } else if (work.author_name && work.author_name.length > 0) {
    author = work.author_name.join(", ");
  }

  const coverId = work.cover_id || work.cover_i;
  const subjects = work.subject || [];
  const genre = subjects.length > 0 ? subjects[0] : defaultGenre;

  return {
    id: cleanId,
    key: work.key,
    title: work.title?.trim() || "Untitled",
    author,
    genre,
    status: "Available",
    cover_image: formatCoverUrl(coverId, "M"),
    subjects,
    first_publish_year: work.first_publish_year,
    edition_count: work.edition_count,
  };
}
