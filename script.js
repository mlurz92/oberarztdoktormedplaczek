const state = {
  songs: [],
  filters: new Set(),
  sectionsCount: 0,
  styles: new Set()
};

const elements = {
  songList: document.getElementById('songList'),
  songTemplate: document.getElementById('songTemplate'),
  sectionTemplate: document.getElementById('sectionTemplate'),
  songCount: document.getElementById('songCount'),
  sectionCount: document.getElementById('sectionCount'),
  styleCount: document.getElementById('styleCount'),
  tagContainer: document.getElementById('tagContainer'),
  searchInput: document.getElementById('searchInput'),
  clearFilters: document.getElementById('clearFilters'),
  emptyState: document.getElementById('emptyState'),
  toastContainer: document.querySelector('.toast-container'),
  modeToggle: document.getElementById('modeToggle'),
  progressBar: document.querySelector('.progress-bar'),
  copyWorkflow: document.getElementById('copyWorkflow')
};

async function init() {
  try {
    const response = await fetch('Songs.md');
    const text = await response.text();
    state.songs = parseSongs(text);
    buildTagList();
    renderSongs(state.songs);
    updateStats();
    setupEvents();
    initAnimations();
    initSmoothScroll();
    document.getElementById('year').textContent = new Date().getFullYear();
  } catch (error) {
    console.error('Fehler beim Laden der Markdown-Datei', error);
    showToast('Markdown-Datei konnte nicht geladen werden.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);

function parseSongs(markdown) {
  const regex = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s+|$)/g;
  const songs = [];
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const block = match[2];
    const stylesMatch = block.match(/```styles\s*\n([\s\S]*?)```/);
    const lyricsMatch = block.match(/```Lyrics\s*\n([\s\S]*?)```/i);
    const stylesText = stylesMatch ? stylesMatch[1].trim() : '';
    const lyricsText = lyricsMatch ? lyricsMatch[1].trim() : '';

    const sections = [];
    let currentSection = null;

    lyricsText.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) {
        if (currentSection) {
          currentSection.lines.push('');
        }
        return;
      }
      const sectionHeader = line.match(/^\[(.+?)\]/);
      if (sectionHeader) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: sectionHeader[1].trim(),
          lines: []
        };
        const remainder = line.replace(sectionHeader[0], '').trim();
        if (remainder) currentSection.lines.push(remainder);
      } else {
        if (!currentSection) {
          currentSection = { title: 'Allgemein', lines: [] };
        }
        currentSection.lines.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);

    const tags = new Set();
    stylesText.split(/[,\n]/).forEach((tag) => {
      const clean = tag.trim().toLowerCase();
      if (clean) {
        tags.add(clean);
        state.styles.add(clean);
      }
    });

    state.sectionsCount += sections.length;

    songs.push({
      title,
      stylesText,
      tags: Array.from(tags),
      sections,
      rawBlock: `${stylesText}\n\n${lyricsText}`.trim()
    });
  }

  return songs;
}

function renderSongs(songs) {
  elements.songList.innerHTML = '';
  if (!songs.length) {
    elements.emptyState.classList.remove('hidden');
    return;
  }
  elements.emptyState.classList.add('hidden');

  const fragment = document.createDocumentFragment();

  songs.forEach((song) => {
    const songNode = elements.songTemplate.content.cloneNode(true);
    const card = songNode.querySelector('.song-card');
    card.dataset.tags = song.tags.join(',');
    card.dataset.title = song.title.toLowerCase();

    songNode.querySelector('.song-title').textContent = song.title;

    const meta = songNode.querySelector('.song-meta');
    meta.innerHTML = song.tags.slice(0, 6).map((tag) => `<span>${tag}</span>`).join('');

    const styleText = songNode.querySelector('.style-text');
    styleText.textContent = song.stylesText;

    const lyricsContainer = songNode.querySelector('.lyrics-container');
    lyricsContainer.innerHTML = '';

    song.sections.forEach((section) => {
      const sectionNode = elements.sectionTemplate.content.cloneNode(true);
      sectionNode.querySelector('.section-title').textContent = section.title;
      sectionNode.querySelector('.section-body').textContent = section.lines.join('\n');
      const sectionEl = sectionNode.querySelector('.lyric-section');
      sectionEl.dataset.text = section.lines.join('\n');
      lyricsContainer.appendChild(sectionNode);
    });

    const copyAllBtn = songNode.querySelector('.copy-all');
    copyAllBtn.addEventListener('click', () => copyToClipboard(song.rawBlock, 'Kompletter Song kopiert'));

    const copyStylesBtn = songNode.querySelector('.copy-styles');
    copyStylesBtn.addEventListener('click', () => copyToClipboard(song.stylesText, 'Style kopiert'));

    lyricsContainer.querySelectorAll('.lyric-section').forEach((sectionEl) => {
      const copySectionBtn = sectionEl.querySelector('.copy-section');
      copySectionBtn.addEventListener('click', () => copyToClipboard(sectionEl.dataset.text, `${sectionEl.querySelector('.section-title').textContent} kopiert`));

      const collapseBtn = sectionEl.querySelector('.collapse-section');
      collapseBtn.addEventListener('click', () => {
        sectionEl.classList.toggle('collapsed');
        collapseBtn.innerHTML = sectionEl.classList.contains('collapsed')
          ? '<i class="fa-solid fa-chevron-down"></i>'
          : '<i class="fa-solid fa-chevron-up"></i>';
      });
    });

    fragment.appendChild(songNode);
  });

  elements.songList.appendChild(fragment);
}

function buildTagList() {
  elements.tagContainer.innerHTML = '';
  const sorted = Array.from(state.styles).sort((a, b) => a.localeCompare(b));
  sorted.forEach((tag) => {
    const button = document.createElement('button');
    button.className = 'filter-tag';
    button.textContent = tag;
    button.dataset.tag = tag;
    button.addEventListener('click', () => toggleFilter(tag, button));
    elements.tagContainer.appendChild(button);
  });
}

function toggleFilter(tag, element) {
  if (state.filters.has(tag)) {
    state.filters.delete(tag);
    element.classList.remove('active');
  } else {
    state.filters.add(tag);
    element.classList.add('active');
  }
  applyFilters();
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = state.songs.filter((song) => {
    const matchesText = song.title.toLowerCase().includes(query)
      || song.rawBlock.toLowerCase().includes(query);
    if (!matchesText) return false;
    if (!state.filters.size) return true;
    return song.tags.some((tag) => state.filters.has(tag));
  });
  renderSongs(filtered);
  updateStats(filtered);
}

function updateStats(currentSongs = state.songs) {
  elements.songCount.textContent = currentSongs.length;
  const sections = currentSongs.reduce((sum, song) => sum + song.sections.length, 0);
  elements.sectionCount.textContent = sections;
  elements.styleCount.textContent = state.styles.size;
}

function setupEvents() {
  elements.searchInput.addEventListener('input', debounce(applyFilters, 200));
  elements.clearFilters.addEventListener('click', () => {
    state.filters.clear();
    elements.searchInput.value = '';
    document.querySelectorAll('.filter-tag').forEach((tag) => tag.classList.remove('active'));
    renderSongs(state.songs);
    updateStats();
  });

  if (elements.copyWorkflow) {
    elements.copyWorkflow.addEventListener('click', () => {
      const guide = document.querySelector(elements.copyWorkflow.dataset.copy);
      if (guide) {
        const text = Array.from(guide.querySelectorAll('.timeline-item h3, .timeline-item p, .timeline-item .tip'))
          .map((el) => el.textContent.trim()).join('\n');
        copyToClipboard(text, 'Workflow kopiert');
      }
    });
  }

  elements.modeToggle.addEventListener('click', toggleTheme);
  window.addEventListener('scroll', updateProgressBar);
}

function copyToClipboard(text, message) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(message);
  }).catch(() => {
    showToast('Kopieren nicht möglich', 'error');
  });
}

function showToast(message, variant = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('animate__animated', 'animate__fadeOutDown');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2200);
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(null, args), delay);
  };
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  elements.modeToggle.innerHTML = newTheme === 'light'
    ? '<i class="fa-solid fa-moon"></i>'
    : '<i class="fa-solid fa-sun"></i>';
}

function updateProgressBar() {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const progress = docHeight ? (scrollTop / docHeight) * 100 : 0;
  elements.progressBar.style.width = `${progress}%`;
}

function initAnimations() {
  gsap.from('.hero-text h2', { y: 40, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from('.hero-text p', { y: 30, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' });
  gsap.from('.hero-stats div', { y: 20, opacity: 0, duration: 0.8, delay: 0.4, stagger: 0.1 });

  gsap.utils.toArray('.section').forEach((section) => {
    gsap.from(section.querySelectorAll('.section-heading, .info-card, .song-card, .timeline-item, .tip-card'), {
      scrollTrigger: {
        trigger: section,
        start: 'top 80%'
      },
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power2.out'
    });
  });

  if (window.VanillaTilt) {
    VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
      max: 12,
      speed: 400,
      glare: true,
      'max-glare': 0.35
    });
  }
}

function initSmoothScroll() {
  if (!window.Lenis) return;
  const lenis = new Lenis({
    lerp: 0.1,
    smooth: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
