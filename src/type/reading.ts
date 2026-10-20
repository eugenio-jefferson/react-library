export interface ReadingSource {
  workId: string;
  iaIdentifier: string;
  editionKey: string;
  editionTitle: string | null;
}

export interface ReadingPage {
  index: number;
  label: string;
  imageUrl: string;
}

export interface ReadingPages {
  iaIdentifier: string;
  total: number;
  pages: ReadingPage[];
}

export interface IIIFImageServiceRef {
  id?: string;
  "@id"?: string;
}

export interface IIIFCanvas {
  label?: string | Record<string, string[]>;
  items?: Array<{
    items?: Array<{
      body?: {
        id?: string;
        service?: IIIFImageServiceRef[];
      };
    }>;
  }>;
  images?: Array<{
    resource?: {
      id?: string;
      "@id"?: string;
      service?: IIIFImageServiceRef[];
    };
  }>;
}

export interface IIIFManifest {
  items?: IIIFCanvas[];
  sequences?: Array<{ canvases?: IIIFCanvas[] }>;
}

export interface ArchiveSearchResponse {
  response?: {
    docs?: Array<{ identifier?: string }>;
  };
}
