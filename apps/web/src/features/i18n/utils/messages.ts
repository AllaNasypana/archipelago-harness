import en from '../messages/en.json';
import uk from '../messages/uk.json';
import type { DeepPartial, Locale, Messages } from '../types';

type Tree = { [key: string]: unknown };

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null;
}

function merge(base: Tree, override: unknown): Tree {
  const overrides = isTree(override) ? override : {};
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => {
      const next = overrides[key];
      if (isTree(value)) return [key, merge(value, next)];
      return [key, typeof next === 'string' && next !== '' ? next : value];
    }),
  );
}

/** Returns `base` with every non-empty `override` text applied; a missing or empty text keeps `base`. */
export function resolveMessages(base: Messages, override: DeepPartial<Messages>): Messages {
  return merge(base, override) as Messages;
}

const ukMessages = resolveMessages(en, uk);

export function getMessages(locale: Locale): Messages {
  return locale === 'uk' ? ukMessages : en;
}

/** Flattens nested message keys to dotted paths, e.g. `home.tagline`. */
export function messageKeys(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = `${prefix}${key}`;
    return isTree(value) ? messageKeys(value, `${path}.`) : [path];
  });
}
