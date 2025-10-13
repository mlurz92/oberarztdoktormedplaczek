const state = {
  songs: [],
  filtered: [],
  variant: 'placzek',
  searchTerm: '',
  openSongId: null,
};

const selectors = {
  grid: document.getElementById('songGrid'),
  songCount: document.getElementById('songCount'),
  emptyState: document.getElementById('emptyState'),
  songDialog: document.getElementById('songDialog'),
  dialogTitle: document.getElementById('dialogTitle'),
  dialogStyles: document.getElementById('dialogStyles'),
  dialogLyrics: document.getElementById('dialogLyrics'),
  toast: document.getElementById('toast'),
  searchInput: document.getElementById('searchInput'),
  clearSearch: document.getElementById('clearSearch'),
  variantSwitch: document.getElementById('variantSwitch'),
  themeToggle: document.getElementById('themeToggle'),
  themeLabel: document.getElementById('themeLabel'),
  collectionSection: document.querySelector('.song-collection'),
};

const defaultEmptyMessage = selectors.emptyState?.innerHTML ?? '';

const STORAGE_KEYS = {
  theme: 'placzek-theme-preference',
  variant: 'placzek-lyrics-variant',
};

let toastTimer;

function init() {
  bindEvents();
  initializeTheme();
  initializeVariant();
  loadSongs();
}

document.addEventListener('DOMContentLoaded', init);

function bindEvents() {
  selectors.searchInput.addEventListener('input', handleSearch);
  selectors.clearSearch.addEventListener('click', handleClearSearch);
  selectors.grid.addEventListener('click', handleGridClick);
  selectors.songDialog.addEventListener('click', handleDialogClick);
  selectors.variantSwitch.addEventListener('change', handleVariantToggle);
  selectors.themeToggle.addEventListener('click', handleThemeToggle);
  selectors.songDialog.addEventListener('close', () => {
    state.openSongId = null;
  });
}

async function loadSongs() {
  selectors.collectionSection?.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('Songs.md', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Songs.md konnte nicht geladen werden (Status ${response.status}).`);
    }
    const text = await response.text();
    const songs = parseSongs(text);
    state.songs = songs;
    selectors.songCount.textContent = songs.length;
    applyFilters();
    selectors.collectionSection?.setAttribute('aria-busy', 'false');
    runEntranceAnimation();
  } catch (error) {
    selectors.collectionSection?.setAttribute('aria-busy', 'false');
    renderLoadError(error);
    console.error(error);
  }
}

function parseSongs(markdown) {
  const cleanText = markdown.replace(/\uFEFF/g, '');
  const chunks = cleanText.split(/\n##\s+/g).slice(1);
  return chunks
    .map((chunk) => {
      const [titleLine, ...rest] = chunk.split('\n');
      const title = titleLine?.trim() ?? '';
      const remaining = rest.join('\n');

      const stylesMatch = remaining.match(/###\s*Styles:\s*```([\s\S]*?)```/);
      const lyricsMatch = remaining.match(/###\s*Lyrics:\s*```([\s\S]*?)```/);

      if (!title || !stylesMatch || !lyricsMatch) {
        return null;
      }

      const stylesText = stylesMatch[1].trim();
      const styles = stylesText
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      const lyrics = lyricsMatch[1].trim();
      const excerpt = createExcerpt(lyrics);

      return {
        id: slugify(title),
        title,
        styles,
        stylesText,
        lyrics,
        excerpt,
      };
    })
    .filter(Boolean);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function createExcerpt(lyrics) {
  const lines = lyrics.split('\n').filter((line) => line.trim().length > 0);
  const excerptLines = lines.slice(0, 4);
  let excerpt = excerptLines.join(' ');
  if (lines.length > excerptLines.length) {
    excerpt += ' …';
  }
  return excerpt;
}

function applyFilters() {
  const term = state.searchTerm.trim().toLowerCase();
  if (!term) {
    state.filtered = [...state.songs];
  } else {
    state.filtered = state.songs.filter((song) => {
      const haystack = [song.title, song.stylesText, song.lyrics, getActiveLyrics(song)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }
  renderSongs(state.filtered);
}

function renderSongs(list) {
  selectors.grid.innerHTML = '';

  if (!list.length) {
    selectors.emptyState.innerHTML = defaultEmptyMessage;
    selectors.emptyState.hidden = false;
    return;
  }

  selectors.emptyState.hidden = true;

  const fragment = document.createDocumentFragment();

  list.forEach((song) => {
    const card = buildSongCard(song);
    fragment.appendChild(card);
  });

  selectors.grid.appendChild(fragment);

  animateCardGrid();
}

function buildSongCard(song) {
  const card = document.createElement('article');
  card.className = 'song-card';
  card.dataset.songId = song.id;
  card.setAttribute('role', 'listitem');

  const header = document.createElement('div');
  header.className = 'song-card__header';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'song-card__eyebrow';
  eyebrow.textContent = 'Song';
  const title = document.createElement('h3');
  title.className = 'song-card__title';
  title.textContent = song.title;
  header.append(eyebrow, title);

  const styleContainer = document.createElement('div');
  styleContainer.className = 'song-card__styles';
  song.styles.slice(0, 8).forEach((style) => {
    const chip = document.createElement('span');
    chip.className = 'song-card__style';
    chip.textContent = style;
    styleContainer.appendChild(chip);
  });

  const preview = document.createElement('p');
  preview.className = 'song-card__preview';
  const previewText = createExcerpt(getActiveLyrics(song));
  preview.textContent = previewText || song.excerpt;

  const actionWrapper = document.createElement('div');
  actionWrapper.className = 'song-card__actions';
  actionWrapper.append(
    createActionButton(song.id, 'title', 'Titel', 'in die Zwischenablage'),
    createActionButton(song.id, 'styles', 'Styles', 'als Liste kopieren'),
    createActionButton(song.id, 'lyrics', 'Lyrics', 'komplett kopieren'),
    createActionButton(song.id, 'full', 'Song', 'vollständig kopieren'),
  );

  const detailsButton = document.createElement('button');
  detailsButton.className = 'song-card__details';
  detailsButton.type = 'button';
  detailsButton.dataset.action = 'details';
  detailsButton.dataset.songId = song.id;
  detailsButton.textContent = 'Details & Kopieroptionen';

  card.append(header, styleContainer, preview, actionWrapper, detailsButton);
  return card;
}

function createActionButton(songId, copyType, primary, secondary) {
  const button = document.createElement('button');
  button.className = 'song-card__button';
  button.type = 'button';
  button.dataset.copy = copyType;
  button.dataset.songId = songId;
  button.innerHTML = `<strong>${primary}</strong><span>${secondary}</span>`;
  button.setAttribute('aria-label', `${primary} ${secondary}`);
  return button;
}

function getActiveLyrics(song) {
  return state.variant === 'platzek' ? transformPlaczek(song.lyrics) : song.lyrics;
}

function transformPlaczek(text) {
  return text
    .replace(/Placzek/g, 'Platzek')
    .replace(/PLACZEK/g, 'PLATZEK')
    .replace(/placzek/g, 'platzek');
}

function handleGridClick(event) {
  const target = event.target.closest('button');
  if (!target) return;

  const { copy, action, songId } = target.dataset;
  if (!songId) return;

  if (copy) {
    handleCopy(songId, copy);
  } else if (action === 'details') {
    openDialog(songId);
  }
}

function handleDialogClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const { copy } = button.dataset;
  if (copy) {
    handleCopy(state.openSongId, copy);
  }
}

async function handleCopy(songId, copyType) {
  const song = state.songs.find((entry) => entry.id === songId);
  if (!song) return;

  let text = '';
  switch (copyType) {
    case 'title':
      text = song.title;
      break;
    case 'styles':
      text = song.styles.join(', ');
      break;
    case 'lyrics':
      text = getActiveLyrics(song);
      break;
    case 'full':
      text = `${song.title}\n\nStyles:\n${song.styles.join(', ')}\n\nLyrics:\n${getActiveLyrics(song)}`;
      break;
    default:
      return;
  }

  try {
    await copyToClipboard(text);
    showToast('Inhalt in die Zwischenablage kopiert.');
  } catch (error) {
    console.error('Kopieren fehlgeschlagen', error);
    showToast('Kopieren nicht möglich. Bitte manuell kopieren.');
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    const selection = document.getSelection();
    const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    textarea.select();
    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (originalRange) {
        selection.removeAllRanges();
        selection.addRange(originalRange);
      }
      if (success) {
        resolve();
      } else {
        reject(new Error('document.execCommand("copy") fehlgeschlagen'));
      }
    } catch (error) {
      document.body.removeChild(textarea);
      if (selection) {
        selection.removeAllRanges();
        if (originalRange) {
          selection.addRange(originalRange);
        }
      }
      reject(error);
    }
  });
}

function openDialog(songId) {
  const song = state.songs.find((entry) => entry.id === songId);
  if (!song) return;

  state.openSongId = songId;

  selectors.dialogTitle.textContent = song.title;
  selectors.dialogStyles.innerHTML = '';
  song.styles.forEach((style) => {
    const item = document.createElement('li');
    item.textContent = style;
    selectors.dialogStyles.appendChild(item);
  });
  selectors.dialogLyrics.textContent = getActiveLyrics(song);

  if (typeof selectors.songDialog.showModal === 'function') {
    selectors.songDialog.showModal();
  } else {
    selectors.songDialog.setAttribute('open', '');
  }
}

function handleSearch(event) {
  state.searchTerm = event.target.value;
  toggleClearSearch();
  applyFilters();
}

function handleClearSearch() {
  selectors.searchInput.value = '';
  state.searchTerm = '';
  toggleClearSearch();
  applyFilters();
  selectors.searchInput.focus();
}

function toggleClearSearch() {
  if (selectors.searchInput.value.trim().length > 0) {
    selectors.clearSearch.classList.add('is-visible');
  } else {
    selectors.clearSearch.classList.remove('is-visible');
  }
}

function showToast(message) {
  selectors.toast.textContent = message;
  selectors.toast.hidden = false;
  selectors.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    selectors.toast.classList.remove('is-visible');
    toastTimer = setTimeout(() => {
      selectors.toast.hidden = true;
    }, 400);
  }, 2200);
}

function renderLoadError(error) {
  selectors.grid.innerHTML = '';
  selectors.emptyState.hidden = false;
  selectors.emptyState.innerHTML = `<p>Fehler beim Laden der Songs: ${error.message}</p>`;
}

function handleVariantToggle(event) {
  state.variant = event.target.checked ? 'platzek' : 'placzek';
  localStorage.setItem(STORAGE_KEYS.variant, state.variant);
  applyFilters();
  if (state.openSongId) {
    const song = state.songs.find((entry) => entry.id === state.openSongId);
    if (song) {
      selectors.dialogLyrics.textContent = getActiveLyrics(song);
    }
  }
}

function initializeVariant() {
  const storedVariant = localStorage.getItem(STORAGE_KEYS.variant);
  if (storedVariant === 'platzek') {
    state.variant = 'platzek';
    selectors.variantSwitch.checked = true;
  }
}

function initializeTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function handleThemeToggle() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(STORAGE_KEYS.theme, mode);
  selectors.themeLabel.textContent = mode === 'dark' ? 'Dunkel' : 'Hell';
  selectors.themeToggle.setAttribute(
    'aria-label',
    mode === 'dark' ? 'Darstellung auf hell umschalten' : 'Darstellung auf dunkel umschalten',
  );
}

function runEntranceAnimation() {
  if (!window.gsap) return;
  window.gsap.from('.intro-panel', {
    opacity: 0,
    y: 20,
    duration: 0.9,
    ease: 'power3.out',
  });
}

function animateCardGrid() {
  if (!window.gsap) return;
  window.gsap.from('.song-card', {
    y: 18,
    opacity: 0,
    duration: 0.72,
    ease: 'power3.out',
    stagger: 0.06,
  });
}
