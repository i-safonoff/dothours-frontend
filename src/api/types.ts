import type { BuildingFamilyKey, ShapeKind } from '../types';

export type { BuildingFamilyKey, ShapeKind };

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatar_color: string;
  status: string;
  daily_goal_minutes: number;
}

export interface ApiUserPublic {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  status: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface ApiUserStats {
  today_minutes: number;
  streak: number;
  longest_streak: number;
}

export interface ApiCategory {
  id: string;
  title: string;
  color: string;
  shape: ShapeKind;
  building_family: BuildingFamilyKey;
  minutes_per_day_target: number;
  archived: boolean;
}

export interface ApiTimeEntry {
  id: string;
  category_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  source: 'timer' | 'manual';
  note: string | null;
  paired_task_id: string | null;
}

export interface ApiTimeEntrySummary {
  period: string;
  date: string;
  total_minutes: number;
  by_category: Record<string, number>;
}

export interface ApiCityBuilding {
  id: string;
  building_family: BuildingFamilyKey;
  level: number;
  total_minutes: number;
}

export interface ApiBuildingLevel {
  level: number;
  title: string;
  hours_threshold: number;
}

export interface ApiBuildingFamily {
  key: BuildingFamilyKey;
  title: string;
  levels: ApiBuildingLevel[];
}

export interface ApiFriend {
  id: string;
  name: string;
  initials: string;
  today_minutes: number;
  streak: number;
}

export interface ApiFriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
}

export interface ApiParticipant {
  user_id: string;
  name: string;
  minutes_logged: number;
}

export interface ApiPost {
  id: string;
  author: ApiUserPublic;
  text: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface ApiComment {
  id: string;
  post_id: string;
  author: ApiUserPublic;
  text: string;
  created_at: string;
}

export interface ApiPairedTask {
  id: string;
  title: string;
  description: string;
  building_family: BuildingFamilyKey;
  created_by: string;
  target_minutes: number;
  target_type: 'combined' | 'per_participant';
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  due_at: string;
  participants: ApiParticipant[];
}
