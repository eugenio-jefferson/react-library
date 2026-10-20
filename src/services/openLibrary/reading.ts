import type {
  ArchiveSearchResponse,
  IIIFCanvas,
  IIIFManifest,
  ReadingPages,
  ReadingSource,
} from "@/type/reading";
import type { OpenLibraryEditionsResponse } from "@/type/openLibrary";
import { normalizeWorkId, type OpenLibraryClient, requestJson } from "./client";

export function formatReaderUrl(iaIdentifier: string): string {
  return `https://archive.org/embed/${encodeURIComponent(iaIdentifier.trim())}`;
}

export async function getReadingSource(
  client: OpenLibraryClient,
  workId: string,
): Promise<ReadingSource | null> {
  const normalizedId = normalizeWorkId(workId);
  const editionsUrl = `${client.baseUrl}/works/${encodeURIComponent(
    normalizedId,
  )}/editions.json?limit=100&fields=key,title,ocaid`;

  const data = await requestJson<OpenLibraryEditionsResponse>(
    client,
    editionsUrl,
    `editions_${normalizedId}`,
    (res) =>
      `Error fetching editions on Open Library (${res.status}: ${res.statusText})`,
  );

  const readable = (data.entries || []).filter((entry) =>
    Boolean(entry.ocaid?.trim()),
  );
  if (readable.length === 0) return null;

  // bwb_* items are book web bundles, not page-readable scans
  const edition =
    readable.find((entry) => !entry.ocaid!.startsWith("bwb_")) ?? readable[0];

  return {
    workId: normalizedId,
    iaIdentifier: edition.ocaid!.trim(),
    editionKey: edition.key || "",
    editionTitle: edition.title?.trim() || null,
  };
}

function resolveCanvasImageUrl(canvas: IIIFCanvas): string | null {
  const v3Body = canvas.items?.[0]?.items?.[0]?.body;
  const v2Resource = canvas.images?.[0]?.resource;

  const raw =
    v3Body?.service?.[0]?.id ||
    v2Resource?.service?.[0]?.id ||
    v2Resource?.service?.[0]?.["@id"] ||
    v3Body?.id ||
    v2Resource?.id ||
    v2Resource?.["@id"];

  if (!raw) return null;
  return toReaderImageUrl(raw);
}

function toReaderImageUrl(raw: string): string {
  const clean = raw.replace(/\/$/, "");
  if (clean.includes("/full/")) {
    return clean.replace("/full/max/", "/full/1000,/");
  }
  return `${clean}/full/1000,/0/default.jpg`;
}

function parseCanvasLabel(
  label: IIIFCanvas["label"] | undefined,
): string | null {
  if (typeof label === "string") return label.trim() || null;
  if (label && typeof label === "object") {
    const first = Object.values(label).flat()[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return null;
}

export async function getReadingPages(
  client: OpenLibraryClient,
  iaIdentifier: string,
): Promise<ReadingPages> {
  const identifier = iaIdentifier.trim();
  const manifestUrl = `https://iiif.archive.org/iiif/${encodeURIComponent(
    identifier,
  )}/manifest.json`;

  const manifest = await requestJson<IIIFManifest>(
    client,
    manifestUrl,
    `manifest_${identifier}`,
    (res) =>
      `Error fetching book pages (${res.status}: ${res.statusText})`,
    "application/ld+json, application/json",
  );

  const canvases = manifest.items || manifest.sequences?.[0]?.canvases || [];

  const pages = canvases.flatMap((canvas, index) => {
    const imageUrl = resolveCanvasImageUrl(canvas);
    if (!imageUrl) return [];
    return [
      {
        index,
        label: parseCanvasLabel(canvas.label) ?? String(index + 1),
        imageUrl,
      },
    ];
  });

  if (pages.length === 0) {
    throw new Error("No readable pages were found for this book.");
  }

  return { iaIdentifier: identifier, total: pages.length, pages };
}

function escapeArchivePhrase(value: string): string {
  return value.replace(/["\\]/g, " ").trim();
}

export async function searchArchiveIdentifier(
  client: OpenLibraryClient,
  title: string,
  author?: string,
): Promise<string | null> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  const clauses = [
    `title:("${escapeArchivePhrase(cleanTitle)}")`,
    "mediatype:texts",
  ];
  const cleanAuthor = author?.trim();
  if (cleanAuthor && cleanAuthor !== "Unknown Author") {
    clauses.unshift(`creator:("${escapeArchivePhrase(cleanAuthor)}")`);
  }

  const query = clauses.join(" AND ");
  const searchUrl =
    "https://archive.org/advancedsearch.php" +
    `?q=${encodeURIComponent(query)}` +
    "&fl%5B%5D=identifier&rows=5&page=1&output=json";

  const data = await requestJson<ArchiveSearchResponse>(
    client,
    searchUrl,
    `archive_${cleanTitle}_${cleanAuthor || ""}`,
    (res) =>
      `Error searching archive.org (${res.status}: ${res.statusText})`,
  );

  const identifier = data.response?.docs?.[0]?.identifier;
  return typeof identifier === "string" && identifier.trim()
    ? identifier.trim()
    : null;
}
