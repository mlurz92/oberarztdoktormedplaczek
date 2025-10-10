const state = {
  songs: [],
  filteredSongs: [],
  filters: {
    search: "",
    tags: new Set(),
  },
  activeSongIndex: 0,
  toastTimeout: null,
  replacePlaczek: false,
};

const selectors = {
  songCollection: document.getElementById("songCollection"),
  styleChips: document.getElementById("styleChips"),
  search: document.getElementById("searchSongs"),
  clearFilters: document.getElementById("clearFilters"),
  statSongCount: document.getElementById("statSongCount"),
  statStyleCount: document.getElementById("statStyleCount"),
  statAvgLines: document.getElementById("statAvgLines"),
  heroTitle: document.getElementById("heroTitle"),
  heroStyles: document.getElementById("heroStyles"),
  heroHook: document.getElementById("heroHook"),
  heroHighlight: document.getElementById("heroHighlight"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("themeToggle"),
  randomSong: document.getElementById("randomSong"),
  year: document.getElementById("year"),
  nameToggle: document.getElementById("nameSwapToggle"),
};

document.addEventListener("DOMContentLoaded", () => {
  selectors.year.textContent = new Date().getFullYear().toString();
  initTheme();
  initNameToggle();
  bindUI();
  fetchSongs();
  initLenis();
});

function initLenis() {
  if (window.Lenis) {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

async function fetchSongs() {
  try {
    const response = await fetch("Songs.md");
    if (!response.ok) throw new Error("Markdown konnte nicht geladen werden");
    const text = await response.text();
    state.songs = parseSongbook(text);
    state.filteredSongs = [...state.songs];
    renderSongs();
    buildStyleFilters();
    updateStats();
    highlightSong(0);
    initAnimations();
  } catch (error) {
    console.error(error);
    showToast("Fehler beim Laden der Songs", true);
  }
}

function parseSongbook(markdown) {
  const sections = markdown.split(/\r?\n##\s*/).slice(1);
  return sections
    .map((section) => {
      const trimmed = section.trim();
      const [rawTitle, ...rest] = trimmed.split("\n");
      const body = rest.join("\n");
      const stylesMatch = body.match(/```styles\s*([\s\S]*?)```/i);
      const lyricsMatch = body.match(/```Lyrics\s*([\s\S]*?)```/i);

      if (!stylesMatch || !lyricsMatch) return null;

      const title = rawTitle.trim();
      const styles = stylesMatch[1].trim();
      const lyrics = lyricsMatch[1].trim();
      const firstHook = extractHook(lyrics);
      const tokens = styles
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

      return {
        title,
        styles,
        lyrics,
        tokens,
        hook: firstHook,
      };
    })
    .filter(Boolean);
}

function extractHook(lyrics) {
  const lines = lyrics.split("\n").map((line) => line.trim()).filter(Boolean);
  const chorusIndex = lines.findIndex((line) => /\[Chorus|Chor\]/i.test(line));
  if (chorusIndex !== -1 && lines[chorusIndex + 1]) {
    return lines[chorusIndex + 1];
  }
  return lines[0] || "";
}

function renderSongs() {
  selectors.songCollection.innerHTML = "";
  const template = document.getElementById("songCardTemplate");
  state.filteredSongs.forEach((song, index) => {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".song-card");
    article.dataset.index = index.toString();

    card.querySelector(".song-card__title").textContent = song.title;
    card.querySelector(".song-card__style-text").textContent = song.styles;
    const processedLyrics = getProcessedLyrics(song);
    card.querySelector(".song-card__lyrics-preview").textContent = processedLyrics;
    card.querySelector("details pre").textContent = processedLyrics;

    const tagContainer = card.querySelector(".song-card__style-tags");
    song.tokens.forEach((token) => {
      const span = document.createElement("span");
      span.textContent = token;
      tagContainer.append(span);
    });

    card.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", () => handleCopy(button.dataset.copy, song));
    });

    article.addEventListener("mouseenter", () => {
      highlightSong(index);
    });

    article.addEventListener("focusin", () => {
      highlightSong(index);
    });

    selectors.songCollection.append(card);
  });

  if (!state.filteredSongs.length) {
    selectors.songCollection.innerHTML = `<div class="empty-state">Keine Songs für die aktuelle Filterung gefunden.</div>`;
  }
}

function buildStyleFilters() {
  const allTokens = new Set();
  state.songs.forEach((song) => song.tokens.forEach((token) => allTokens.add(token)));

  selectors.styleChips.innerHTML = "";
  Array.from(allTokens)
    .sort((a, b) => a.localeCompare(b, "de"))
    .forEach((token) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = token;
      chip.addEventListener("click", () => toggleTag(token, chip));
      selectors.styleChips.append(chip);
    });
}

function toggleTag(tag, chip) {
  if (state.filters.tags.has(tag)) {
    state.filters.tags.delete(tag);
    chip.classList.remove("active");
  } else {
    state.filters.tags.add(tag);
    chip.classList.add("active");
  }
  filterSongs();
}

function filterSongs() {
  const { search, tags } = state.filters;
  state.filteredSongs = state.songs.filter((song) => {
    const searchContent = `${song.title} ${song.styles} ${state.replacePlaczek ? getProcessedLyrics(song) : song.lyrics}`.toLowerCase();
    const matchesSearch = searchContent.includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (!tags.size) return true;

    return Array.from(tags).every((tag) => song.tokens.includes(tag));
  });
  renderSongs();
  if (state.filteredSongs.length) {
    highlightSong(0);
  } else {
    selectors.heroTitle.textContent = "Keine Songs";
    selectors.heroStyles.textContent = "Bitte Filter anpassen.";
    selectors.heroHook.textContent = "";
  }
}

function handleCopy(type, song) {
  let text = "";
  let label = "";

  switch (type) {
    case "title":
      text = song.title;
      label = "Titel";
      break;
    case "styles":
      text = song.styles;
      label = "Styles";
      break;
    case "lyrics":
      text = getProcessedLyrics(song);
      label = "Lyrics";
      break;
    default:
      return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(`${label} kopiert`);
    })
    .catch(() => {
      fallbackCopy(text);
      showToast(`${label} kopiert`);
    });
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function highlightSong(index) {
  const song = state.filteredSongs[index];
  if (!song) return;
  state.activeSongIndex = index;
  selectors.heroTitle.textContent = song.title;
  selectors.heroStyles.textContent = song.styles;
  selectors.heroHook.textContent = getProcessedHook(song) || "";

  selectors.heroHighlight.querySelectorAll("[data-copy]").forEach((button) => {
    button.onclick = () => handleCopy(button.dataset.copy, song);
  });
}

function showToast(message, isError = false) {
  clearTimeout(state.toastTimeout);
  selectors.toast.textContent = message;
  selectors.toast.classList.toggle("error", isError);
  selectors.toast.classList.add("visible");
  state.toastTimeout = setTimeout(() => {
    selectors.toast.classList.remove("visible");
  }, 2200);
}

function updateStats() {
  selectors.statSongCount.textContent = state.songs.length.toString();

  const tokenSet = new Set();
  state.songs.forEach((song) => song.tokens.forEach((token) => tokenSet.add(token)));
  selectors.statStyleCount.textContent = tokenSet.size.toString();

  const average = Math.round(
    state.songs.reduce((acc, song) => acc + song.lyrics.split("\n").filter(Boolean).length, 0) /
      (state.songs.length || 1)
  );
  selectors.statAvgLines.textContent = `${average} Zeilen`;
}

function bindUI() {
  selectors.search.addEventListener("input", (event) => {
    state.filters.search = event.target.value.toLowerCase();
    filterSongs();
  });

  selectors.clearFilters.addEventListener("click", () => {
    state.filters.tags.clear();
    document.querySelectorAll(".chip.active").forEach((chip) => chip.classList.remove("active"));
    selectors.search.value = "";
    state.filters.search = "";
    filterSongs();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      selectors.songCollection.classList.toggle("list-view", button.dataset.view === "list");
    });
  });

  selectors.heroHighlight.addEventListener("mouseleave", () => {
    highlightSong(state.activeSongIndex);
  });

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  selectors.randomSong.addEventListener("click", () => {
    if (!state.filteredSongs.length) {
      showToast("Keine Songs verfügbar", true);
      return;
    }
    const index = Math.floor(Math.random() * state.filteredSongs.length);
    highlightSong(index);
    scrollToSection("#hero");
    showToast("Spotlight aktualisiert");
  });
}

function scrollToSection(selector) {
  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function initTheme() {
  const storedTheme = localStorage.getItem("placzek-theme");
  if (storedTheme === "light") {
    document.body.classList.add("light-theme");
    selectors.themeToggle.innerHTML = '<i class="ph ph-moon"></i>';
  }

  selectors.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("placzek-theme", isLight ? "light" : "dark");
    selectors.themeToggle.innerHTML = `<i class="ph ${isLight ? "ph-moon" : "ph-sun"}"></i>`;
  });
}

function initNameToggle() {
  if (!selectors.nameToggle) return;
  const storedPreference = localStorage.getItem("placzek-name-toggle");
  state.replacePlaczek = storedPreference === "true";
  selectors.nameToggle.checked = state.replacePlaczek;

  selectors.nameToggle.addEventListener("change", () => {
    state.replacePlaczek = selectors.nameToggle.checked;
    localStorage.setItem("placzek-name-toggle", state.replacePlaczek ? "true" : "false");
    refreshLyricsView();
    showToast(state.replacePlaczek ? "Namenswechsel aktiv" : "Originalnamen aktiv");
  });
}

function refreshLyricsView() {
  renderSongs();
  if (!state.filteredSongs.length) {
    selectors.heroTitle.textContent = "Keine Songs";
    selectors.heroStyles.textContent = "Bitte Filter anpassen.";
    selectors.heroHook.textContent = "";
    return;
  }
  const nextIndex = Math.min(state.activeSongIndex, state.filteredSongs.length - 1);
  highlightSong(nextIndex);
}

function getProcessedLyrics(song) {
  if (!state.replacePlaczek) return song.lyrics;
  return song.lyrics.replace(/Placzek/g, "Platzek");
}

function getProcessedHook(song) {
  if (!state.replacePlaczek) return song.hook;
  return song.hook.replace(/Placzek/g, "Platzek");
}

function initAnimations() {
  if (!window.gsap) return;
  gsap.from(".hero-grid > *", {
    opacity: 0,
    y: 40,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.18,
  });
  gsap.from(".song-card", {
    opacity: 0,
    y: 30,
    duration: 0.7,
    ease: "power3.out",
    stagger: 0.08,
    delay: 0.3,
  });
  gsap.from(".timeline article, .insight-grid article", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.5,
  });
}
