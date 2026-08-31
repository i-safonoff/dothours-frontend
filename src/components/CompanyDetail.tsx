import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Building from './Building';
import { companiesApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { familyMeta } from '../data/buildingFamilies';
import { useRealtimeEvent } from '../api/RealtimeContext';
import type { ApiCityBuilding, ApiCompany, ApiCompanyInvite, ApiCompanyMember, CompanyRole } from '../api/types';
import './CompanyDetail.css';

const ROLE_LABEL: Record<CompanyRole, string> = { owner: 'Владелец', admin: 'Админ', member: 'Участник' };

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

interface CompanyDetailProps {
  companyId: string;
  onClose: () => void;
  /** The company list (or leaderboard) needs a re-fetch — membership, role, or existence changed. */
  onChanged: () => void;
}

export default function CompanyDetail({ companyId, onClose, onChanged }: CompanyDetailProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [members, setMembers] = useState<ApiCompanyMember[]>([]);
  const [buildings, setBuildings] = useState<ApiCityBuilding[]>([]);
  const [invites, setInvites] = useState<ApiCompanyInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const isMember = !!company?.my_role;
  const isAdmin = company?.my_role === 'admin' || company?.my_role === 'owner';
  const isOwner = company?.my_role === 'owner';

  async function refresh() {
    const [c, m, city] = await Promise.all([
      companiesApi.get(companyId),
      companiesApi.members(companyId),
      companiesApi.city(companyId),
    ]);
    setCompany(c);
    setMembers(m);
    setBuildings(city.buildings);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить компанию'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    if (!isAdmin) return;
    companiesApi
      .invites(companyId)
      .then(setInvites)
      .catch(() => {});
  }, [companyId, isAdmin]);

  // The company's city grows from every member's minutes — refresh it live, even for members who tracked nothing themselves.
  useRealtimeEvent('city.building_leveled_up', (data) => {
    if (data.owner_type !== 'company') return;
    companiesApi
      .city(companyId)
      .then((c) => setBuildings(c.buildings))
      .catch(() => {});
  });

  async function changeRole(userId: string, role: CompanyRole) {
    setBusy(true);
    setError(null);
    try {
      await companiesApi.updateMemberRole(companyId, userId, role);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось изменить роль');
    } finally {
      setBusy(false);
    }
  }

  async function kick(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await companiesApi.removeMember(companyId, userId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить участника');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await companiesApi.removeMember(companyId, user.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось выйти из компании');
      setBusy(false);
    }
  }

  async function removeCompany() {
    if (!window.confirm('Удалить компанию навсегда? Это действие необратимо.')) return;
    setBusy(true);
    setError(null);
    try {
      await companiesApi.remove(companyId);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить компанию');
      setBusy(false);
    }
  }

  async function makeInvite() {
    setBusy(true);
    setError(null);
    setNewCode(null);
    try {
      const invite = await companiesApi.createInvite(companyId);
      setNewCode(invite.code);
      setInvites((prev) => [invite, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось создать инвайт');
    } finally {
      setBusy(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {});
  }

  if (!company) {
    return <p className="company-detail-loading">{error ?? 'Загрузка…'}</p>;
  }

  return (
    <div className="company-detail">
      <div className="company-detail-hero">
        <div className="company-avatar" style={{ background: company.avatar_color }}>
          {initialsOf(company.name)}
        </div>
        <h3>{company.name}</h3>
        <span className="company-slug">@{company.slug}</span>
        <div className="company-badges">
          <span className="company-badge">{company.is_public ? 'Публичная' : 'Приватная'}</span>
          <span className="company-badge">{company.members_count} участников</span>
          {company.my_role && <span className="company-badge company-badge-role">{ROLE_LABEL[company.my_role]}</span>}
        </div>
        {company.description && <p className="company-description">{company.description}</p>}
        {!isMember && (
          <p className="company-join-hint">
            Чтобы вступить, попроси инвайт-код у участника — открытого вступления пока нет.
          </p>
        )}
      </div>

      {error && <p className="company-error">{error}</p>}

      {buildings.length > 0 && (
        <>
          <h4 className="company-section-title">Город компании</h4>
          <div className="company-city-grid">
            {buildings.map((b) => {
              const meta = familyMeta(b.building_family);
              return (
                <div key={b.id} className="company-building">
                  <Building level={b.level} color={meta.color} colorDeep={meta.colorDeep} width={52} animate={false} />
                  <span className="company-building-title">{meta.title}</span>
                  <span className="company-building-level">Ур. {b.level}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h4 className="company-section-title">Участники</h4>
      <div className="company-members">
        {members.map((m) => (
          <div key={m.user_id} className="company-member-row">
            <div className="company-member-avatar" style={{ background: m.avatar_color }}>
              {m.initials}
            </div>
            <div className="company-member-info">
              <span className="company-member-name">{m.name}</span>
              <span className="company-member-meta">
                {ROLE_LABEL[m.role]} · {m.contribution_minutes_total} мин
              </span>
            </div>
            {isOwner && m.role !== 'owner' && m.user_id !== user?.id && (
              <button
                className="company-member-action"
                disabled={busy}
                onClick={() => changeRole(m.user_id, m.role === 'admin' ? 'member' : 'admin')}
              >
                {m.role === 'admin' ? 'Снять админку' : 'В админы'}
              </button>
            )}
            {isAdmin && m.role !== 'owner' && m.user_id !== user?.id && (
              <button
                className="company-member-kick"
                disabled={busy}
                onClick={() => kick(m.user_id)}
                aria-label={`Удалить ${m.name} из компании`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <h4 className="company-section-title">Инвайты</h4>
          <motion.button className="company-invite-cta" whileTap={{ scale: 0.96 }} disabled={busy} onClick={makeInvite}>
            {busy ? 'Создаю…' : 'Создать инвайт-код'}
          </motion.button>
          {newCode && (
            <div className="company-invite-fresh">
              <code>{newCode}</code>
              <button type="button" onClick={() => copyCode(newCode)}>
                Скопировать
              </button>
            </div>
          )}
          {invites.length > 0 && (
            <div className="company-invite-list">
              {invites.map((i) => (
                <div key={i.id} className="company-invite-row">
                  <code>{i.code}</code>
                  <span>
                    {i.uses_count}/{i.max_uses} · до {new Date(i.expires_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {isMember && !isOwner && (
        <button className="company-leave" disabled={busy} onClick={leave}>
          Выйти из компании
        </button>
      )}
      {isOwner && (
        <button className="company-danger" disabled={busy} onClick={removeCompany}>
          Удалить компанию
        </button>
      )}
      <div style={{ height: 12 }} />
    </div>
  );
}
