const state = {
  songs: [],
  filteredSongs: [],
  usePlatzek: false,
  searchTerm: "",
  activeSong: null,
};

const selectors = {
  songGrid: document.getElementById("songGrid"),
  songCount: document.getElementById("songCount"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  nameToggle: document.getElementById("nameToggle"),
  themeToggle: document.getElementById("themeToggle"),
  toast: document.getElementById("toast"),
  dialog: document.getElementById("songDialog"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogStyles: document.getElementById("dialogStyles"),
  dialogLyrics: document.getElementById("dialogLyrics"),
};

const COPY_LABELS = {
  title: "Songtitel",
  styles: "Styles",
  lyrics: "Lyrics",
  full: "Kompletter Song",
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindEvents();
  loadSongs();
});

function bindEvents() {
  selectors.searchInput.addEventListener("input", event => {
    state.searchTerm = event.target.value.trim();
    filterSongs();
  });

  selectors.nameToggle.addEventListener("change", event => {
    state.usePlatzek = event.target.checked;
    refreshView();
    showToast(event.target.checked ? "Lyrics zeigen jetzt Platzek." : "Lyrics zeigen wieder Placzek.");
  });

  selectors.themeToggle.addEventListener("click", toggleTheme);

  selectors.songGrid.addEventListener("click", handleGridClick);

  selectors.dialog.addEventListener("close", () => {
    state.activeSong = null;
  });

  selectors.dialog.addEventListener("click", event => {
    if (event.target === selectors.dialog) {
      selectors.dialog.close();
    }
  });

  selectors.dialog.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", () => {
      if (!state.activeSong) return;
      const text = getCopyPayload(button.dataset.copy, state.activeSong);
      copyToClipboard(text, COPY_LABELS[button.dataset.copy]);
    });
  });
}

async function loadSongs() {
  try {
    const response = await fetch("Songs.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Songs konnten nicht geladen werden (Status ${response.status}).`);
    }

    const markdown = await response.text();
    const songs = parseSongs(markdown);

    if (!songs.length) {
      throw new Error("Es wurden keine Songs in der Songs.md gefunden.");
    }

    state.songs = songs;
    state.filteredSongs = [...songs];
    refreshView(true);
  } catch (error) {
    selectors.songGrid.innerHTML = "";
    selectors.emptyState.hidden = false;
    selectors.emptyState.innerHTML = `<p class="error">${error.message}</p>`;
    console.error(error);
    showToast("Fehler beim Laden der Songs", true);
  }
}

function parseSongs(markdown) {
  const entries = [];
  const pattern = /##\s+(.*?)\r?\n+(?:###\s+Styles:\r?\n+```([\s\S]*?)```\r?\n+###\s+Lyrics:\r?\n+```([\s\S]*?)```)/g;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    const [_, title, rawStyles, rawLyrics] = match;
    const styles = rawStyles
      .split(/[,\r?\n]+/)
      .map(entry => entry.trim())
      .filter(Boolean);

    const lyrics = rawLyrics.replace(/\r/g, "").trim();

    entries.push({
      title: title.trim(),
      styles,
      lyrics,
    });
  }

  return entries;
}

function filterSongs() {
  const query = state.searchTerm.toLowerCase();

  if (!query) {
    state.filteredSongs = [...state.songs];
  } else {
    state.filteredSongs = state.songs.filter(song => {
      const titleMatch = song.title.toLowerCase().includes(query);
      const styleMatch = song.styles.some(style => style.toLowerCase().includes(query));
      const lyricsMatch = song.lyrics.toLowerCase().includes(query);
      return titleMatch || styleMatch || lyricsMatch;
    });
  }

  refreshView();
}

function refreshView(animate = false) {
  selectors.songGrid.innerHTML = "";

  if (!state.filteredSongs.length) {
    selectors.songCount.textContent = "0";
    selectors.emptyState.hidden = false;
    return;
  }

  selectors.emptyState.hidden = true;
  selectors.songCount.textContent = String(state.filteredSongs.length);

  const fragment = document.createDocumentFragment();

  state.filteredSongs.forEach((song, index) => {
    const card = buildSongCard(song, index);
    fragment.appendChild(card);
  });

  selectors.songGrid.appendChild(fragment);

  if (animate && window.gsap) {
    gsap.fromTo(
      ".song-card",
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
    );
  }
}

function buildSongCard(song, index) {
  const lyricsPreview = getLyricsVariant(song)
    .split("\n")
    .filter(Boolean)
    .slice(0, 4)
    .join("\n");

  const card = document.createElement("article");
  card.className = "song-card";
  card.setAttribute("role", "listitem");
  card.dataset.index = String(index);

  card.innerHTML = `
    <header class="card-header">
      <div>
        <p class="card-eyebrow">Song</p>
        <h3 class="card-title">${escapeHtml(song.title)}</h3>
      </div>
      <div class="card-actions">
        <button class="ui-button icon" data-copy="title" type="button" aria-label="Titel kopieren">
          <span aria-hidden="true">📋</span>
        </button>
        <button class="ui-button icon" data-copy="styles" type="button" aria-label="Styles kopieren">
          <span aria-hidden="true">🎧</span>
        </button>
        <button class="ui-button icon" data-copy="lyrics" type="button" aria-label="Lyrics kopieren">
          <span aria-hidden="true">📝</span>
        </button>
        <button class="ui-button icon" data-copy="full" type="button" aria-label="Alles kopieren">
          <span aria-hidden="true">📦</span>
        </button>
      </div>
    </header>
    <ul class="chip-list">
      ${song.styles.map(style => `<li class="chip">${escapeHtml(style)}</li>`).join("")}
    </ul>
    <pre class="card-preview">${escapeHtml(lyricsPreview)}</pre>
    <button class="ui-button secondary full-width" data-open="dialog" type="button">Details ansehen</button>
  `;

  return card;
}

function handleGridClick(event) {
  const target = event.target.closest("button");
  if (!target) return;

  const card = event.target.closest(".song-card");
  if (!card) return;

  const song = state.filteredSongs[Number(card.dataset.index)];
  if (!song) return;

  if (target.dataset.copy) {
    const payload = getCopyPayload(target.dataset.copy, song);
    copyToClipboard(payload, COPY_LABELS[target.dataset.copy]);
    return;
  }

  if (target.dataset.open === "dialog") {
    openDialog(song);
  }
}

function getCopyPayload(type, song) {
  switch (type) {
    case "title":
      return song.title;
    case "styles":
      return song.styles.join(", ");
    case "lyrics":
      return getLyricsVariant(song);
    case "full":
      return `${song.title}\n\nStyles: ${song.styles.join(", ")}\n\nLyrics:\n${getLyricsVariant(song)}`;
    default:
      return "";
  }
}

function getLyricsVariant(song) {
  if (!state.usePlatzek) {
    return song.lyrics;
  }

  return song.lyrics.replace(/Placzek/g, "Platzek");
}

function openDialog(song) {
  state.activeSong = song;
  selectors.dialogTitle.textContent = song.title;

  selectors.dialogStyles.innerHTML = song.styles
    .map(style => `<li class="chip">${escapeHtml(style)}</li>`)
    .join("");

  selectors.dialogLyrics.textContent = getLyricsVariant(song);

  if (typeof selectors.dialog.showModal === "function") {
    selectors.dialog.showModal();
  } else {
    selectors.dialog.setAttribute("open", "true");
  }
}

function copyToClipboard(text, label) {
  if (!text) {
    showToast("Kein Inhalt zum Kopieren", true);
    return;
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(`${label} kopiert.`);
      })
      .catch(() => {
        showToast("Kopieren nicht möglich", true);
      });
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  const selection = document.getSelection();
  const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  textarea.select();

  try {
    const successful = document.execCommand("copy");
    showToast(successful ? `${label} kopiert.` : "Kopieren nicht möglich", !successful);
  } catch (error) {
    showToast("Kopieren nicht möglich", true);
  }

  document.body.removeChild(textarea);
  if (originalRange && selection) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }
}

let toastTimeout;
function showToast(message, isError = false) {
  const toast = selectors.toast;
  toast.textContent = message;
  toast.dataset.state = isError ? "error" : "info";
  toast.hidden = false;
  toast.classList.add("is-visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 2500);
}

function escapeHtml(value) {
  return value.replace(/[&<>\"]/g, char => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function initTheme() {
  const stored = localStorage.getItem("odp-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = stored || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme, Boolean(stored));

  const mediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (mediaQuery) {
    const listener = event => {
      const storedTheme = localStorage.getItem("odp-theme");
      if (!storedTheme) {
        applyTheme(event.matches ? "dark" : "light", false);
      }
    };
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(listener);
    }
  }
}

function applyTheme(theme, persist = true) {
  document.body.dataset.theme = theme;
  if (persist) {
    localStorage.setItem("odp-theme", theme);
  }
  selectors.themeToggle.querySelector(".button-label").textContent = theme === "dark" ? "Dunkles Thema" : "Helles Thema";
  selectors.themeToggle.querySelector(".icon").textContent = theme === "dark" ? "🌙" : "🌞";
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme || "light";
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(nextTheme, true);
}
