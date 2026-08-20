export interface FirestoreBatchOperations {
  set<T = unknown>(path: string, data: Partial<T>, options?: { merge?: boolean }): void;
  update<T = unknown>(path: string, data: Partial<T>): void;
  delete(path: string): void;
}
