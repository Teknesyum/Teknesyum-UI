import type { ReactNode } from 'react';
import './titlebar.css';

export type TitleBarLinks = { sponsor?: string; brand: string };

export type TitleBarLabels = {
  sponsor: string;
  brand: string;
  minimize: string;
  maximize: string;
  close: string;
};

type Props = {
  first: string;
  second: string;
  logo?: string;
  links: TitleBarLinks;
  labels: TitleBarLabels;
  language?: ReactNode;
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

export function TitleBar({ first, second, logo, links, labels, language, onMinimize, onMaximize, onClose }: Props) {
  return (
    <header className="tk-titlebar" data-tauri-drag-region>
      <div className="tk-titlebar__brand" data-tauri-drag-region>
        {logo ? <img className="tk-titlebar__logo" src={logo} alt="" /> : null}
        <span className="tk-titlebar__name" data-tauri-drag-region>
          {first}
          <span className="tk-titlebar__accent">{second}</span>
        </span>
      </div>
      <div className="tk-titlebar__tools">
        {language ? <div className="tk-titlebar__language">{language}</div> : null}
        {links.sponsor ? (
          <a
            className="tk-titlebar__chip tk-titlebar__chip--support"
            href={links.sponsor}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CoffeeIcon />
            {labels.sponsor}
          </a>
        ) : null}
        <a className="tk-titlebar__chip" href={links.brand} target="_blank" rel="noopener noreferrer">
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
            aria-label={labels.maximize}
            title={labels.maximize}
            onClick={onMaximize}
          >
            <span className="tk-titlebar__maximize" aria-hidden="true" />
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
