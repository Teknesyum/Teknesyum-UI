// teknesyum-ui template ustcubuk/react/TitleBar.tsx
import type { KeyboardEvent, ReactNode } from 'react';
import './titlebar.css';

export type TitleBarLinks = { sponsor?: string; brand: string };

export type TitleBarTab = { id: string; label: string; disabled?: boolean };

export type TitleBarSync = {
  state: 'syncing' | 'synced' | 'offline';
  text: string;
  title?: string;
  onClick?: () => void;
};

export type TitleBarLabels = {
  sponsor: string;
  sponsorTitle?: string;
  brand: string;
  brandTitle?: string;
  minimize: string;
  maximize: string;
  restore?: string;
  close: string;
  tabs?: string;
};

export type TitleBarLanguage = 'tr' | 'en';

type Props = {
  first: string;
  second: string;
  logo?: string;
  links: TitleBarLinks;
  labels: TitleBarLabels;
  language?: ReactNode;
  version?: ReactNode;
  update?: ReactNode;
  sync?: TitleBarSync;
  tabs?: TitleBarTab[];
  current?: string;
  maximized?: boolean;
  onTab?: (id: string) => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
};

function CoffeeIcon() {
  return (
    <svg
      className="tk-titlebar__icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6.5v8a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-8Z" />
      <path d="M16 8.5h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 .5v3M12 .5v3" />
    </svg>
  );
}

export function LangSwitch({ lang, label, onChange }: { lang: TitleBarLanguage; label: string; onChange: (lang: TitleBarLanguage) => void }) {
  const options: [TitleBarLanguage, string][] = [
    ['tr', 'TR'],
    ['en', 'EN'],
  ];
  return (
    <div
      className="tk-lang"
      data-lang={lang}
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        onChange(lang === 'tr' ? 'en' : 'tr');
      }}
    >
      {options.map(([o, text]) => (
        <button key={o} type="button" role="radio" aria-checked={lang === o} tabIndex={lang === o ? 0 : -1} className="tk-lang__opt" lang={o} onClick={() => onChange(o)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function TitleBar({ first, second, logo, links, labels, language, version, update, sync, tabs, current, maximized, onTab, onMinimize, onMaximize, onClose }: Props) {
  const toggle = maximized ? labels.restore ?? labels.maximize : labels.maximize;
  const open = (tabs ?? []).filter((t) => !t.disabled);
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    const i = open.findIndex((t) => t.id === current);
    const n = open.length;
    const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    const target = next < 0 ? undefined : open[next];
    if (!target) return;
    e.preventDefault();
    onTab?.(target.id);
    e.currentTarget.querySelector<HTMLElement>('[data-tab="' + target.id + '"]')?.focus();
  };
  return (
    <header className="tk-titlebar" data-window={maximized ? 'maximized' : 'normal'} data-tauri-drag-region>
      <div className="tk-titlebar__brand" data-tauri-drag-region>
        {logo ? <img className="tk-titlebar__logo" src={logo} alt="" /> : null}
        <span className="tk-titlebar__name" data-tauri-drag-region>
          {first}
          <span className="tk-titlebar__accent">{second}</span>
        </span>
        {version ? <div className="tk-titlebar__version">{version}</div> : null}
      </div>
      {tabs?.length ? (
        <nav className="tk-titlebar__tabs" aria-label={labels.tabs} onKeyDown={onKey}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tk-titlebar__tab"
              data-tab={t.id}
              aria-current={t.id === current ? 'page' : undefined}
              aria-disabled={t.disabled || undefined}
              tabIndex={t.id === current ? 0 : -1}
              onClick={() => !t.disabled && onTab?.(t.id)}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      ) : (
        <div className="tk-titlebar__tabs" data-tauri-drag-region />
      )}
      <div className="tk-titlebar__tools">
        {sync?.text ? (
          <button
            type="button"
            className={'tk-sync' + (sync.state === 'syncing' ? ' tk-sync-progress' : '')}
            data-state={sync.state}
            title={sync.title}
            onClick={sync.onClick}
          >
            {sync.text}
          </button>
        ) : null}
        {update ? <div className="tk-titlebar__update">{update}</div> : null}
        {language ? <div className="tk-titlebar__language">{language}</div> : null}
        {links.sponsor ? (
          <a
            className="tk-titlebar__chip tk-titlebar__chip--support"
            href={links.sponsor}
            title={labels.sponsorTitle}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CoffeeIcon />
            {labels.sponsor}
          </a>
        ) : null}
        <a
          className="tk-titlebar__chip tk-titlebar__chip--brand"
          href={links.brand}
          title={labels.brandTitle}
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels.brand}
        </a>
        <div className="tk-titlebar__window">
          <button
            type="button"
            className="tk-titlebar__control"
            aria-label={labels.minimize}
            title={labels.minimize}
            onClick={onMinimize}
          >
            <span className="tk-titlebar__minimize" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tk-titlebar__control"
            aria-label={toggle}
            title={toggle}
            onClick={onMaximize}
          >
            <span className={maximized ? 'tk-titlebar__restore' : 'tk-titlebar__maximize'} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tk-titlebar__control tk-titlebar__control--close"
            aria-label={labels.close}
            title={labels.close}
            onClick={onClose}
          >
            <span className="tk-titlebar__close" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
