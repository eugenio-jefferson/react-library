import type {
  OpenLibraryAuthorResponse,
  OpenLibraryWorkDescription,
  OpenLibraryWorkResponse,
} from "@/type/openLibrary";
import type { BookDetails } from "../../type/book";
import { normalizeWorkId, type OpenLibraryClient, requestJson } from "./client";
import { formatCoverUrl } from "./mappers";

function parseDescription(
  description: string | OpenLibraryWorkDescription | undefined,
): string {
  if (!description) return "";
  if (typeof description === "string") return description.trim();
  return (description.value || "").trim();
}

async function resolveWorkAuthor(
  client: OpenLibraryClient,
  work: OpenLibraryWorkResponse,
): Promise<string> {
  const names = await Promise.all(
    (work.authors || []).map(async (entry) => {
      if (entry.author?.name) return entry.author.name;
      if (!entry.author?.key) return null;

      const authorKey = entry.author.key.replace("/authors/", "");
      const authorUrl = `${client.baseUrl}/authors/${encodeURIComponent(
        authorKey,
      )}.json`;

      try {
        const author = await requestJson<OpenLibraryAuthorResponse>(
          client,
          authorUrl,
          `author_${authorKey}`,
          (res) => `Error fetching author on Open Library (${res.status})`,
        );

        return author.name?.trim() || null;
      } catch {
        return null;
      }
    }),
  );

  const validNames = names.filter(
    (name): name is string => Boolean(name && name.trim()),
  );

  return validNames.length > 0 ? validNames.join(", ") : "Unknown Author";
}

export async function getBookDetails(
  client: OpenLibraryClient,
  workId: string,
): Promise<BookDetails> {
  const normalizedId = normalizeWorkId(workId);
  const workUrl = `${client.baseUrl}/works/${encodeURIComponent(
    normalizedId,
  )}.json`;

  const work = await requestJson<OpenLibraryWorkResponse>(
    client,
    workUrl,
    `work_${normalizedId}`,
    (res) =>
      `Error fetching book details on Open Library (${res.status}: ${res.statusText})`,
  );

  const author = await resolveWorkAuthor(client, work);

  return {
    id: normalizedId,
    key: work.key || `/works/${normalizedId}`,
    title: work.title?.trim() || "Untitled",
    author,
    category: work.subjects?.[0] || "General",
    description: parseDescription(work.description),
    cover_image: formatCoverUrl(work.covers?.[0], "L"),
    subjects: work.subjects || [],
    publish_date: work.publish_date,
  };
}
