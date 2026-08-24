$(function () {
  const $searchInput = $('#projectSearch');
  const $searchClearBtn = $('#searchClearBtn');
  let $cards = $('.project-card');
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

  const FAVS_KEY = 'pixel_favs';
  let selectedCategories = [];
  let $lastFocusedElement = null;

  function setCookie(name, value, days) {
    const expires = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();

    const secure = location.protocol === 'https:' ? '; Secure' : '';

    document.cookie =
      `${name}=${encodeURIComponent(value)}` +
      `; expires=${expires}; path=/; SameSite=Lax${secure}`;
  }

  function getCookie(name) {
    const cookieName = `${name}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();

      if (cookie.indexOf(cookieName) === 0) {
        return decodeURIComponent(cookie.substring(cookieName.length));
      }
    }

    return null;
  }

  let favorites = [];

  try {
    favorites = JSON.parse(getCookie(FAVS_KEY) || '[]');
  } catch (error) {
    favorites = [];
  }

  function escapeHtml(value) {
    return $('<div>').text(value || '').html();
  }

  function closeDropdown() {
    $dropdownMenu.removeClass('show').css('display', 'none');
  }

  $toggleBtn.on('click', function (event) {
    event.stopPropagation();

    if ($dropdownMenu.hasClass('show')) {
      closeDropdown();
    } else {
      $dropdownMenu.addClass('show').css('display', 'block');
    }
  });

  $(document).on('click', closeDropdown);

  $dropdownMenu.on('click', function (event) {
    event.stopPropagation();
  });

  $(window).on('scroll', function () {
    if (!$scrubFill.length) return;

    const scrollTop = $(window).scrollTop();
    const documentHeight = $(document).height() - $(window).height();
    const progress = documentHeight > 0
      ? (scrollTop / documentHeight) * 100
      : 0;

    $scrubFill.css('width', `${progress}%`);
  });

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

  $cards.each(function () {
    initializeThumbnailLoading($(this));
  });

  function updateFavoriteButtons() {
    $cards.each(function () {
      const $card = $(this);
      const id = $card.data('id');
      const $favButton = $card.find('.fav-btn');
      const isFavorite = favorites.includes(id);

      $favButton
        .toggleClass('active', isFavorite)
        .attr('aria-pressed', isFavorite)
        .attr(
          'aria-label',
          isFavorite ? 'Remove from favorites' : 'Save to favorites'
        );
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
          <button
            type="button"
            class="remove-filter"
            data-category="${category}"
            aria-label="Remove ${label} filter"
          >×</button>
        </div>
      `);
    });
  }

  function applyFilters() {
    const rawQuery = String($searchInput.val() || '').toLowerCase().trim();
    const searchKeywords = rawQuery ? rawQuery.split(/\s+/) : [];
    let visibleCount = 0;

    $cards.each(function () {
      const $card = $(this);
      const category = String($card.data('category') || '').toLowerCase();
      const id = $card.data('id');
      const title = $card.find('h3').first().text().toLowerCase();
      const description = $card.find('p').text().toLowerCase();

      const tags = $card.find('.meta-tag').map(function () {
        return $(this).text().toLowerCase();
      }).get().join(' ');

      const searchableText = `${title} ${description} ${tags} ${category}`;

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(category) ||
        (selectedCategories.includes('favs') && favorites.includes(id));

      const matchesSearch = searchKeywords.every(function (keyword) {
        return searchableText.includes(keyword);
      });

      if (matchesCategory && matchesSearch) {
        $card.removeClass('is-hidden');

        requestAnimationFrame(function () {
          $card.removeClass('is-fading');
        });

        visibleCount++;
      } else {
        $card.addClass('is-fading is-hidden');
      }
    });

    $noResults.toggle(visibleCount === 0);
  }

  $(document).on('click', '.fav-btn', function (event) {
    event.stopPropagation();

    const id = $(this).closest('.project-card').data('id');
    if (!id) return;

    if (favorites.includes(id)) {
      favorites = favorites.filter(function (favoriteId) {
        return favoriteId !== id;
      });
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

    const $option = $(this);
    const category = $option.data('category');
    if (!category) return;

    const index = selectedCategories.indexOf(category);

    if (index > -1) {
      selectedCategories.splice(index, 1);
      $option.removeClass('active');
    } else {
      selectedCategories.push(category);
      $option.addClass('active');
    }

    renderActiveTags();
    applyFilters();
    closeDropdown();
  });

  $activeFiltersContainer.on('click', '.remove-filter', function () {
    const category = $(this).data('category');

    selectedCategories = selectedCategories.filter(function (item) {
      return item !== category;
    });

    $filterOptions
      .filter(`[data-category="${category}"]`)
      .removeClass('active');

    renderActiveTags();
    applyFilters();
  });

  $searchInput.on('input', function () {
    $searchClearBtn.toggleClass('active', $.trim($(this).val()).length > 0);
    applyFilters();
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

  function openModal($button) {
    $lastFocusedElement = $button;

    $modalTitle.text($button.data('title') || '');
    $modalDesc.text($button.data('desc') || '');
    $modalIframe.attr('src', $button.data('video') || '');

    $modal
      .addClass('open')
      .attr('aria-hidden', 'false');

    $('body').css('overflow', 'hidden');
    $closeModalBtn.trigger('focus');
  }

  function closeModal() {
    if (!$modal.hasClass('open')) return;

    $modal
      .removeClass('open')
      .attr('aria-hidden', 'true');

    $modalIframe.attr('src', '');
    $('body').css('overflow', '');

    if ($lastFocusedElement && $lastFocusedElement.length) {
      $lastFocusedElement.trigger('focus');
    }
  }

  $(document).on('click', '.open-modal', function () {
    openModal($(this));
  });

  $closeModalBtn.on('click', closeModal);
  $backdrop.on('click', closeModal);

  $(document).on('keydown', function (event) {
    if (event.key === 'Escape' && $modal.hasClass('open')) {
      closeModal();
    }
  });

  if (window.matchMedia('(hover: hover)').matches) {
    $cards.each(function () {
      const video = $(this).find('.card-preview-video').get(0);

      if (!video) return;

      video.muted = true;

      $(this).on('mouseenter', function () {
        video.currentTime = 0;

        const playPromise = video.play();

        if (playPromise) {
          playPromise.catch(function (error) {
            console.warn('Autoplay prevented:', error);
          });
        }
      });

      $(this).on('mouseleave', function () {
        video.pause();
        video.currentTime = 0;
      });
    });
  }

  function loadGhibliFilms() {
    $.getJSON('https://ghibliapi.vercel.app/films')
      .done(function (films) {
        const $grid = $('#projectsGrid');

        films.forEach(function (film) {
          $grid.append(`
            <article
              class="card project-card ghibli-card"
              data-category="ghibli"
              data-id="ghibli-${escapeHtml(film.id)}"
            >
              <div class="card-content">
                <button
                  class="fav-btn"
                  title="Save to favorites"
                  aria-label="Save to favorites"
                  aria-pressed="false"
                >♥</button>

                <h3>${escapeHtml(film.title)}</h3>

                <div class="card-meta-tags">
                  <span class="meta-tag">Studio Ghibli</span>
                  <span class="meta-tag">${escapeHtml(film.release_date)}</span>
                </div>

                <p><strong>Director:</strong> ${escapeHtml(film.director)}</p>
                <p>${escapeHtml(film.description)}</p>

                <div class="card-footer-action">
                  <span class="label-mono">
                    Rotten Tomatoes Score: ${escapeHtml(film.rt_score)}%
                  </span>
                </div>
              </div>
            </article>
          `);
        });

        $cards = $('.project-card');

        updateFavoriteButtons();
        applyFilters();
      })
      .fail(function () {
        console.warn('Studio Ghibli films could not be loaded.');
      });
  }

  updateFavoriteButtons();
  renderActiveTags();
  applyFilters();
  loadGhibliFilms();
});