import { api } from './client';
import type {
  ApiBuildingFamily,
  ApiCategory,
  ApiCityBuilding,
  ApiComment,
  ApiCompany,
  ApiCompanyInvite,
  ApiCompanyMember,
  ApiCompanyRank,
  ApiFriend,
  ApiFriendRequest,
  ApiLeaderboardPage,
  ApiNotification,
  ApiNotificationPage,
  ApiPairedTask,
  ApiPost,
  ApiTimeEntry,
  ApiTimeEntrySummary,
  ApiUser,
  ApiUserPublic,
  ApiUserStats,
  AuthResponse,
  BuildingFamilyKey,
  CompanyRole,
  LeaderboardPeriod,
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
  get: (userId: string) => api.get<ApiUserPublic>(`/users/${userId}`),
  updateMe: (payload: { name?: string; status?: string; avatar_color?: string; daily_goal_minutes?: number }) =>
    api.patch<ApiUser>('/users/me', payload),
};

export const postsApi = {
  feed: (authorId?: string) => api.get<ApiPost[]>(`/posts${authorId ? `?author_id=${authorId}` : ''}`),
  create: (text: string) => api.post<ApiPost>('/posts', { text }),
  remove: (postId: string) => api.delete<void>(`/posts/${postId}`),
  like: (postId: string) => api.post<ApiPost>(`/posts/${postId}/like`),
  unlike: (postId: string) => api.delete<ApiPost>(`/posts/${postId}/like`),
  comments: (postId: string) => api.get<ApiComment[]>(`/posts/${postId}/comments`),
  addComment: (postId: string, text: string) => api.post<ApiComment>(`/posts/${postId}/comments`, { text }),
  removeComment: (commentId: string) => api.delete<void>(`/comments/${commentId}`),
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

export const companiesApi = {
  list: (mine: boolean) => api.get<ApiCompany[]>(`/companies?mine=${mine}`),
  get: (companyId: string) => api.get<ApiCompany>(`/companies/${companyId}`),
  create: (payload: { name: string; description?: string; is_public?: boolean }) =>
    api.post<ApiCompany>('/companies', payload),
  remove: (companyId: string) => api.delete<void>(`/companies/${companyId}`),
  city: (companyId: string) => api.get<{ buildings: ApiCityBuilding[] }>(`/companies/${companyId}/city`),
  members: (companyId: string) => api.get<ApiCompanyMember[]>(`/companies/${companyId}/members`),
  updateMemberRole: (companyId: string, userId: string, role: CompanyRole) =>
    api.patch<ApiCompanyMember>(`/companies/${companyId}/members/${userId}`, { role }),
  removeMember: (companyId: string, userId: string) => api.delete<void>(`/companies/${companyId}/members/${userId}`),
  invites: (companyId: string) => api.get<ApiCompanyInvite[]>(`/companies/${companyId}/invites`),
  createInvite: (companyId: string) => api.post<ApiCompanyInvite>(`/companies/${companyId}/invites`, {}),
  join: (inviteCode: string) => api.post<ApiCompany>('/companies/join', { invite_code: inviteCode }),
};

export const leaderboardApi = {
  companies: (period: LeaderboardPeriod, limit = 20, offset = 0) =>
    api.get<ApiLeaderboardPage>(`/leaderboard/companies?period=${period}&limit=${limit}&offset=${offset}`),
  companyRank: (companyId: string, period: LeaderboardPeriod) =>
    api.get<ApiCompanyRank>(`/leaderboard/companies/${companyId}?period=${period}`),
};

export const notificationsApi = {
  list: (unreadOnly = false, limit = 30) =>
    api.get<ApiNotificationPage>(`/notifications?unread_only=${unreadOnly}&limit=${limit}`),
  unreadCount: () => api.get<{ unread_count: number }>('/notifications/unread-count'),
  markRead: (notificationId: string) => api.post<ApiNotification>(`/notifications/${notificationId}/read`),
  markAllRead: () => api.post<{ unread_count: number }>('/notifications/read-all'),
};
