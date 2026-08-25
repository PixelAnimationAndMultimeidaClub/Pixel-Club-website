$(function () {
  // DOM Cache
  const $window = $(window);
  const $document = $(document);
  const $searchInput = $('#projectSearch');
  const $searchClearBtn = $('#searchClearBtn');
  const $noResults = $('#noResultsMessage');
  const $activeFiltersContainer = $('#activeFiltersContainer');
  const $modal = $('#videoModal');
  const $modalIframe = $('#modalIframe');
  const $modalTitle = $('#modalTitle');
  const $modalDesc = $('#modalDesc');
  const $closeModalBtn = $('.modal-close');
  const $backdrop = $('.modal-backdrop');
  const $scrubFill = $('#scrubFill');
  const $toggleBtn = $('#filterDropdownToggle');
  const $dropdownMenu = $('#filterDropdownMenu');
  const $filterOptions = $('.filter-option');
  const $projectsGrid = $('#projectsGrid');

  const FAVS_KEY = 'pixel_favs';
  let selectedCategories = [];
  let $lastFocusedElement = null;
  let searchDebounceTimer = null;
  let isScrollTicking = false;

  // Optimized Cookie Helpers
const CookieManager = {
  // Flag tracking consent (Defaults to false until user accepts)
  hasConsent: false,

  // Called when user clicks "Accept" or "Reject" on your banner
  setConsent(consentGiven) {
    this.hasConsent = consentGiven;
    
    if (consentGiven) {
      // If user accepts, save current in-memory favorites to persistent cookie
      this.set('pixel_favs', JSON.stringify(favorites));
    } else {
      // If user rejects or revokes consent, wipe existing cookies
      this.delete('pixel_favs');
    }
  },

  // Dynamic set method with built-in consent check
  set(name, value, days = 30) {
    if (!this.hasConsent) {
      console.warn(`[CookieManager] Skipping cookie "${name}": Consent not granted.`);
      return false;
    }

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;
    return true;
  },

  // Read cookies safely
  get(name) {
    const matches = document.cookie.match(new RegExp(
      `(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  },

  // Clear/Delete cookie helper
  delete(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

const FAVS_KEY = 'pixel_favs';

// Safely read saved favorites without auto-creating cookies on startup
function loadFavoritesOnStart() {
  try {
    const savedData = CookieManager.get(FAVS_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Failed to parse favorites cookie:", error);
    return [];
  }
}

// In-Memory global state (Always works during active session)
let favorites = loadFavoritesOnStart();

// Toggle item in favorites array and save according to consent
function toggleFavorite(itemId) {
  const index = favorites.indexOf(itemId);
  
  if (index === -1) {
    favorites.push(itemId);
  } else {
    favorites.splice(index, 1);
  }

  // Attempt to write cookie; safely degrades to active tab memory if consent = false
  CookieManager.set(FAVS_KEY, JSON.stringify(favorites));
  
  // Update your UI here if needed
  renderFavoritesUI();
}

// Helper utility for safe HTML rendering
function escapeHtml(value) {
  return $('<div>').text(value || '').html();
}

function renderFavoritesUI() {
  console.log("Current favorites (In-Memory):", favorites);
}

// Connect these to your banner buttons in your UI logic:

function onAcceptCookiesClick() {
  CookieManager.setConsent(true);
  console.log("User accepted cookies. State saved to persistent cookie storage.");
}

function onRejectCookiesClick() {
  CookieManager.setConsent(false);
  console.log("User rejected cookies. Running in active session-memory mode.");
}

  // Dropdown Controls
  function closeDropdown() {
    $dropdownMenu.removeClass('show').css('display', 'none');
  }

  $toggleBtn.on('click', function (event) {
    event.stopPropagation();
    const isShown = $dropdownMenu.hasClass('show');
    $dropdownMenu.toggleClass('show', !isShown).css('display', isShown ? 'none' : 'block');
  });

  $document.on('click', closeDropdown);
  $dropdownMenu.on('click', (e) => e.stopPropagation());

  // Throttled Scroll Progress
  $window.on('scroll', function () {
    if (!$scrubFill.length || isScrollTicking) return;
    
    isScrollTicking = true;
    requestAnimationFrame(function () {
      const scrollTop = $window.scrollTop();
      const documentHeight = $document.height() - $window.height();
      const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
      $scrubFill.css('width', `${progress}%`);
      isScrollTicking = false;
    });
  });

  // Thumbnail Loader Helper
  function initializeThumbnailLoading($card) {
    const $thumb = $card.find('.card-thumb');
    const $image = $card.find('.card-img-static');

    if (!$thumb.length || !$image.length) return;

    function markImageLoaded() {
      $thumb.addClass('is-loaded');
      $image.addClass('is-loaded');
    }

    if ($image.prop('complete') && $image.prop('naturalHeight') !== 0) {
      markImageLoaded();
    } else {
      $image.one('load error', markImageLoaded);
    }
  }

  function updateFavoriteButtons() {
    $('.project-card').each(function () {
      const $card = $(this);
      const id = $card.data('id');
      const $favButton = $card.find('.fav-btn');
      const isFavorite = favorites.includes(id);

      $favButton
        .toggleClass('active', isFavorite)
        .attr('aria-pressed', isFavorite)
        .attr('aria-label', isFavorite ? 'Remove from favorites' : 'Save to favorites');
    });
  }

  function renderActiveTags() {
    const categoryNames = {
      '2d': '2D Animation',
      '3d': '3D Animation',
      motion: 'Motion Graphics',
      favs: 'Favorites'
    };

    $activeFiltersContainer.empty();

    selectedCategories.forEach(function (category) {
      const label = categoryNames[category] || category;
      $activeFiltersContainer.append(`
        <div class="active-filter-pill">
          ${label}
          <button type="button" class="remove-filter" data-category="${category}" aria-label="Remove ${label} filter">×</button>
        </div>
      `);
    });
  }

  function applyFilters() {
    const rawQuery = String($searchInput.val() || '').toLowerCase().trim();
    const searchKeywords = rawQuery ? rawQuery.split(/\s+/) : [];
    let visibleCount = 0;

    $('.project-card').each(function () {
      const $card = $(this);
      const category = String($card.data('category') || '').toLowerCase();
      const id = $card.data('id');
      const title = $card.find('h3').first().text().toLowerCase();
      const description = $card.find('p').text().toLowerCase();
      const tags = $card.find('.meta-tag').map(function () {
        return $(this).text().toLowerCase();
      }).get().join(' ');

      const searchableText = `${title} ${description} ${tags} ${category}`;
      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(category) ||
        (selectedCategories.includes('favs') && favorites.includes(id));

      const matchesSearch = searchKeywords.every(keyword => searchableText.includes(keyword));

      if (matchesCategory && matchesSearch) {
        $card.removeClass('is-hidden');
        requestAnimationFrame(() => $card.removeClass('is-fading'));
        visibleCount++;
      } else {
        $card.addClass('is-fading is-hidden');
      }
    });

    $noResults.toggle(visibleCount === 0);
  }

  // Delegated Event Handlers
  $document.on('click', '.fav-btn', function (event) {
    event.stopPropagation();

    const id = $(this).closest('.project-card').data('id');
    if (!id) return;

    if (favorites.includes(id)) {
      favorites = favorites.filter(favoriteId => favoriteId !== id);
    } else {
      favorites.push(id);
    }

    setCookie(FAVS_KEY, JSON.stringify(favorites), 30);
    updateFavoriteButtons();

    if (selectedCategories.includes('favs')) {
      applyFilters();
    }
  });

  $filterOptions.on('click', function (event) {
    event.preventDefault();
    const category = $(this).data('category');
    if (!category) return;

    const index = selectedCategories.indexOf(category);
    if (index > -1) {
      selectedCategories.splice(index, 1);
      $(this).removeClass('active');
    } else {
      selectedCategories.push(category);
      $(this).addClass('active');
    }

    renderActiveTags();
    applyFilters();
    closeDropdown();
  });

  $activeFiltersContainer.on('click', '.remove-filter', function () {
    const category = $(this).data('category');
    selectedCategories = selectedCategories.filter(item => item !== category);

    $filterOptions.filter(`[data-category="${category}"]`).removeClass('active');
    renderActiveTags();
    applyFilters();
  });

  // Debounced Search Input
  $searchInput.on('input', function () {
    const query = $.trim($(this).val());
    $searchClearBtn.toggleClass('active', query.length > 0);

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(applyFilters, 150);
  });

  $searchClearBtn.on('click', function () {
    $searchInput.val('').trigger('focus');
    $searchClearBtn.removeClass('active');
    applyFilters();
  });

  $searchInput.on('keydown', function (event) {
    if (event.key === 'Escape' && $(this).val() !== '') {
      $(this).val('');
      $searchClearBtn.removeClass('active');
      applyFilters();
    }
  });

  // Modal Handlers
  function openModal($button) {
    $lastFocusedElement = $button;
    $modalTitle.text($button.data('title') || '');
    $modalDesc.text($button.data('desc') || '');
    $modalIframe.attr('src', $button.data('video') || '');
    $modal.addClass('open').attr('aria-hidden', 'false');
    $('body').css('overflow', 'hidden');
    $closeModalBtn.trigger('focus');
  }

  function closeModal() {
    if (!$modal.hasClass('open')) return;
    $modal.removeClass('open').attr('aria-hidden', 'true');
    $modalIframe.attr('src', '');
    $('body').css('overflow', '');

    if ($lastFocusedElement && $lastFocusedElement.length) {
      $lastFocusedElement.trigger('focus');
    }
  }

  $document.on('click', '.open-modal', function () { openModal($(this)); });
  $closeModalBtn.on('click', closeModal);
  $backdrop.on('click', closeModal);
  $document.on('keydown', function (event) {
    if (event.key === 'Escape' && $modal.hasClass('open')) closeModal();
  });

  // Video Hover Handling
  if (window.matchMedia('(hover: hover)').matches) {
    $document.on('mouseenter', '.project-card', function () {
      const video = $(this).find('.card-preview-video').get(0);
      if (!video) return;

      video.muted = true;
      video.currentTime = 0;
      video.play()?.catch(err => console.warn('Autoplay prevented:', err));
    }).on('mouseleave', '.project-card', function () {
      const video = $(this).find('.card-preview-video').get(0);
      if (!video) return;

      video.pause();
      video.currentTime = 0;
    });
  }

  // Fetch Async Cards
  function loadGhibliFilms() {
    $.getJSON('https://ghibliapi.vercel.app/films')
      .done(function (films) {
        const filmCardsHtml = films.map(film => `
          <article class="card project-card ghibli-card" data-category="ghibli" data-id="ghibli-${escapeHtml(film.id)}">
            <div class="card-content">
              <button class="fav-btn" title="Save to favorites" aria-label="Save to favorites" aria-pressed="false">♥</button>
              <h3>${escapeHtml(film.title)}</h3>
              <div class="card-meta-tags">
                <span class="meta-tag">Studio Ghibli</span>
                <span class="meta-tag">${escapeHtml(film.release_date)}</span>
              </div>
              <p><strong>Director:</strong> ${escapeHtml(film.director)}</p>
              <p>${escapeHtml(film.description)}</p>
              <div class="card-footer-action">
                <span class="label-mono">Rotten Tomatoes Score: ${escapeHtml(film.rt_score)}%</span>
              </div>
            </div>
          </article>
        `).join('');

        $projectsGrid.append(filmCardsHtml);
        updateFavoriteButtons();
        applyFilters();
      })
      .fail(function () {
        console.warn('Studio Ghibli films could not be loaded.');
      });
  }

  // Initialization
  $('.project-card').each(function () {
    initializeThumbnailLoading($(this));
  });
  
  updateFavoriteButtons();
  renderActiveTags();
  applyFilters();
  loadGhibliFilms();
});