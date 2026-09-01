export type MockDocumentStore = Record<string, (Record<string, unknown> & { id: string })[]>;

declare global {
  interface Window {
    __MOCK_DOCUMENTS__?: MockDocumentStore;
  }
}
