// Simple dev-only logger with levels and user error dispatch
const levels = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

function getLevel() {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage : null;
    const fromLS = ls?.getItem('log:level');
    if (fromLS && levels[fromLS] !== undefined) return fromLS;
  } catch (_) {}
  const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
  return isProd ? 'error' : 'debug';
}

let currentLevel = getLevel();

function enabled(methodLevel) {
  return levels[methodLevel] <= levels[currentLevel];
}

export const logger = {
  setLevel(lvl) {
    if (levels[lvl] === undefined) return;
    currentLevel = lvl;
    try { window?.localStorage?.setItem('log:level', lvl); } catch (_) {}
  },
  getLevel() { return currentLevel; },
  trace(...args) { if (enabled('trace')) console.debug('[trace]', ...args); },
  debug(...args) { if (enabled('debug')) console.debug('[debug]', ...args); },
  info(...args) { if (enabled('info')) console.info('[info]', ...args); },
  warn(...args) { if (enabled('warn')) console.warn('[warn]', ...args); },
  error(...args) { if (enabled('error')) console.error('[error]', ...args); },
  userError(message, meta) {
    try {
      const detail = { message, meta };
      window.dispatchEvent(new CustomEvent('steg:error', { detail }));
    } catch (_) {}
    this.error(message, meta);
  },
};
