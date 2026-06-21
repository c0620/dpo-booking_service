export class MockApiError extends Error {
  response: { data: { title: string }; status: number };

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'MockApiError';
    this.response = { data: { title: message }, status };
  }
}

export function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
