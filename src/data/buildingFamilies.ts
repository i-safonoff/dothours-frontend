import type { BuildingFamilyKey, ShapeKind } from '../api/types';

export interface BuildingFamilyMeta {
  key: BuildingFamilyKey;
  title: string;
  shape: ShapeKind;
  color: string;
  colorDeep: string;
  minutesPerDayDefault: number;
}

export const BUILDING_FAMILIES: BuildingFamilyMeta[] = [
  { key: 'study', title: 'Учёба', shape: 'square', color: '#2AA9E0', colorDeep: '#1885B5', minutesPerDayDefault: 90 },
  { key: 'sport', title: 'Спорт', shape: 'circle', color: '#FF5A45', colorDeep: '#E8461F', minutesPerDayDefault: 45 },
  { key: 'work', title: 'Работа', shape: 'hex', color: '#9B6BFF', colorDeep: '#7C4CE0', minutesPerDayDefault: 180 },
  { key: 'reading', title: 'Чтение', shape: 'triangle', color: '#FFB627', colorDeep: '#F09400', minutesPerDayDefault: 30 },
  { key: 'creativity', title: 'Творчество', shape: 'blob', color: '#FF6FA5', colorDeep: '#E24F87', minutesPerDayDefault: 40 },
  { key: 'meditation', title: 'Медитация', shape: 'diamond', color: '#4CB944', colorDeep: '#349A34', minutesPerDayDefault: 15 },
];

export const BUILDING_FAMILY_BY_KEY: Record<string, BuildingFamilyMeta> = Object.fromEntries(
  BUILDING_FAMILIES.map((f) => [f.key, f])
);

export function familyMeta(key: BuildingFamilyKey): BuildingFamilyMeta {
  return (
    BUILDING_FAMILY_BY_KEY[key] ?? {
      key,
      title: key,
      shape: 'circle',
      color: '#8C7C68',
      colorDeep: '#6b5e4d',
      minutesPerDayDefault: 30,
    }
  );
}
