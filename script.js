const ICON_PATHS = {
  theme: `
    <circle cx="12" cy="12" r="5.4"></circle>
    <path d="M17.6 7.4a6.3 6.3 0 0 1-5.1 9.7 6.3 6.3 0 0 1-4.6-2.2"></path>
    <line x1="12" y1="2.2" x2="12" y2="4.2"></line>
    <line x1="12" y1="19.8" x2="12" y2="21.8"></line>
    <line x1="4.2" y1="12" x2="6.2" y2="12"></line>
    <line x1="17.8" y1="12" x2="19.8" y2="12"></line>
    <line x1="6.1" y1="6.1" x2="7.6" y2="7.6"></line>
    <line x1="16.4" y1="16.4" x2="17.9" y2="17.9"></line>
  `,
  search: `
    <circle cx="10.8" cy="10.8" r="5.8"></circle>
    <line x1="15.6" y1="15.6" x2="21" y2="21"></line>
  `,
  clipboard: `
    <path d="M9.6 4.6h4.8"></path>
    <path d="M9.2 3h5.6a1.6 1.6 0 0 1 1.6 1.6V6.5H7.6V4.6A1.6 1.6 0 0 1 9.2 3Z"></path>
    <path d="M7 6.5h10a1.8 1.8 0 0 1 1.8 1.8v9.9a1.8 1.8 0 0 1-1.8 1.8H7a1.8 1.8 0 0 1-1.8-1.8V8.3A1.8 1.8 0 0 1 7 6.5Z"></path>
    <line x1="8.8" y1="11" x2="15.2" y2="11"></line>
    <line x1="8.8" y1="14.6" x2="13.4" y2="14.6"></line>
  `,
  open: `
    <polyline points="9 5 5 5 5 9"></polyline>
    <line x1="5" y1="5" x2="10.4" y2="10.4"></line>
    <polyline points="15 19 19 19 19 15"></polyline>
    <line x1="19" y1="19" x2="13.6" y2="13.6"></line>
  `,
  title: `
    <line x1="6" y1="7" x2="18" y2="7"></line>
    <line x1="9" y1="5" x2="15" y2="5"></line>
    <line x1="6" y1="12" x2="18" y2="12"></line>
    <line x1="6" y1="17" x2="13.5" y2="17"></line>
  `,
  palette: `
    <path d="M12 4a8 8 0 1 0 0 16h2.2a2.8 2.8 0 0 0 0-5.6H13"></path>
    <circle cx="8.6" cy="9.1" r="1"></circle>
    <circle cx="12.3" cy="7.2" r="1"></circle>
    <circle cx="9.2" cy="13.1" r="1"></circle>
    <circle cx="15.6" cy="10.8" r="1"></circle>
  `,
  lyrics: `
    <path d="M9 7.2v9a2.3 2.3 0 1 1-2.3-2.3"></path>
    <path d="M9 7.2 17 5.8v8.6a2.3 2.3 0 1 1-2.3-2.3"></path>
  `,
  full: `
    <path d="M6.5 6.5h11a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"></path>
    <line x1="8.4" y1="10" x2="15.6" y2="10"></line>
    <line x1="8.4" y1="13.2" x2="14.4" y2="13.2"></line>
    <line x1="8.4" y1="16.4" x2="12.6" y2="16.4"></line>
  `,
  close: `
    <line x1="7" y1="7" x2="17" y2="17"></line>
    <line x1="17" y1="7" x2="7" y2="17"></line>
  `,
  alert: `
    <path d="M3.6 19h16.8L12 5.4 3.6 19Z"></path>
    <line x1="12" y1="10.2" x2="12" y2="14.6"></line>
    <circle cx="12" cy="17.4" r="0.8"></circle>
  `,
  noresults: `
    <circle cx="10.5" cy="10.5" r="5.8"></circle>
    <line x1="15" y1="15" x2="20.2" y2="20.2"></line>
    <line x1="8" y1="8" x2="13" y2="13"></line>
  `,
};

const vivusInstances = new WeakMap();

const state = {
  songs: [],
  filtered: [],
  isPlatzek: false,
  theme: 'auto',
  markdown: '',
};

const dom = {
  grid: document.getElementById('songGrid'),
  search: document.getElementById('searchInput'),
  songCount: document.getElementById('songCount'),
  variantState: document.getElementById('variantState'),
  variantSwitch: document.getElementById('variantSwitch'),
  toast: document.getElementById('toast'),
  dialog: document.getElementById('songDialog'),
  dialogTitle: document.getElementById('dialogTitle'),
  dialogStyles: document.getElementById('dialogStyles'),
  dialogLyrics: document.getElementById('dialogLyrics'),
  themeToggle: document.querySelector('.theme-toggle'),
  copyAll: document.getElementById('copyAllSongs'),
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let initialLoadComplete = false;
let lastFetchTimestamp = 0;
let refreshTimeout;

init();

async function init() {
  hydrateIconSlots(document);
  hydrateTheme();
  hydrateVariant();
  bindEvents();
  await loadSongs();
}

function hydrateTheme() {
  const stored = localStorage.getItem('placzek-theme');
  const initial = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initial);
}

function hydrateVariant() {
  const stored = localStorage.getItem('placzek-variant');
  if (stored === 'platzek') {
    state.isPlatzek = true;
    dom.variantSwitch.checked = true;
  }
  updateVariantLabel();
}

function bindEvents() {
  dom.search.addEventListener('input', () => {
    render();
  });

  dom.variantSwitch.addEventListener('change', () => {
    state.isPlatzek = dom.variantSwitch.checked;
    localStorage.setItem('placzek-variant', state.isPlatzek ? 'platzek' : 'placzek');
    updateVariantLabel();
    render();
    refreshDialog();
  });

  dom.themeToggle.addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('placzek-theme', next);
  });

  if (dom.copyAll) {
    dom.copyAll.addEventListener('click', handleCopyAllSongs);
  }

  dom.dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
  });

  dom.dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });

  dom.dialog.addEventListener('click', (event) => {
    if (event.target === dom.dialog) {
      closeDialog();
    }
  });

  dom.dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);

  dom.dialog.addEventListener('click', (event) => {
    const target = event.target.closest('[data-copy]');
    if (!target) return;
    event.stopPropagation();
    handleCopyAction(target.dataset.copy, dom.dialog.dataset.index);
  });

  window.addEventListener('visibilitychange', handleVisibilityRefresh);
  window.addEventListener('focus', handleDeferredRefresh, true);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      handleDeferredRefresh();
    }
  });
}

async function loadSongs(options = {}) {
  const { silent = false } = options;
  if (!silent) {
    dom.grid.setAttribute('aria-busy', 'true');
  }
  try {
    const response = await fetch('Songs.md', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const markdown = await response.text();
    state.markdown = markdown;
    state.songs = parseSongs(markdown);
    state.filtered = [...state.songs];
    dom.songCount.textContent = formatSongCount(state.songs.length);
    initialLoadComplete = true;
    lastFetchTimestamp = Date.now();
    render();
    refreshDialog();
  } catch (error) {
    console.error('Songs konnten nicht geladen werden', error);
    state.songs = [];
    state.filtered = [];
    state.markdown = '';
    dom.grid.innerHTML = `
      <article class="empty">
        <div class="empty-surface">
          <span class="icon-slot" data-icon="alert" aria-hidden="true"></span>
          <p>Die Songs.md konnte nicht geladen werden.</p>
        </div>
      </article>`;
    hydrateIconSlots(dom.grid);
  }
  dom.grid.setAttribute('aria-busy', 'false');
  updateCopyAllState();
}

function parseSongs(markdown) {
  const pattern = /##\s+([^\n]+)\s+###\s+Styles:\s+```([\s\S]*?)```\s+###\s+Lyrics:\s+```([\s\S]*?)```/g;
  const songs = [];
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const [, title, stylesBlock, lyricsBlock] = match;
    const stylesRaw = stylesBlock.replace(/\r/g, '').trim();
    const styleList = stylesRaw
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const lyrics = lyricsBlock.trim();
    const id = songs.length;
    songs.push({
      title: title.trim(),
      stylesRaw,
      styleList,
      lyrics,
      id,
    });
  }
  return songs;
}

function render() {
  if (!state.songs.length) {
    dom.grid.innerHTML = '';
    return;
  }

  const query = dom.search.value.trim().toLowerCase();

  state.filtered = state.songs.filter((song) => {
    if (!query) return true;
    const searchSpace = [song.title, song.stylesRaw, song.lyrics].join('\n').toLowerCase();
    return searchSpace.includes(query);
  });

  const total = state.songs.length;
  const filtered = state.filtered.length;
  dom.songCount.textContent = query ? `${filtered}/${total} Songs` : formatSongCount(total);

  dom.grid.innerHTML = '';

  if (!state.filtered.length) {
    dom.grid.innerHTML = `
      <article class="empty">
        <div class="empty-surface">
          <span class="icon-slot" data-icon="noresults" aria-hidden="true"></span>
          <p>Keine Treffer. Passe deine Suche an.</p>
        </div>
      </article>`;
    hydrateIconSlots(dom.grid);
    return;
  }

  const fragment = document.createDocumentFragment();

  state.filtered.forEach((song) => {
    const card = buildSongCard(song);
    fragment.appendChild(card);
  });

  dom.grid.appendChild(fragment);
  hydrateIconSlots(dom.grid);

  if (!prefersReducedMotion && typeof window.gsap !== 'undefined') {
    window.gsap.from(dom.grid.children, {
      y: 26,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.05,
    });
  }
}

function buildSongCard(song) {
  const card = document.createElement('article');
  card.className = 'song-card';
  card.dataset.index = String(song.id);

  const lyrics = getLyricsForVariant(song);
  const preview = buildPreview(lyrics);

  card.innerHTML = `
    <div class="card-shell">
      <header class="card-header">
        <h2>${song.title}</h2>
        <button class="card-open" type="button" data-open aria-label="Songdetails anzeigen">
          <span class="icon-slot" data-icon="open" aria-hidden="true"></span>
        </button>
      </header>
      <div class="card-preview">
        <pre>${preview}</pre>
        <div class="preview-fade" aria-hidden="true"></div>
      </div>
      <footer class="card-footer">
        <div class="style-strip">
          ${renderStyleChips(song.styleList)}
        </div>
        <div class="copy-group">
          <button class="icon-btn" type="button" data-copy="title" aria-label="Titel kopieren">
            <span class="icon-slot" data-icon="title" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" type="button" data-copy="styles" aria-label="Styles kopieren">
            <span class="icon-slot" data-icon="palette" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" type="button" data-copy="lyrics" aria-label="Lyrics kopieren">
            <span class="icon-slot" data-icon="lyrics" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" type="button" data-copy="full" aria-label="Song komplett kopieren">
            <span class="icon-slot" data-icon="full" aria-hidden="true"></span>
          </button>
        </div>
      </footer>
    </div>`;

  const openButton = card.querySelector('[data-open]');
  openButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openDialog(song.id);
  });

  card.addEventListener('click', (event) => {
    if (event.target.closest('.copy-group')) return;
    openDialog(song.id);
  });

  card.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handleCopyAction(button.dataset.copy, song.id);
    });
  });

  return card;
}

function renderStyleChips(styles) {
  const visible = styles.slice(0, 3);
  const hiddenCount = styles.length - visible.length;
  const chips = visible.map((style) => `<span class="chip">${style}</span>`).join('');
  if (hiddenCount > 0) {
    return `${chips}<span class="chip muted">+${hiddenCount}</span>`;
  }
  return chips || '<span class="chip muted">Keine Styles</span>';
}

function buildPreview(lyrics) {
  const lines = lyrics.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.slice(0, 18).join('\n');
}

function getLyricsForVariant(song) {
  if (!state.isPlatzek) return song.lyrics;
  return song.lyrics
    .replace(/Placzek/g, 'Platzek')
    .replace(/PLACZEK/g, 'PLATZEK')
    .replace(/placzek/g, 'platzek');
}

function handleCopyAction(type, songIndex) {
  const song = state.songs[songIndex];
  if (!song) return;

  const lyrics = getLyricsForVariant(song);
  let payload = '';

  switch (type) {
    case 'title':
      payload = song.title;
      break;
    case 'styles':
      payload = song.stylesRaw;
      break;
    case 'lyrics':
      payload = lyrics;
      break;
    case 'full':
      payload = formatFullSong(song, lyrics);
      break;
    case 'dialog-title':
      payload = song.title;
      break;
    case 'dialog-styles':
      payload = song.stylesRaw;
      break;
    case 'dialog-lyrics':
      payload = lyrics;
      break;
    case 'dialog-full':
      payload = formatFullSong(song, lyrics);
      break;
    default:
      return;
  }

  copyToClipboard(payload)
    .then(() => showToast('In Zwischenablage'))
    .catch(() => showToast('Kopieren nicht möglich'));
}

function formatFullSong(song, lyrics) {
  return `## ${song.title}\n\n### Styles:\n\n${song.stylesRaw}\n\n### Lyrics:\n\n${lyrics}`;
}

function handleCopyAllSongs() {
  if (!state.markdown) {
    showToast('Keine Songs geladen');
    return;
  }
  copyToClipboard(state.markdown)
    .then(() => showToast('Songs.md kopiert'))
    .catch(() => showToast('Kopieren nicht möglich'));
}

async function copyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

let toastTimeout;
function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, 1600);
}

function updateVariantLabel() {
  dom.variantState.textContent = state.isPlatzek ? 'Platzek-Version' : 'Placzek-Version';
}

function openDialog(index) {
  const song = state.songs[index];
  if (!song) return;
  populateDialog(song, index);

  document.body.classList.add('dialog-open');
  if (typeof dom.dialog.showModal === 'function') {
    dom.dialog.showModal();
  } else {
    dom.dialog.setAttribute('open', 'true');
  }
}

function closeDialog() {
  if (typeof dom.dialog.close === 'function') {
    try {
      dom.dialog.close();
    } catch (error) {
      dom.dialog.removeAttribute('open');
    }
  } else {
    dom.dialog.removeAttribute('open');
  }
  document.body.classList.remove('dialog-open');
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  document.body.classList.toggle('theme-dark', theme === 'dark');
  dom.themeToggle.classList.toggle('is-dark', theme === 'dark');
  state.theme = theme;
  dom.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

function populateDialog(song, index) {
  const lyrics = getLyricsForVariant(song);
  dom.dialog.dataset.index = index;
  dom.dialogTitle.textContent = song.title;
  dom.dialogStyles.innerHTML = '';

  if (!song.styleList.length) {
    const chip = document.createElement('span');
    chip.className = 'chip muted';
    chip.textContent = 'Keine Styles';
    dom.dialogStyles.appendChild(chip);
  } else {
    song.styleList.forEach((style) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = style;
      dom.dialogStyles.appendChild(chip);
    });
  }

  dom.dialogLyrics.textContent = lyrics;
}

function refreshDialog() {
  const index = dom.dialog.dataset.index;
  if (typeof index === 'undefined') return;
  const isOpen = dom.dialog.open || dom.dialog.hasAttribute('open');
  if (!isOpen) return;
  const song = state.songs[index];
  if (!song) return;
  populateDialog(song, index);
}

function formatSongCount(length) {
  return `${length} ${length === 1 ? 'Song' : 'Songs'}`;
}

function hydrateIconSlots(root) {
  const slots = root.querySelectorAll('.icon-slot');
  slots.forEach((slot) => {
    if (slot.dataset.iconFilled === 'true') return;
    const name = slot.dataset.icon;
    const content = ICON_PATHS[name];
    if (!content) return;
    slot.innerHTML = `<svg class="icon icon--${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-icon-name="${name}">${content}</svg>`;
    slot.dataset.iconFilled = 'true';
    const svg = slot.querySelector('svg');
    if (svg) {
      const button = slot.closest('button');
      registerVivus(svg, button);
    }
  });
}

function registerVivus(svg, button) {
  if (vivusInstances.has(svg) || typeof window.Vivus === 'undefined') return;
  const instance = new window.Vivus(svg, {
    start: 'manual',
    type: 'delayed',
    duration: 80,
  });
  vivusInstances.set(svg, instance);

  const play = () => {
    instance.stop().reset().play(1);
  };

  if (button) {
    if (!button.dataset.vivusBound) {
      button.addEventListener('mouseenter', play);
      button.addEventListener('focus', play);
      button.dataset.vivusBound = 'true';
    }
  } else {
    if (!prefersReducedMotion) {
      play();
    }
  }
}

function updateCopyAllState() {
  if (!dom.copyAll) return;
  dom.copyAll.disabled = !state.markdown;
}

function handleVisibilityRefresh() {
  if (!initialLoadComplete) return;
  if (document.visibilityState === 'visible') {
    handleDeferredRefresh();
  }
}

function handleDeferredRefresh() {
  if (!initialLoadComplete) return;
  const now = Date.now();
  if (now - lastFetchTimestamp < 5000) return;
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    loadSongs({ silent: true });
  }, 160);
}
