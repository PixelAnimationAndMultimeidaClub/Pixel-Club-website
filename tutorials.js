document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('projectSearch');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const cards = document.querySelectorAll('.project-card');
  const noResultsMessage = document.getElementById('noResultsMessage');
  const modal = document.getElementById('videoModal');
  const modalIframe = document.getElementById('modalIframe');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const closeModalBtn = document.querySelector('.modal-close');
  const backdrop = document.querySelector('.modal-backdrop');
  const scrubFill = document.getElementById('scrubFill');
  const filterStatus = document.getElementById('filterStatus');
  const activeFiltersContainer = document.getElementById('activeFiltersContainer');

  const toggleBtn = document.getElementById('filterDropdownToggle');
  const dropdownMenu = document.getElementById('filterDropdownMenu');
  const filterOptions = document.querySelectorAll('.filter-option');
  const subOptions = document.querySelectorAll('.dropdown-sub-option');

  let selectedSoftware = [];
  let selectedDifficulties = [];
  let lastFocusedElement = null;

  // 1. Dropdown Toggle Functionality
  if (toggleBtn && dropdownMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
    });

    dropdownMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 2. Software / Category Selection
  filterOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const software = option.dataset.software;
      if (!software) return;

      const index = selectedSoftware.indexOf(software);
      if (index > -1) {
        selectedSoftware.splice(index, 1);
        option.classList.remove('active');
      } else {
        selectedSoftware.push(software);
        option.classList.add('active');
      }

      renderActiveTags();
      applyFilters();


    });
  });

  // 3. Difficulty Level Submenu Selection
  subOptions.forEach(sub => {
    sub.addEventListener('click', (e) => {
      e.preventDefault();
      const level = sub.dataset.level;
      if (!level) return;

      const index = selectedDifficulties.indexOf(level);
      if (index > -1) {
        selectedDifficulties.splice(index, 1);
        sub.classList.remove('active');
      } else {
        selectedDifficulties.push(level);
        sub.classList.add('active');
      }

      renderActiveTags();
      applyFilters();

      if (dropdownMenu) {
        dropdownMenu.classList.remove('show');
      }
    });
  });

  // 4. Render Active Pills Bar
  function renderActiveTags() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    const softwareNames = {
      'premiere': 'Premiere Pro',
      'aftereffects': 'After Effects',
      'davinci': 'DaVinci Resolve',
      'favs': 'Favorites'
    };

    selectedSoftware.forEach(sw => {
      const pill = document.createElement('div');
      pill.className = 'active-filter-pill';
      pill.innerHTML = `${softwareNames[sw] || sw} <button type="button" class="remove-filter" aria-label="Remove filter">×</button>`;
      pill.querySelector('.remove-filter').addEventListener('click', () => {
        selectedSoftware = selectedSoftware.filter(s => s !== sw);
        filterOptions.forEach(opt => {
          if (opt.dataset.software === sw) opt.classList.remove('active');
        });
        renderActiveTags();
        applyFilters();
      });
      activeFiltersContainer.appendChild(pill);
    });

    selectedDifficulties.forEach(diff => {
      const pill = document.createElement('div');
      pill.className = 'active-filter-pill';
      pill.innerHTML = `${diff} <button type="button" class="remove-filter" aria-label="Remove filter">×</button>`;
      pill.querySelector('.remove-filter').addEventListener('click', () => {
        selectedDifficulties = selectedDifficulties.filter(d => d !== diff);
        subOptions.forEach(sub => {
          if (sub.dataset.level === diff) sub.classList.remove('active');
        });
        renderActiveTags();
        applyFilters();
      });
      activeFiltersContainer.appendChild(pill);
    });
  }

  // 5. Thumbnail Skeleton Loading
  cards.forEach(card => {
    const thumb = card.querySelector('.card-thumb');
    const img = card.querySelector('.card-img-static');

    if (thumb && img) {
      const handleImageLoaded = () => {
        thumb.classList.add('is-loaded');
        img.classList.add('is-loaded');
      };

      if (img.complete && img.naturalHeight !== 0) {
        handleImageLoaded();
      } else {
        img.addEventListener('load', handleImageLoaded, { once: true });
        img.addEventListener('error', handleImageLoaded, { once: true });
      }
    }
  });

  // 6. Scroll Progress Bar
  window.addEventListener('scroll', () => {
    if (!scrubFill) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrubFill.style.width = `${progress}%`;
  });

  // 7. Favorites Handling
  const FAVS_KEY = 'pixel_tutorial_favs';
  let favorites = JSON.parse(localStorage.getItem(FAVS_KEY)) || [];

  function updateFavoriteButtons() {
    cards.forEach(card => {
      const id = card.dataset.id;
      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) {
        const isFav = favorites.includes(id);
        favBtn.classList.toggle('active', isFav);
        favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
        favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Save to favorites');
      }
    });
  }

  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.project-card');
      if (!card) return;
      const id = card.dataset.id;

      if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
      } else {
        favorites.push(id);
      }

      localStorage.setItem(FAVS_KEY, JSON.stringify(favorites));
      updateFavoriteButtons();

      if (selectedSoftware.includes('favs')) {
        applyFilters();
      }
    });
  });

  // 8. Multi-Filter Logic
  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    cards.forEach(card => {
      const category = (card.dataset.category || '').toLowerCase();
      const difficulty = (card.dataset.difficulty || '').toLowerCase();
      const id = card.dataset.id;
      const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
      const desc = card.querySelector('p') ? card.querySelector('p').textContent.toLowerCase() : '';
      const categoryName = {
      premiere: "premiere pro",
      aftereffects: "after effects",
      davinci: "davinci resolve"
      }[category] || "";

      const softwareSelected =
      selectedSoftware.filter(item => item !== 'favs');

      const matchesCategory = softwareSelected.length === 0 || softwareSelected.includes(category);

      const matchesFavorite =!selectedSoftware.includes('favs') || favorites.includes(id);

      const matchesSoftware =matchesCategory && matchesFavorite;

      const matchesDifficulty = selectedDifficulties.length === 0 || 
                                selectedDifficulties.includes(difficulty);

      const matchesSearch =
      query === '' ||
      title.includes(query) ||
      desc.includes(query) ||
      categoryName.includes(query) ||
      difficulty.includes(query);

      const visible =
    matchesSoftware &&
    matchesDifficulty &&
    matchesSearch;

if (visible) {

    card.classList.remove('is-hidden');

    requestAnimationFrame(() => {
        card.classList.remove('is-fading');
    });

    visibleCount++;

} else {

    card.classList.add('is-fading');

    setTimeout(() => {
        card.classList.add('is-hidden');
    }, 200);

}
    });

    if (noResultsMessage) {
      noResultsMessage.style.display = (visibleCount === 0) ? 'block' : 'none';
    }

    if (filterStatus) {
      filterStatus.textContent = `Showing ${visibleCount} tutorial${visibleCount === 1 ? '' : 's'}`;
    }
  }

  if (searchInput && searchClearBtn) {
    searchInput.addEventListener('input', () => {
      searchClearBtn.classList.toggle('active', searchInput.value.trim().length > 0);
      applyFilters();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.classList.remove('active');
      searchInput.focus();
      applyFilters();
    });
  }

  // 9. Video Modal & Focus Trap
  function handleFocusTrap(e) {
    if (e.key !== 'Tab' || !modal || !modal.classList.contains('open')) return;

    const focusables = Array.from(
      modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
    if (focusables.length === 0) return;

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  function openModal(btn) {
    lastFocusedElement = btn;
    if (modalTitle) modalTitle.textContent = btn.dataset.title || '';
    if (modalDesc) modalDesc.textContent = btn.dataset.desc || '';
    if (modalIframe) modalIframe.src = btn.dataset.video || '';

    if (modalDownloadBtn) {
      const downloadUrl = btn.dataset.download;
      if (downloadUrl) {
        modalDownloadBtn.href = downloadUrl;
        modalDownloadBtn.style.display = 'inline-block';
      } else {
        modalDownloadBtn.style.display = 'none';
        modalDownloadBtn.removeAttribute('href');
      }
    }

    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleFocusTrap);
    }

    if (closeModalBtn) closeModalBtn.focus();
  }

  function closeModal() {
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modalIframe) modalIframe.src = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleFocusTrap);

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  document.querySelectorAll('.open-modal').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn));
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // 10. Video Hover Previews & Auto Durations
  const isHoverCapable = window.matchMedia('(hover: hover)').matches;

  cards.forEach(card => {
    const video = card.querySelector('.card-preview-video');
    const durationTag = card.querySelector('.video-duration');

    if (video) {
      if (isHoverCapable) {
        video.muted = true;
        card.addEventListener('mouseenter', () => {
          video.currentTime = 0;
          video.play().catch(err => console.warn('Autoplay prevented:', err));
        });
        card.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
        });
      }

      if (durationTag) {
        const formatTime = () => {
          const totalSeconds = Math.floor(video.duration);
          if (!isNaN(totalSeconds) && totalSeconds > 0) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            durationTag.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }
        };

        if (video.readyState >= 1) {
          formatTime();
        } else {
          video.addEventListener('loadedmetadata', formatTime);
        }
      }
    }
  });

  // Initialize
  updateFavoriteButtons();
  renderActiveTags();
  applyFilters();
});