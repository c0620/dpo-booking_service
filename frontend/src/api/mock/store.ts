import { createSeedStore, SEED_ROOMS, type MockStore } from './seed';

const STORAGE_KEY = 'mock-api-store';

let store: MockStore | null = null;

function loadStore(): MockStore {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as MockStore;
    } catch {
      // fall through to seed
    }
  }
  const seed = createSeedStore();
  saveStore(seed);
  return seed;
}

function saveStore(data: MockStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMockStore(): MockStore {
  if (!store) store = loadStore();
  return store;
}

export function persistMockStore(): void {
  if (store) saveStore(store);
}

export function getRooms() {
  return SEED_ROOMS;
}

export function resetMockStore(): void {
  store = createSeedStore();
  saveStore(store);
}
