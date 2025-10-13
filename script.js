const state = {
  songs: [],
  filteredSongs: [],
  activeSongId: null,
  search: "",
  tags: new Set(),
  replacePlaczek: false,
  toastTimeout: null,
};

const elements = {
  songList: document.getElementById("songList"),
  songTemplate: document.getElementById("songCardTemplate"),
  spotlight: document.getElementById("spotlight"),
  spotlightTitle: document.getElementById("spotlightTitle"),
  spotlightStyles: document.getElementById("spotlightStyles"),
  spotlightTags: document.getElementById("spotlightTags"),
  spotlightLyrics: document.getElementById("spotlightLyrics"),
  search: document.getElementById("searchSongs"),
  clearSearch: document.getElementById("clearSearch"),
  chipRail: document.getElementById("chipRail"),
  statSongCount: document.getElementById("statSongCount"),
  statStyleCount: document.getElementById("statStyleCount"),
  statAvgLines: document.getElementById("statAvgLines"),
  nameToggle: document.getElementById("nameToggle"),
  themeToggle: document.getElementById("themeToggle"),
  toast: document.getElementById("toast"),
  year: document.getElementById("year"),
};

document.addEventListener("DOMContentLoaded", () => {
  elements.year.textContent = new Date().getFullYear().toString();
  initTheme();
  bindListeners();
  fetchSongs();
});

function bindListeners() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    applyFilters();
  });

  elements.clearSearch.addEventListener("click", () => {
    if (state.search.length === 0) return;
    state.search = "";
    elements.search.value = "";
    applyFilters();
  });

  elements.nameToggle.addEventListener("change", (event) => {
    state.replacePlaczek = event.target.checked;
    applyFilters();
    animateNameSwap();
  });

  document.querySelectorAll(".spotlight__button").forEach((button) => {
    button.addEventListener("click", () => {
      const song = getActiveSong();
      if (!song) return;
      handleCopy(song, button.dataset.copy);
    });
  });

  elements.themeToggle.addEventListener("click", toggleTheme);
}

async function fetchSongs() {
  try {
    const response = await fetch("Songs.md");
    if (!response.ok) throw new Error("Songs.md konnte nicht geladen werden");
    const markdown = await response.text();
    const songs = parseSongbook(markdown);
    if (!songs.length) throw new Error("Keine Songs gefunden");

    state.songs = songs.map((song, index) => ({ ...song, id: index }));
    state.filteredSongs = [...state.songs];
    state.activeSongId = state.songs[0].id;

    renderStats();
    renderChips();
    renderSpotlight();
    renderSongs();
    animateEntrance();
  } catch (error) {
    console.error(error);
    renderErrorState(error.message);
    showToast("Fehler beim Laden der Songs", true);
  }
}

function parseSongbook(markdown) {
  const regex = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s+|$)/g;
  const songs = [];

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const block = match[2];
    const stylesMatch = block.match(/###\s*Styles:[\s\S]*?```([\s\S]*?)```/i);
    const lyricsMatch = block.match(/###\s*Lyrics:[\s\S]*?```([\s\S]*?)```/i);

    if (!stylesMatch || !lyricsMatch) continue;

    const styles = stylesMatch[1].trim();
    const lyrics = lyricsMatch[1].trim();
    const tokens = styles
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    songs.push({
      title,
      styles,
      lyrics,
      tokens,
      lineCount: lyrics.split(/\r?\n/).filter((line) => line.trim().length > 0).length,
    });
  }

  return songs;
}

function applyFilters() {
  const activeSearch = state.search.trim().toLowerCase();
  const activeTags = Array.from(state.tags);

  state.filteredSongs = state.songs.filter((song) => {
    const lyrics = getProcessedLyrics(song).toLowerCase();
    const haystack = `${song.title} ${song.styles} ${lyrics}`.toLowerCase();
    const matchesSearch = activeSearch.length ? haystack.includes(activeSearch) : true;
    if (!matchesSearch) return false;
    if (!activeTags.length) return true;
    return activeTags.every((tag) => song.tokens.includes(tag));
  });

  if (state.filteredSongs.length) {
    const stillVisible = state.filteredSongs.some((song) => song.id === state.activeSongId);
    if (!stillVisible) {
      state.activeSongId = state.filteredSongs[0].id;
    }
    renderSpotlight();
  } else {
    renderEmptySpotlight();
  }

  renderSongs();
}

function renderSongs() {
  elements.songList.innerHTML = "";

  if (!state.filteredSongs.length) {
    elements.songList.innerHTML = `
      <div class="song-card song-card--empty" role="status">
        Keine Songs gefunden. Passe Suche oder Style-Filter an.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.filteredSongs.forEach((song) => {
    const card = elements.songTemplate.content.firstElementChild.cloneNode(true);
    const cardElement = card;
    cardElement.dataset.songId = String(song.id);
    if (song.id === state.activeSongId) {
      cardElement.classList.add("is-active");
    }

    const previewLyrics = buildPreview(getProcessedLyrics(song));
    cardElement.querySelector(".song-card__title").textContent = song.title;
    cardElement.querySelector(".song-card__styles").textContent = song.styles;
    cardElement.querySelector(".song-card__preview").textContent = previewLyrics;

    const tagContainer = cardElement.querySelector(".song-card__tags");
    song.tokens.forEach((token) => {
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = `tag${state.tags.has(token) ? " is-active" : ""}`;
      tag.textContent = token;
      tag.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleTag(token);
      });
      tagContainer.append(tag);
    });

    const quickCopy = cardElement.querySelector(".song-card__quick-copy");
    quickCopy.addEventListener("click", (event) => {
      event.stopPropagation();
      handleCopy(song, "all");
    });

    cardElement.querySelectorAll(".song-card__actions button").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        handleCopy(song, button.dataset.copy);
      });
    });

    cardElement.addEventListener("click", () => setActiveSong(song.id));
    cardElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveSong(song.id);
      }
    });
    cardElement.setAttribute("tabindex", "0");

    fragment.append(cardElement);
  });

  elements.songList.append(fragment);
}

function renderSpotlight() {
  const song = getActiveSong();
  if (!song) return;

  elements.spotlightTitle.textContent = song.title;
  elements.spotlightStyles.textContent = song.styles;
  elements.spotlight.dataset.songId = String(song.id);

  elements.spotlightTags.innerHTML = "";
  song.tokens.forEach((token) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = `tag${state.tags.has(token) ? " is-active" : ""}`;
    tag.textContent = token;
    tag.addEventListener("click", () => toggleTag(token));
    elements.spotlightTags.append(tag);
  });

  elements.spotlightLyrics.textContent = getProcessedLyrics(song);
}

function renderEmptySpotlight() {
  elements.spotlightTitle.textContent = "Keine Songs verfügbar";
  elements.spotlightStyles.textContent = "Bitte Filter oder Suche anpassen.";
  elements.spotlightTags.innerHTML = "";
  elements.spotlightLyrics.textContent = "";
}

function renderChips() {
  const allTags = new Set();
  state.songs.forEach((song) => song.tokens.forEach((token) => allTags.add(token)));

  const sortedTags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "de"));
  elements.chipRail.innerHTML = "";

  sortedTags.forEach((tagName) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = `tag${state.tags.has(tagName) ? " is-active" : ""}`;
    tag.textContent = tagName;
    tag.addEventListener("click", () => toggleTag(tagName));
    elements.chipRail.append(tag);
  });
}

function toggleTag(tag) {
  if (state.tags.has(tag)) {
    state.tags.delete(tag);
  } else {
    state.tags.add(tag);
  }
  renderChips();
  applyFilters();
}

function renderStats() {
  const songCount = state.songs.length;
  const styleSet = new Set();
  let totalLines = 0;

  state.songs.forEach((song) => {
    song.tokens.forEach((token) => styleSet.add(token));
    totalLines += song.lineCount;
  });

  const avgLines = songCount ? Math.round((totalLines / songCount) * 10) / 10 : 0;

  elements.statSongCount.textContent = songCount.toString();
  elements.statStyleCount.textContent = styleSet.size.toString();
  elements.statAvgLines.textContent = avgLines.toString().replace(".", ",");
}

function setActiveSong(songId) {
  if (state.activeSongId === songId) return;
  state.activeSongId = songId;
  renderSpotlight();
  renderSongs();
}

function getActiveSong() {
  return state.songs.find((song) => song.id === state.activeSongId) || null;
}

function getProcessedLyrics(song) {
  if (!state.replacePlaczek) return song.lyrics;
  return song.lyrics
    .replace(/PLACZEK/g, "PLATZEK")
    .replace(/Placzek/g, "Platzek")
    .replace(/placzek/g, "platzek");
}

function buildPreview(lyrics) {
  const lines = lyrics.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.slice(0, 6).join("\n");
}

function handleCopy(song, type) {
  const payload = buildCopyPayload(song, type);
  if (!payload) return;
  copyToClipboard(payload)
    .then(() => showToast(`"${song.title}" – ${labelForCopyType(type)} kopiert`))
    .catch(() => showToast("Kopieren nicht möglich", true));
}

function buildCopyPayload(song, type) {
  const lyrics = getProcessedLyrics(song);
  switch (type) {
    case "title":
      return song.title;
    case "styles":
      return song.styles;
    case "lyrics":
      return lyrics;
    case "all":
      return `${song.title}\n\nStyles:\n${song.styles}\n\nLyrics:\n${lyrics}`;
    default:
      return "";
  }
}

function labelForCopyType(type) {
  switch (type) {
    case "title":
      return "Titel";
    case "styles":
      return "Styles";
    case "lyrics":
      return "Lyrics";
    default:
      return "Songpaket";
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", Boolean(isError));
  elements.toast.classList.add("is-visible");

  clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2800);
}

function renderErrorState(message) {
  elements.songList.innerHTML = `<div class="song-card song-card--empty" role="alert">${message}</div>`;
  renderEmptySpotlight();
}

function initTheme() {
  const stored = localStorage.getItem("song-atlas-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.body.dataset.theme || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("song-atlas-theme", next);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const icon = theme === "dark" ? "ph ph-moon" : "ph ph-sun";
  elements.themeToggle.innerHTML = `<i class="${icon}"></i>`;
  elements.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Darstellung wechseln zu Hellmodus" : "Darstellung wechseln zu Dunkelmodus"
  );
  elements.themeToggle.setAttribute("title", elements.themeToggle.getAttribute("aria-label"));
  if (window.gsap) {
    gsap.to("body", { duration: 0.5, backgroundColor: getComputedStyle(document.body).getPropertyValue("background-color") });
  }
}

function animateEntrance() {
  if (!window.gsap) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  gsap.from([".hero__copy", ".spotlight"], {
    opacity: 0,
    y: 32,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.12,
  });

  gsap.from(".controls", {
    opacity: 0,
    y: 24,
    duration: 0.6,
    delay: 0.3,
  });
}

function animateNameSwap() {
  if (!window.gsap) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const currentBg = getComputedStyle(elements.spotlightLyrics).backgroundColor;
  gsap.fromTo(
    elements.spotlightLyrics,
    { backgroundColor: "rgba(124, 92, 255, 0.18)" },
    { backgroundColor: currentBg, duration: 0.6, ease: "power1.out" }
  );

  const cards = document.querySelectorAll(".song-card");
  gsap.fromTo(cards, { opacity: 0.6 }, { opacity: 1, duration: 0.4, stagger: 0.03 });
}
*** End Patch
