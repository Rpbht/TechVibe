import type { QuestionItem, TechnologyMeta } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export interface PaginatedResult {
  data: QuestionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserProfile {
  id: number;
  email: string;
}

/**
 * Fetch all categories/technologies with real-time question counts.
 * Scalable to thousands of categories via O(1) indexed lookup.
 */
async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'include' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(url, { signal });
}

export async function fetchTechnologies(signal?: AbortSignal): Promise<TechnologyMeta[]> {
  return getJson<TechnologyMeta[]>(`${API_URL}/technologies`, signal);
}

export async function fetchDefaultTechnologies(signal?: AbortSignal): Promise<TechnologyMeta[]> {
  return getJson<TechnologyMeta[]>(`${API_URL}/technologies?default=true`, signal);
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<UserProfile | null> {
  const result = await getJson<{ user: UserProfile | null }>(`${API_URL}/auth/me`, signal);
  return result.user;
}

export async function authenticate(
  mode: 'login' | 'register',
  email: string,
  password: string,
): Promise<UserProfile> {
  const result = await requestJson<{ user: UserProfile }>(`${API_URL}/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return result.user;
}

export async function logout(): Promise<void> {
  await requestJson<{ success: boolean }>(`${API_URL}/auth/logout`, { method: 'POST' });
}

export async function saveCategoryOrder(categoryIds: string[]): Promise<void> {
  await requestJson<{ success: boolean }>(`${API_URL}/profile/category-order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryIds }),
  });
}

/**
 * Fetch single question by page index (1-indexed).
 * Scalable to 10,000+ questions per category without client memory exhaustion.
 */
export async function fetchQuestionPage(
  technologyId: string,
  page: number,
  limit: number = 1,
  signal?: AbortSignal,
): Promise<{ question: QuestionItem | null; total: number }> {
  const params = new URLSearchParams({
    technology: technologyId,
    page: String(page),
    limit: String(limit),
  });
  const json = await getJson<PaginatedResult>(`${API_URL}/questions?${params}`, signal);
  return {
    question: json.data[0] ?? null,
    total: json.total,
  };
}
