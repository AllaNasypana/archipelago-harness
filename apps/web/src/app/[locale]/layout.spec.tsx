import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from '@/features/i18n/i18n-provider';
import RootLayout from './layout';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'font-sans' }),
  Geist_Mono: () => ({ variable: 'font-mono' }),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

type Props = { children?: ReactNode; [key: string]: unknown };

function renderLayout(locale: string) {
  return RootLayout({ params: Promise.resolve({ locale }), children: <p>child</p> });
}

function findElement(node: ReactNode, type: unknown): ReactElement<Props> | undefined {
  if (!isValidElement<Props>(node)) return undefined;
  if (node.type === type) return node;
  const children = [node.props.children].flat();
  for (const child of children) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return undefined;
}

describe('[locale] RootLayout', () => {
  it.each([['en'], ['uk']])('renders <html lang="%s"> (AC-1, AC-2)', async (locale) => {
    const html = findElement(await renderLayout(locale), 'html');

    expect(html?.props.lang).toBe(locale);
  });

  it('gives the i18n Provider the uk locale and messages (AC-2)', async () => {
    const provider = findElement(await renderLayout('uk'), I18nProvider);

    expect(provider?.props.locale).toBe('uk');
    expect(provider?.props.messages).toMatchObject({
      home: { workspaceSetup: 'Налаштування робочого простору' },
    });
  });

  it.each([['fr'], ['EN'], ['favicon.ico']])('calls notFound() for locale %j (AC-7)', async (locale) => {
    await expect(renderLayout(locale)).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
