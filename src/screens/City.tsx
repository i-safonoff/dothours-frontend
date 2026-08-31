import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Building from '../components/Building';
import BottomSheet from '../components/BottomSheet';
import { useAuth } from '../api/AuthContext';
import { buildingFamiliesApi, cityApi, pairedTasksApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useRealtimeEvent } from '../api/RealtimeContext';
import { familyMeta } from '../data/buildingFamilies';
import type { ApiBuildingFamily, ApiCityBuilding, ApiPairedTask } from '../api/types';
import './City.css';

const AVATAR_PALETTE: [string, string][] = [
  ['#FF6FA5', '#E24F87'],
  ['#2AA9E0', '#1885B5'],
  ['#9B6BFF', '#7C4CE0'],
  ['#FFB627', '#F09400'],
  ['#4CB944', '#349A34'],
  ['#FF5A45', '#E8461F'],
];

function colorForId(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function levelProgress(families: ApiBuildingFamily[], key: string, totalMinutes: number) {
  const family = families.find((f) => f.key === key);
  const totalHours = totalMinutes / 60;
  if (!family) return { level: 1, pct: 0, remaining: 0, maxed: false };

  const levels = [...family.levels].sort((a, b) => a.level - b.level);
  let level = levels[0].level;
  for (const l of levels) if (totalHours >= l.hours_threshold) level = l.level;

  const current = levels.find((l) => l.level === level)!;
  const next = levels.find((l) => l.level === level + 1);
  if (!next) return { level, pct: 100, remaining: 0, maxed: true };

  const pct = Math.min(100, ((totalHours - current.hours_threshold) / (next.hours_threshold - current.hours_threshold)) * 100);
  return { level, pct, remaining: Math.max(0, next.hours_threshold - totalHours), maxed: false };
}

export default function City() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<ApiCityBuilding[]>([]);
  const [families, setFamilies] = useState<ApiBuildingFamily[]>([]);
  const [pairedTasks, setPairedTasks] = useState<ApiPairedTask[]>([]);
  const [openBuilding, setOpenBuilding] = useState<ApiCityBuilding | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([cityApi.mine(), buildingFamiliesApi.list(), pairedTasksApi.listMine()])
      .then(([city, fams, tasks]) => {
        setBuildings(city.buildings);
        setFamilies(fams);
        setPairedTasks(tasks);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить город'));
  }, []);

  useRealtimeEvent('city.building_leveled_up', (data) => {
    if (data.owner_type !== 'user') return;
    cityApi
      .mine()
      .then((city) => setBuildings(city.buildings))
      .catch(() => {});
  });

  const contributors = new Map<string, { name: string; minutes: number }>();
  let myMonumentMinutes = 0;
  for (const task of pairedTasks) {
    for (const p of task.participants) {
      if (p.user_id === user?.id) {
        myMonumentMinutes += p.minutes_logged;
      } else {
        const existing = contributors.get(p.user_id);
        contributors.set(p.user_id, { name: p.name, minutes: (existing?.minutes ?? 0) + p.minutes_logged });
      }
    }
  }
  const monumentMinutes = myMonumentMinutes + [...contributors.values()].reduce((s, c) => s + c.minutes, 0);
  const monumentHours = monumentMinutes / 60;
  const monumentThresholds = [0, 8, 16, 28, 45];
  let monumentLevel = 1;
  monumentThresholds.forEach((t, i) => {
    if (monumentHours >= t) monumentLevel = i + 1;
  });
  const monumentNext = monumentThresholds[monumentLevel];
  const monumentPct = monumentNext
    ? Math.min(100, ((monumentHours - monumentThresholds[monumentLevel - 1]) / (monumentNext - monumentThresholds[monumentLevel - 1])) * 100)
    : 100;

  return (
    <div className="city">
      <div className="city-header">
        <h2>Город</h2>
        <p>Каждый вложенный час строит район твоего города</p>
      </div>

      <div className="city-scroll">
        {error && <p className="city-error">{error}</p>}

        {contributors.size > 0 && (
          <motion.div
            className="monument-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
          >
            <div className="monument-top">
              <div>
                <span className="monument-eyebrow">Монумент дружбы</span>
                <span className="monument-level">Уровень {monumentLevel}</span>
              </div>
              <div className="monument-avatars">
                {[...contributors.entries()].slice(0, 4).map(([id, c]) => {
                  const [color, colorDeep] = colorForId(id);
                  return (
                    <div key={id} className="monument-avatar" style={{ background: `linear-gradient(155deg, ${color}, ${colorDeep})` }}>
                      {initialsOf(c.name)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="monument-building">
              <Building level={monumentLevel} color="#FFB627" colorDeep="#F09400" width={112} />
            </div>

            <p className="monument-caption">
              Вы вместе вложили <strong>{Math.floor(monumentHours)} ч {Math.round((monumentHours % 1) * 60)} м</strong>
            </p>

            <div className="monument-track">
              <motion.div
                className="monument-fill"
                initial={{ width: 0 }}
                animate={{ width: `${monumentPct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </div>
            {monumentNext && (
              <span className="monument-remaining">ещё {Math.max(0, Math.ceil(monumentNext - monumentHours))} ч до уровня {monumentLevel + 1}</span>
            )}
          </motion.div>
        )}

        <h3 className="city-districts-title">Районы</h3>
        {buildings.length === 0 && !error && <p className="city-empty">Начни трекать время — здесь появятся первые здания</p>}
        <div className="city-grid">
          {buildings.map((b, i) => {
            const meta = familyMeta(b.building_family);
            const { level, pct } = levelProgress(families, b.building_family, b.total_minutes);
            return (
              <motion.button
                key={b.id}
                className="district-card"
                initial={{ opacity: 0, y: 26, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.4, type: 'spring', bounce: 0.32 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpenBuilding(b)}
              >
                <span className="district-level" style={{ background: meta.color }}>
                  Ур. {level}
                </span>
                <Building level={level} color={meta.color} colorDeep={meta.colorDeep} width={72} animate={false} />
                <span className="district-title">{meta.title}</span>
                <span className="district-hours">{Math.round(b.total_minutes / 60)} ч всего</span>
                <div className="district-track">
                  <div className="district-fill" style={{ width: `${pct}%`, background: meta.color }} />
                </div>
              </motion.button>
            );
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>

      <BottomSheet open={!!openBuilding} onClose={() => setOpenBuilding(null)}>
        {openBuilding &&
          (() => {
            const meta = familyMeta(openBuilding.building_family);
            const { level, pct, remaining, maxed } = levelProgress(families, openBuilding.building_family, openBuilding.total_minutes);
            return (
              <div className="district-detail">
                <div className="district-detail-building">
                  <Building level={level} color={meta.color} colorDeep={meta.colorDeep} width={128} />
                </div>
                <h3>{meta.title}</h3>
                <p className="district-detail-sub">
                  Уровень {level} · {Math.round(openBuilding.total_minutes / 60)} ч вложено
                </p>
                <div className="district-detail-track">
                  <motion.div
                    className="district-detail-fill"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="district-detail-hint">
                  {maxed ? 'Максимальный уровень района достигнут' : `Ещё ${Math.ceil(remaining)} ч до уровня ${level + 1}`}
                </p>
              </div>
            );
          })()}
      </BottomSheet>
    </div>
  );
}
