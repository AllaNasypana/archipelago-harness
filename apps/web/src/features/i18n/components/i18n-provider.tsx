'use client';

import { createContext, type ReactNode } from 'react';
import type { I18nValue } from '../types';

export const I18nContext = createContext<I18nValue | null>(null);

type I18nProviderProps = I18nValue & { children: ReactNode };

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  return <I18nContext value={{ locale, messages }}>{children}</I18nContext>;
}
