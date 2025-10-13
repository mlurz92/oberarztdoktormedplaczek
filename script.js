const state = {
  songs: [],
  filtered: [],
  isPlatzek: false,
  theme: "auto",
};

const dom = {
  grid: document.getElementById("songGrid"),
  search: document.getElementById("searchInput"),
  songCount: document.getElementById("songCount"),
  variantState: document.getElementById("variantState"),
  variantSwitch: document.getElementById("variantSwitch"),
  toast: document.getElementById("toast"),
  dialog: document.getElementById("songDialog"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogStyles: document.getElementById("dialogStyles"),
  dialogLyrics: document.getElementById("dialogLyrics"),
  themeToggle: document.querySelector(".theme-toggle"),
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

init();

async function init() {
  hydrateTheme();
  hydrateVariant();
  bindEvents();
  await loadSongs();
  render();
}

function hydrateTheme() {
  const stored = localStorage.getItem("placzek-theme");
  const initial = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);
}

function hydrateVariant() {
  const stored = localStorage.getItem("placzek-variant");
  if (stored === "platzek") {
    state.isPlatzek = true;
    dom.variantSwitch.checked = true;
  }
  updateVariantLabel();
}

function bindEvents() {
  dom.search.addEventListener("input", () => {
    render();
  });

  dom.variantSwitch.addEventListener("change", () => {
    state.isPlatzek = dom.variantSwitch.checked;
    localStorage.setItem("placzek-variant", state.isPlatzek ? "platzek" : "placzek");
    updateVariantLabel();
    render();
    refreshDialog();
  });

  dom.themeToggle.addEventListener("click", () => {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("placzek-theme", next);
  });

  dom.dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });

  dom.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  dom.dialog.addEventListener("click", (event) => {
    if (event.target === dom.dialog) {
      closeDialog();
    }
  });

  dom.dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);

  dom.dialog.addEventListener("click", (event) => {
    const target = event.target.closest("[data-copy]");
    if (!target) return;
    event.stopPropagation();
    handleCopyAction(target.dataset.copy, dom.dialog.dataset.index);
  });
}

async function loadSongs() {
  try {
    const response = await fetch("Songs.md", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const markdown = await response.text();
    state.songs = parseSongs(markdown);
    state.filtered = [...state.songs];
    dom.songCount.textContent = `${state.songs.length} ${state.songs.length === 1 ? "Song" : "Songs"}`;
    dom.grid.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Songs konnten nicht geladen werden", error);
    dom.grid.setAttribute("aria-busy", "false");
    dom.grid.innerHTML = `
      <article class="empty">
        <div class="empty-surface">
          <span class="material-symbols-rounded" aria-hidden="true">error</span>
          <p>Die Songs.md konnte nicht geladen werden.</p>
        </div>
      </article>`;
  }
}

function parseSongs(markdown) {
  const pattern = /##\s+([^\n]+)\s+###\s+Styles:\s+```([\s\S]*?)```\s+###\s+Lyrics:\s+```([\s\S]*?)```/g;
  const songs = [];
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const [, title, stylesBlock, lyricsBlock] = match;
    const stylesRaw = stylesBlock.replace(/\r/g, "").trim();
    const styleList = stylesRaw
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const lyrics = lyricsBlock.replace(/\s+$/g, "");
    songs.push({
      title: title.trim(),
      stylesRaw,
      styleList,
      lyrics,
      id: songs.length,
    });
  }
  return songs;
}

function render() {
  if (!state.songs.length) {
    dom.grid.innerHTML = "";
    return;
  }

  const query = dom.search.value.trim().toLowerCase();

  state.filtered = state.songs.filter((song) => {
    if (!query) return true;
    const searchSpace = [song.title, song.stylesRaw, song.lyrics].join("\n").toLowerCase();
    return searchSpace.includes(query);
  });

  const total = state.songs.length;
  const filtered = state.filtered.length;
  if (query) {
    dom.songCount.textContent = `${filtered}/${total} Songs`;
  } else {
    dom.songCount.textContent = `${total} ${total === 1 ? "Song" : "Songs"}`;
  }

  dom.grid.innerHTML = "";

  if (!state.filtered.length) {
    dom.grid.innerHTML = `
      <article class="empty">
        <div class="empty-surface">
          <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
          <p>Keine Treffer. Passe deine Suche an.</p>
        </div>
      </article>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.filtered.forEach((song) => {
    const card = buildSongCard(song);
    fragment.appendChild(card);
  });

  dom.grid.appendChild(fragment);

  if (!prefersReducedMotion && typeof window.gsap !== "undefined") {
    window.gsap.from(dom.grid.children, {
      y: 24,
      opacity: 0,
      duration: 0.65,
      ease: "power2.out",
      stagger: 0.05,
    });
  }
}

function buildSongCard(song) {
  const card = document.createElement("article");
  card.className = "song-card";
  card.dataset.index = String(song.id);

  const currentLyrics = getLyricsForVariant(song);
  const preview = buildPreview(currentLyrics);
  const stylesPreview = song.styleList;

  card.innerHTML = `
    <div class="card-surface">
      <header class="card-header">
        <h2>${song.title}</h2>
        <button class="icon-pill" type="button" data-open aria-label="Songdetails anzeigen">
          <span class="material-symbols-rounded" aria-hidden="true">open_in_full</span>
        </button>
      </header>
      <div class="card-preview">
        <pre>${preview}</pre>
        <div class="preview-fade" aria-hidden="true"></div>
      </div>
      <footer class="card-footer">
        <div class="style-strip">
          ${renderStyleChips(stylesPreview)}
        </div>
        <div class="copy-cluster">
          <button class="icon-btn" type="button" data-copy="title" aria-label="Titel kopieren">
            <span class="material-symbols-rounded" aria-hidden="true">text_fields</span>
          </button>
          <button class="icon-btn" type="button" data-copy="styles" aria-label="Styles kopieren">
            <span class="material-symbols-rounded" aria-hidden="true">palette</span>
          </button>
          <button class="icon-btn" type="button" data-copy="lyrics" aria-label="Lyrics kopieren">
            <span class="material-symbols-rounded" aria-hidden="true">queue_music</span>
          </button>
          <button class="icon-btn" type="button" data-copy="full" aria-label="Song komplett kopieren">
            <span class="material-symbols-rounded" aria-hidden="true">library_books</span>
          </button>
        </div>
      </footer>
    </div>`;

  card.querySelector("[data-open]").addEventListener("click", (event) => {
    event.stopPropagation();
    openDialog(song.id);
  });

  card.addEventListener("click", (event) => {
    if (event.target.closest(".copy-cluster")) return;
    openDialog(song.id);
  });

  card.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleCopyAction(button.dataset.copy, song.id);
    });
  });

  return card;
}

function renderStyleChips(styles) {
  const visible = styles.slice(0, 3);
  const hiddenCount = styles.length - visible.length;
  const chips = visible.map((style) => `<span class="chip">${style}</span>`).join("");
  if (hiddenCount > 0) {
    return `${chips}<span class="chip muted">+${hiddenCount}</span>`;
  }
  return chips;
}

function buildPreview(lyrics) {
  const lines = lyrics.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.slice(0, 14).join("\n");
}

function getLyricsForVariant(song) {
  if (!state.isPlatzek) return song.lyrics;
  return song.lyrics
    .replace(/Placzek/g, "Platzek")
    .replace(/PLACZEK/g, "PLATZEK")
    .replace(/placzek/g, "platzek");
}

function handleCopyAction(type, songIndex) {
  const song = state.songs[songIndex];
  if (!song) return;

  const lyrics = getLyricsForVariant(song);
  let payload = "";

  switch (type) {
    case "title":
      payload = song.title;
      break;
    case "styles":
      payload = song.stylesRaw;
      break;
    case "lyrics":
      payload = lyrics;
      break;
    case "full":
      payload = formatFullSong(song, lyrics);
      break;
    case "dialog-title":
      payload = song.title;
      break;
    case "dialog-styles":
      payload = song.stylesRaw;
      break;
    case "dialog-lyrics":
      payload = lyrics;
      break;
    case "dialog-full":
      payload = formatFullSong(song, lyrics);
      break;
    default:
      return;
  }

  copyToClipboard(payload)
    .then(() => showToast("In Zwischenablage"))
    .catch(() => showToast("Kopieren nicht möglich"));
}

function formatFullSong(song, lyrics) {
  return `## ${song.title}\n\n### Styles:\n\n${song.stylesRaw}\n\n### Lyrics:\n\n${lyrics}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

let toastTimeout;
function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 1600);
}

function updateVariantLabel() {
  dom.variantState.textContent = state.isPlatzek ? "Platzek-Version" : "Placzek-Version";
}

function openDialog(index) {
  const song = state.songs[index];
  if (!song) return;
  populateDialog(song, index);

  document.body.classList.add("dialog-open");
  if (typeof dom.dialog.showModal === "function") {
    dom.dialog.showModal();
  } else {
    dom.dialog.setAttribute("open", "true");
  }
}

function closeDialog() {
  if (typeof dom.dialog.close === "function") {
    try {
      dom.dialog.close();
    } catch (error) {
      dom.dialog.removeAttribute("open");
    }
  } else {
    dom.dialog.removeAttribute("open");
  }
  document.body.classList.remove("dialog-open");
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  dom.themeToggle.classList.toggle("is-dark", theme === "dark");
  state.theme = theme;
  dom.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}

function populateDialog(song, index) {
  const lyrics = getLyricsForVariant(song);
  dom.dialog.dataset.index = index;
  dom.dialogTitle.textContent = song.title;
  dom.dialogStyles.innerHTML = "";

  song.styleList.forEach((style) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = style;
    dom.dialogStyles.appendChild(chip);
  });

  dom.dialogLyrics.textContent = lyrics;
}

function refreshDialog() {
  const index = dom.dialog.dataset.index;
  if (!index) return;
  const isOpen = dom.dialog.open || dom.dialog.hasAttribute("open");
  if (!isOpen) return;
  const song = state.songs[index];
  if (!song) return;
  populateDialog(song, index);
}
