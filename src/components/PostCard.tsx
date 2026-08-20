import { motion } from 'framer-motion';
import type { ApiPost } from '../api/types';
import './PostCard.css';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

interface PostCardProps {
  post: ApiPost;
  onToggleLike: (post: ApiPost) => void;
  onOpenComments: (post: ApiPost) => void;
  onOpenAuthor: (authorId: string) => void;
  onDelete?: (post: ApiPost) => void;
  isMine?: boolean;
}

export default function PostCard({ post, onToggleLike, onOpenComments, onOpenAuthor, onDelete, isMine }: PostCardProps) {
  return (
    <motion.div
      className="post-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <div className="post-card-top">
        <button className="post-card-author" onClick={() => onOpenAuthor(post.author.id)}>
          <div className="post-card-avatar" style={{ background: post.author.avatar_color }}>
            {post.author.initials}
          </div>
          <div className="post-card-author-text">
            <span className="post-card-name">{post.author.name}</span>
            <span className="post-card-time">{timeAgo(post.created_at)}</span>
          </div>
        </button>
        {isMine && onDelete && (
          <button className="post-card-delete" onClick={() => onDelete(post)} aria-label="Удалить пост">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M6.5 4V2.8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4M4.5 4v9a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4" stroke="var(--ink-faint)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <p className="post-card-text">{post.text}</p>

      <div className="post-card-actions">
        <motion.button
          className="post-card-action"
          whileTap={{ scale: 0.88 }}
          onClick={() => onToggleLike(post)}
        >
          <motion.span
            key={post.liked_by_me ? 'liked' : 'unliked'}
            initial={{ scale: post.liked_by_me ? 0.5 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.6, duration: 0.4 }}
            style={{ fontSize: 15 }}
          >
            {post.liked_by_me ? '❤️' : '🤍'}
          </motion.span>
          <span style={{ color: post.liked_by_me ? 'var(--coral)' : 'var(--ink-soft)' }}>{post.likes_count}</span>
        </motion.button>

        <button className="post-card-action" onClick={() => onOpenComments(post)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8a6 6 0 1 1 2.4 4.8L2 13.5l0.9-2.9A5.97 5.97 0 0 1 2 8Z"
              stroke="var(--ink-soft)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ color: 'var(--ink-soft)' }}>{post.comments_count}</span>
        </button>
      </div>
    </motion.div>
  );
}
