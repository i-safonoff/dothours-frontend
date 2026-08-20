import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../api/AuthContext';
import { ApiError } from '../api/client';
import './Auth.css';

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-content">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {mode === 'login' ? 'С возвращением' : 'Создать аккаунт'}
        </motion.h1>
        <motion.p
          className="auth-sub"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {mode === 'login' ? 'Войди, чтобы продолжить трекать время' : 'Пара полей — и можно строить город'}
        </motion.p>

        <motion.form
          className="auth-form"
          onSubmit={submit}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {mode === 'register' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <motion.button
            className="auth-cta"
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.96, y: 3 }}
          >
            {busy ? 'Секунду…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </motion.button>
        </motion.form>

        <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}
