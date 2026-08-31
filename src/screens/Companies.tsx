import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BottomSheet from '../components/BottomSheet';
import CompanyDetail from '../components/CompanyDetail';
import { companiesApi, leaderboardApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { ApiCompany, ApiLeaderboardEntry, LeaderboardPeriod } from '../api/types';
import './Companies.css';

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

const ROLE_LABEL: Record<string, string> = { owner: 'Владелец', admin: 'Админ', member: 'Участник' };

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'all_time', label: 'Всё время' },
  { id: 'weekly', label: 'Неделя' },
  { id: 'monthly', label: 'Месяц' },
];

export default function Companies() {
  const [segment, setSegment] = useState<'mine' | 'top'>('mine');
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const [entries, setEntries] = useState<ApiLeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const [code, setCode] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  async function refreshMine() {
    setCompanies(await companiesApi.list(true));
  }

  useEffect(() => {
    refreshMine().catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить компании'));
  }, []);

  useEffect(() => {
    if (segment !== 'top') return;
    leaderboardApi
      .companies(period)
      .then((page) => setEntries(page.entries))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить топ'));
  }, [segment, period]);

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setError(null);
    try {
      const created = await companiesApi.create({ name, description: description || undefined, is_public: isPublic });
      setCreateOpen(false);
      setName('');
      setDescription('');
      setIsPublic(false);
      await refreshMine();
      setOpenId(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось создать компанию');
    } finally {
      setCreateBusy(false);
    }
  }

  async function joinByCode(e: React.FormEvent) {
    e.preventDefault();
    setJoinBusy(true);
    setJoinMessage(null);
    try {
      const joined = await companiesApi.join(code.trim());
      setJoinOpen(false);
      setCode('');
      await refreshMine();
      setOpenId(joined.id);
    } catch (err) {
      setJoinMessage(err instanceof ApiError ? err.message : 'Код не найден или устарел');
    } finally {
      setJoinBusy(false);
    }
  }

  const myCompanyIds = new Set(companies.map((c) => c.id));

  return (
    <div className="companies">
      <div className="companies-header">
        <h2>Компании</h2>
        <div className="companies-header-actions">
          <motion.button
            className="companies-icon-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => setJoinOpen(true)}
            aria-label="Вступить по коду"
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="5" width="15" height="10" rx="2.4" stroke="var(--ink)" strokeWidth="1.6" />
              <path d="M2.5 7.5 10 11.5 17.5 7.5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <motion.button
            className="companies-icon-btn"
            whileTap={{ scale: 0.9, rotate: 90 }}
            onClick={() => setCreateOpen(true)}
            aria-label="Создать компанию"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2V16M2 9H16" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="companies-segment">
        <button className={segment === 'mine' ? 'companies-segment-btn active' : 'companies-segment-btn'} onClick={() => setSegment('mine')}>
          Мои
        </button>
        <button className={segment === 'top' ? 'companies-segment-btn active' : 'companies-segment-btn'} onClick={() => setSegment('top')}>
          Мировой топ
        </button>
      </div>

      <div className="companies-scroll">
        {error && <p className="companies-error">{error}</p>}

        {segment === 'mine' && (
          <>
            {companies.length === 0 && !error && (
              <p className="companies-empty">Пока нет компаний — создай свою или вступи по коду</p>
            )}
            {companies.map((c, i) => (
              <motion.button
                key={c.id}
                className="company-card"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.06, duration: 0.4, type: 'spring', bounce: 0.32 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpenId(c.id)}
              >
                <div className="company-card-avatar" style={{ background: c.avatar_color }}>
                  {initialsOf(c.name)}
                </div>
                <div className="company-card-info">
                  <span className="company-card-name">{c.name}</span>
                  <span className="company-card-meta">
                    {c.members_count} участников · {c.my_role && ROLE_LABEL[c.my_role]}
                  </span>
                </div>
                {c.is_public && <span className="company-card-public">Публичная</span>}
              </motion.button>
            ))}
          </>
        )}

        {segment === 'top' && (
          <>
            <div className="companies-periods">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  className={period === p.id ? 'companies-period active' : 'companies-period'}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {entries.length === 0 && !error && <p className="companies-empty">Пока нет публичных компаний в топе</p>}
            {entries.map((e, i) => (
              <motion.button
                key={e.company_id}
                className="leaderboard-row"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenId(e.company_id)}
              >
                <span className="leaderboard-rank">#{e.rank}</span>
                <div className="company-card-avatar" style={{ background: e.avatar_color }}>
                  {initialsOf(e.name)}
                </div>
                <div className="company-card-info">
                  <span className="company-card-name">
                    {e.name} {myCompanyIds.has(e.company_id) && <span className="leaderboard-mine">твоя</span>}
                  </span>
                  <span className="company-card-meta">{e.members_count} участников</span>
                </div>
                <span className="leaderboard-score">{Math.round(e.score)}</span>
              </motion.button>
            ))}
          </>
        )}
        <div style={{ height: 24 }} />
      </div>

      <BottomSheet open={!!openId} onClose={() => setOpenId(null)}>
        {openId && <CompanyDetail companyId={openId} onClose={() => setOpenId(null)} onChanged={refreshMine} />}
      </BottomSheet>

      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="company-form" onSubmit={createCompany}>
          <h3>Новая компания</h3>
          <input
            className="company-form-input"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
          <textarea
            className="company-form-textarea"
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <div className="company-form-visibility">
            <button
              type="button"
              className={!isPublic ? 'company-form-vis-btn active' : 'company-form-vis-btn'}
              onClick={() => setIsPublic(false)}
            >
              Приватная
            </button>
            <button
              type="button"
              className={isPublic ? 'company-form-vis-btn active' : 'company-form-vis-btn'}
              onClick={() => setIsPublic(true)}
            >
              Публичная
            </button>
          </div>
          <p className="company-form-hint">
            {isPublic ? 'Видна всем в поиске и в мировом топе.' : 'Видна только тем, у кого есть инвайт-код.'}
          </p>
          <motion.button className="company-form-cta" type="submit" whileTap={{ scale: 0.96 }} disabled={createBusy}>
            {createBusy ? 'Создаю…' : 'Создать'}
          </motion.button>
        </form>
      </BottomSheet>

      <BottomSheet open={joinOpen} onClose={() => setJoinOpen(false)}>
        <form className="company-form" onSubmit={joinByCode}>
          <h3>Вступить по коду</h3>
          <input
            className="company-form-input"
            placeholder="Инвайт-код"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {joinMessage && <p className="company-form-message">{joinMessage}</p>}
          <motion.button className="company-form-cta" type="submit" whileTap={{ scale: 0.96 }} disabled={joinBusy}>
            {joinBusy ? 'Вступаю…' : 'Вступить'}
          </motion.button>
        </form>
      </BottomSheet>
    </div>
  );
}
