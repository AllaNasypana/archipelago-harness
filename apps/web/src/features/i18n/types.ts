import type { locales } from './constants';
import type en from './messages/en.json';

export type Locale = (typeof locales)[number];

export type Messages = typeof en;

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export type I18nValue = { locale: Locale; messages: Messages };

export type LocaleOption = { locale: Locale; label: string; isActive: boolean };
