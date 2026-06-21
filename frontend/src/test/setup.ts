import { beforeEach } from 'vitest';
import { resetMockStore } from '../api/mock/store';

beforeEach(() => {
  localStorage.clear();
  resetMockStore();
});
