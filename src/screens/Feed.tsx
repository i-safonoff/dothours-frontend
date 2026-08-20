import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import CommentsSheet from '../components/CommentsSheet';
import { postsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../api/AuthContext';
import type { ApiPost } from '../api/types';
import './Feed.css';

export default function Feed({ onOpenProfile }: { onOpenProfile: (userId: string) => void }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<ApiPost | null>(null);

  function refresh() {
    return postsApi
      .feed()
      .then(setPosts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить ленту'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const post = await postsApi.create(text.trim());
      setPosts((prev) => [post, ...prev]);
      setText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось опубликовать пост');
    } finally {
      setBusy(false);
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

  async function remove(post: ApiPost) {
    try {
      await postsApi.remove(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить пост');
    }
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h2>Лента</h2>
      </div>

      <div className="feed-scroll">
        <form className="feed-compose" onSubmit={submit}>
          <div className="feed-compose-avatar" style={{ background: user?.avatar_color }}>
            {user?.initials}
          </div>
          <div className="feed-compose-body">
            <textarea
              className="feed-compose-input"
              placeholder="Чем занимаешься?"
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              rows={2}
            />
            <motion.button
              className="feed-compose-cta"
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={busy || !text.trim()}
            >
              {busy ? 'Публикую…' : 'Опубликовать'}
            </motion.button>
          </div>
        </form>

        {error && <p className="feed-error">{error}</p>}
        {posts.length === 0 && !error && <p className="feed-empty">Пока тихо — стань первым</p>}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={toggleLike}
            onOpenComments={setActiveComments}
            onOpenAuthor={onOpenProfile}
            onDelete={remove}
            isMine={post.author.id === user?.id}
          />
        ))}
        <div style={{ height: 24 }} />
      </div>

      <CommentsSheet
        post={activeComments}
        onClose={() => {
          setActiveComments(null);
          refresh();
        }}
      />
    </div>
  );
}
