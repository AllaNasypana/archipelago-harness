import { render, screen } from '@testing-library/react';
import Home from './page';

async function renderHome(locale: string) {
  render(await Home({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }));
}

describe('[locale] home page', () => {
  it('renders English text under /en (AC-1)', async () => {
    await renderHome('en');

    expect(screen.getByRole('heading', { name: 'Workspace setup' })).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders Ukrainian text under /uk (AC-2)', async () => {
    await renderHome('uk');

    expect(screen.getByRole('heading', { name: 'Налаштування робочого простору' })).toBeInTheDocument();
    expect(screen.getByText('У процесі')).toBeInTheDocument();
  });
});
