export interface MockDocumentStore {
  [collectionPath: string]: Array<Record<string, unknown> & { id: string }>;
}

declare global {
  interface Window {
    __MOCK_DOCUMENTS__?: MockDocumentStore;
  }
}
