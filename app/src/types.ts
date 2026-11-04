export type ShapeKey =
  | 'circle'
  | 'pill'
  | 'squircle'
  | 'bean'
  | 'cloud'
  | 'flower'
  | 'hexagon'
  | 'egg'
  | 'star';

export interface Bot {
  id: string;
  name: string;
  role: string;
  team: string;
  description: string;
  tags: string[];
  color: string;
  shape: ShapeKey;
  grokUrl: string;
  avatar?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BotDraft = Omit<Bot, 'id' | 'favorite' | 'createdAt' | 'updatedAt'> & {
  favorite?: boolean;
};

/** Het bedrijf dat de app gebruikt: naam en logo rechtsboven, accentkleur. */
export interface Brand {
  name: string;
  logo?: string;
  accent: string;
}

export interface Settings {
  showGrid: boolean;
  eyeTracking: boolean;
  theme: 'dark' | 'light' | 'system';
  language: 'nl' | 'en';
}
