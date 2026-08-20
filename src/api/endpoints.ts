import { api } from './client';
import type {
  ApiBuildingFamily,
  ApiCategory,
  ApiCityBuilding,
  ApiFriend,
  ApiFriendRequest,
  ApiPairedTask,
  ApiTimeEntry,
  ApiTimeEntrySummary,
  ApiUser,
  ApiUserStats,
  AuthResponse,
  BuildingFamilyKey,
  ShapeKind,
} from './types';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<ApiUser>('/auth/me'),
};

export const usersApi = {
  stats: () => api.get<ApiUserStats>('/users/me/stats'),
  searchByEmail: (email: string) => api.get<ApiUser>(`/users/search?email=${encodeURIComponent(email)}`),
};

export const categoriesApi = {
  list: () => api.get<ApiCategory[]>('/categories'),
  create: (payload: {
    title: string;
    color: string;
    shape: ShapeKind;
    building_family: BuildingFamilyKey;
    minutes_per_day_target: number;
  }) => api.post<ApiCategory>('/categories', payload),
};

export const buildingFamiliesApi = {
  list: () => api.get<ApiBuildingFamily[]>('/building-families'),
};

export const timeEntriesApi = {
  active: () => api.get<ApiTimeEntry | null>('/time-entries/active'),
  start: (categoryId: string, pairedTaskId?: string) =>
    api.post<ApiTimeEntry>('/time-entries/start', { category_id: categoryId, paired_task_id: pairedTaskId }),
  stop: (entryId: string) => api.post<ApiTimeEntry>(`/time-entries/${entryId}/stop`),
  summary: (date?: string) => api.get<ApiTimeEntrySummary>(`/time-entries/summary${date ? `?date=${date}` : ''}`),
};

export const cityApi = {
  mine: () => api.get<{ buildings: ApiCityBuilding[] }>('/city/me'),
};

export const friendsApi = {
  list: () => api.get<ApiFriend[]>('/friends'),
  incomingRequests: () => api.get<ApiFriendRequest[]>('/friends/requests?direction=incoming'),
  sendRequest: (toUserId: string) => api.post<ApiFriendRequest>('/friends/requests', { to_user_id: toUserId }),
  accept: (requestId: string) => api.post<ApiFriendRequest>(`/friends/requests/${requestId}/accept`),
  decline: (requestId: string) => api.post<ApiFriendRequest>(`/friends/requests/${requestId}/decline`),
};

export const pairedTasksApi = {
  listMine: () => api.get<ApiPairedTask[]>('/paired-tasks?mine=true'),
  create: (payload: {
    title: string;
    description?: string;
    building_family: BuildingFamilyKey;
    target_minutes: number;
    target_type: 'combined' | 'per_participant';
    due_at: string;
    participant_user_ids: string[];
  }) => api.post<ApiPairedTask>('/paired-tasks', payload),
};
