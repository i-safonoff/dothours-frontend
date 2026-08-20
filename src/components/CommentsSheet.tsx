import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BottomSheet from './BottomSheet';
import { postsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../api/AuthContext';
import type { ApiComment, ApiPost } from '../api/types';
import './CommentsSheet.css';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч`;
  return `${Math.floor(hours / 24)} дн`;
}

export default function CommentsSheet({ post, onClose }: { post: ApiPost | null; onClose: () => void }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    setComments([]);
    postsApi
      .comments(post.id)
      .then(setComments)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить комментарии'));
  }, [post]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const comment = await postsApi.addComment(post.id, text.trim());
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось отправить комментарий');
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    try {
      await postsApi.removeComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить комментарий');
    }
  }

  return (
    <BottomSheet open={!!post} onClose={onClose}>
      <div className="comments-sheet">
        <h3>Комментарии</h3>
        {error && <p className="comments-error">{error}</p>}

        <div className="comments-list">
          {comments.length === 0 && <p className="comments-empty">Пока пусто — напиши первым</p>}
          {comments.map((c) => (
            <motion.div
              key={c.id}
              className="comment-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="comment-avatar" style={{ background: c.author.avatar_color }}>
                {c.author.initials}
              </div>
              <div className="comment-body">
                <div className="comment-head">
                  <span className="comment-name">{c.author.name}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
              {c.author.id === user?.id && (
                <button className="comment-delete" onClick={() => remove(c.id)} aria-label="Удалить комментарий">
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <form className="comment-form" onSubmit={submit}>
          <input
            className="comment-input"
            placeholder="Написать комментарий…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <motion.button className="comment-send" whileTap={{ scale: 0.9 }} type="submit" disabled={busy || !text.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 14L14 8L2 2L4.5 8L2 14Z" fill="#fff" />
            </svg>
          </motion.button>
        </form>
      </div>
    </BottomSheet>
  );
}
