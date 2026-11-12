import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from './i18n-provider';
import { LocaleToggle } from './locale-toggle';
import en from '../messages/en.json';
import { setLocaleCookie } from '../actions/set-locale-cookie';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/login',
  useRouter: () => ({ push }),
}));

vi.mock('../actions/set-locale-cookie', () => ({ setLocaleCookie: vi.fn() }));

const setCookie = vi.mocked(setLocaleCookie);

function renderToggle() {
  window.history.replaceState({}, '', '/en/login?returnTo=x');
  render(
    <I18nProvider locale="en" messages={en}>
      <LocaleToggle />
    </I18nProvider>,
  );
  return {
    user: userEvent.setup(),
    en: screen.getByRole('button', { name: 'EN' }),
    uk: screen.getByRole('button', { name: 'УКР' }),
  };
}

beforeEach(() => {
  push.mockReset();
  setCookie.mockReset().mockResolvedValue(undefined);
});

describe('LocaleToggle', () => {
  it('is a group labelled Language with EN and УКР buttons (AC-6)', () => {
    const { en: enButton, uk } = renderToggle();

    const group = screen.getByRole('group', { name: 'Language' });
    expect(group).toContainElement(enButton);
    expect(group).toContainElement(uk);
    expect(uk).toHaveAttribute('lang', 'uk');
  });

  it('marks the active locale with aria-pressed, bold and underline (AC-6)', () => {
    const { en: enButton, uk } = renderToggle();

    expect(enButton).toHaveAttribute('aria-pressed', 'true');
    expect(enButton).toHaveClass('font-semibold', 'underline');
    expect(uk).toHaveAttribute('aria-pressed', 'false');
    expect(uk).not.toHaveClass('font-semibold');
    expect(uk).not.toHaveClass('underline');
  });

  it('reaches EN then УКР with Tab (AC-6)', async () => {
    const { user, en: enButton, uk } = renderToggle();

    await user.tab();
    expect(enButton).toHaveFocus();
    await user.tab();
    expect(uk).toHaveFocus();
  });

  it.each([['{Enter}'], [' ']])('switches with the %j key on УКР (AC-6)', async (key) => {
    const { user, uk } = renderToggle();

    uk.focus();
    await user.keyboard(key);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/uk/login?returnTo=x'));
  });

  it('saves the cookie before navigating to the same path and query under /uk (AC-2)', async () => {
    const { user, uk } = renderToggle();

    await user.click(uk);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/uk/login?returnTo=x'));
    expect(setCookie).toHaveBeenCalledWith('uk');
    expect(setCookie.mock.invocationCallOrder[0]).toBeLessThan(push.mock.invocationCallOrder[0]);
  });

  it('still navigates when saving the cookie fails (AC-2)', async () => {
    setCookie.mockRejectedValue(new Error('network'));
    const { user, uk } = renderToggle();

    await user.click(uk);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/uk/login?returnTo=x'));
  });

  it('does nothing when the active locale is clicked (AC-2)', async () => {
    const { user, en: enButton } = renderToggle();

    await user.click(enButton);

    expect(setCookie).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
