import en from './messages/en.json';
import uk from './messages/uk.json';
import { type DeepPartial, getMessages, type Messages, messageKeys, resolveMessages } from './messages';

const base = {
  common: { appName: 'Archipelago', appDescription: 'Describe' },
  home: { tagline: 'Tagline', workspaceSetup: 'Workspace setup' },
};

function resolve(override: object) {
  return resolveMessages(base as unknown as Messages, override as DeepPartial<Messages>) as unknown;
}

function onlyIn(left: object, right: object): string[] {
  const rightKeys = new Set(messageKeys(right));
  return messageKeys(left).filter((key) => !rightKeys.has(key));
}

describe('resolveMessages', () => {
  it('uses the en text for a key missing in the override (AC-4)', () => {
    expect(resolve({ home: { tagline: 'Слоган' } })).toEqual({
      common: base.common,
      home: { tagline: 'Слоган', workspaceSetup: 'Workspace setup' },
    });
  });

  it('uses the en namespace when the override lacks it (AC-4)', () => {
    expect(resolve({ home: { tagline: 'Слоган', workspaceSetup: 'Простір' } })).toMatchObject({
      common: base.common,
    });
  });

  it('uses the en text for an empty-string override value (AC-4)', () => {
    expect(resolve({ common: { appName: '', appDescription: 'Опис' } })).toMatchObject({
      common: { appName: 'Archipelago', appDescription: 'Опис' },
    });
  });

  it('keeps every base key when the override is empty (AC-4)', () => {
    expect(messageKeys(resolve({}) as object)).toEqual(messageKeys(base));
  });
});

describe('getMessages', () => {
  it('returns uk text where present (AC-4)', () => {
    expect(getMessages('uk')).toMatchObject({
      home: { workspaceSetup: 'Налаштування робочого простору' },
    });
  });

  it('returns every en key for uk (AC-4)', () => {
    expect(messageKeys(getMessages('uk'))).toEqual(messageKeys(en));
  });
});

describe('message files', () => {
  it('flattens nested keys to dotted paths (AC-5)', () => {
    expect(messageKeys({ a: { b: 'x', c: { d: 'y' } }, e: 'z' }).sort()).toEqual(['a.b', 'a.c.d', 'e']);
  });

  it('detects a key present in only one object, in both directions (AC-5)', () => {
    const left = { a: { b: 'x', onlyLeft: 'y' } };
    const right = { a: { b: 'x' }, onlyRight: 'z' };
    expect(onlyIn(left, right)).toEqual(['a.onlyLeft']);
    expect(onlyIn(right, left)).toEqual(['onlyRight']);
  });

  it('en and uk have the same keys (AC-5)', () => {
    expect(messageKeys(en)).not.toHaveLength(0);
    expect({ onlyInEn: onlyIn(en, uk), onlyInUk: onlyIn(uk, en) }).toEqual({ onlyInEn: [], onlyInUk: [] });
  });
});
