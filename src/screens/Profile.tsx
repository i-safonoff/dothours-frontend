import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import CommentsSheet from '../components/CommentsSheet';
import { friendsApi, postsApi, usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../api/AuthContext';
import type { ApiPost, ApiUserPublic } from '../api/types';
import './Profile.css';

const AVATAR_PALETTE = ['#FF6FA5', '#2AA9E0', '#9B6BFF', '#FFB627', '#4CB944', '#FF5A45'];

interface ProfileProps {
  userId: string | null;
  onBack: () => void;
  onLogout: () => void;
}

export default function Profile({ userId, onBack, onLogout }: ProfileProps) {
  const { user: me, updateUser } = useAuth();
  const isOwn = !userId || userId === me?.id;

  const [profile, setProfile] = useState<ApiUserPublic | null>(isOwn ? me : null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<ApiPost | null>(null);

  const [statusDraft, setStatusDraft] = useState(me?.status ?? '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (isOwn) {
      setProfile(me);
      setStatusDraft(me?.status ?? '');
    } else if (userId) {
      usersApi
        .get(userId)
        .then(setProfile)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить профиль'));
    }

    postsApi
      .feed(userId ?? me?.id)
      .then(setPosts)
      .catch(() => {});
  }, [userId, isOwn, me]);

  async function saveStatus() {
    setSavingStatus(true);
    try {
      const updated = await usersApi.updateMe({ status: statusDraft });
      updateUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось сохранить статус');
    } finally {
      setSavingStatus(false);
    }
  }

  async function pickColor(color: string) {
    try {
      const updated = await usersApi.updateMe({ avatar_color: color });
      updateUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось сохранить цвет');
    }
  }

  async function addFriend() {
    if (!userId) return;
    setFriendMessage(null);
    try {
      await friendsApi.sendRequest(userId);
      setFriendMessage('Заявка отправлена!');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFriendMessage('Уже в друзьях или заявка уже отправлена');
      } else {
        setFriendMessage('Не получилось отправить заявку');
      }
    }
  }

  async function toggleLike(post: ApiPost) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
          : p
      )
    );
    try {
      const updated = post.liked_by_me ? await postsApi.unlike(post.id) : await postsApi.like(post.id);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  }

  async function removePost(post: ApiPost) {
    try {
      await postsApi.remove(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить пост');
    }
  }

  if (!profile) {
    return (
      <div className="profile">
        <p className="profile-loading">{error ?? 'Загрузка…'}</p>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-scroll">
        {!isOwn && (
          <button className="profile-back" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 3.5L5.5 9L11 14.5" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад
          </button>
        )}

        <motion.div className="profile-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="profile-avatar" style={{ background: profile.avatar_color }}>
            {profile.initials}
          </div>
          <h2>{profile.name}</h2>

          {isOwn ? (
            <div className="profile-status-edit">
              <input
                className="profile-status-input"
                placeholder="Добавь статус…"
                value={statusDraft}
                maxLength={140}
                onChange={(e) => setStatusDraft(e.target.value)}
                onBlur={() => statusDraft !== me?.status && saveStatus()}
              />
              {savingStatus && <span className="profile-status-saving">сохраняю…</span>}
            </div>
          ) : (
            profile.status && <p className="profile-status">{profile.status}</p>
          )}

          {isOwn && (
            <div className="profile-palette">
              {AVATAR_PALETTE.map((c) => (
                <motion.button
                  key={c}
                  className="profile-swatch"
                  style={{ background: c, outline: c === profile.avatar_color ? '2.5px solid var(--ink)' : 'none' }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => pickColor(c)}
                  aria-label={`Выбрать цвет ${c}`}
                />
              ))}
            </div>
          )}

          {!isOwn && (
            <div className="profile-friend-block">
              <motion.button className="profile-friend-cta" whileTap={{ scale: 0.95 }} onClick={addFriend}>
                Добавить в друзья
              </motion.button>
              {friendMessage && <span className="profile-friend-message">{friendMessage}</span>}
            </div>
          )}
        </motion.div>

        <div className="profile-stats">
          <div>
            <span className="profile-stat-value">{posts.length}</span>
            <span className="profile-stat-label">постов</span>
          </div>
        </div>

        {error && <p className="profile-error">{error}</p>}

        <h3 className="profile-posts-title">Посты</h3>
        {posts.length === 0 && <p className="profile-empty">Пока нет постов</p>}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={toggleLike}
            onOpenComments={setActiveComments}
            onOpenAuthor={() => {}}
            onDelete={isOwn ? removePost : undefined}
            isMine={isOwn}
          />
        ))}

        {isOwn && (
          <button className="profile-logout" onClick={onLogout}>
            Выйти из аккаунта
          </button>
        )}
        <div style={{ height: 24 }} />
      </div>

      <CommentsSheet post={activeComments} onClose={() => setActiveComments(null)} />
    </div>
  );
}
