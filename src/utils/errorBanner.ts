/**
 * On-screen error banner for mobile devices where browser devtools
 * are not easily accessible. Captures:
 *  - Global `window.error` events
 *  - Unhandled promise rejections
 *  - Manual reports via `reportError()`
 */

let bannerEl: HTMLDivElement | null = null;

export function initErrorBanner(): void {
  if (bannerEl) return;

  const banner = document.createElement('div');
  banner.id = 'err-banner';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    background: 'rgba(255,40,40,0.95)',
    color: '#ffffff',
    padding: '8px 12px',
    fontSize: '11px',
    lineHeight: '1.4',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    zIndex: '99999',
    display: 'none',
    maxHeight: '60vh',
    overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  } as Partial<CSSStyleDeclaration>);
  banner.addEventListener('click', () => {
    banner.style.display = 'none';
  });
  document.body.appendChild(banner);
  bannerEl = banner;

  window.addEventListener('error', (e) => {
    show(`[window.error]\n${e.message}\n${e.error?.stack ?? ''}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r: any = e.reason;
    show(`[unhandledrejection]\n${r?.message ?? r}\n${r?.stack ?? ''}`);
  });
}

export function reportError(where: string, err: unknown): void {
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  show(`[${where}]\n${msg}`);
}

function show(text: string): void {
  if (!bannerEl) return;
  bannerEl.textContent = text + '\n\n(tap to dismiss)';
  bannerEl.style.display = 'block';
  // Also log to console for desktop debugging
  // eslint-disable-next-line no-console
  console.error(text);
}
