$(function () {
  const $filterBtns = $('.filter-btn');
  const $cards = $('.card');
  const $modal = $('#detailModal');
  const $closeModal = $('#closeModal');
  const $searchInput = $('#productSearch');
  const $searchClearBtn = $('#searchClearBtn');
  const $noResults = $('#noResults');
  const $activeFiltersContainer = $('#activeFiltersContainer');
  const $toggleBtn = $('#filterDropdownToggle');
  const $dropdownMenu = $('#filterDropdownMenu');
  let $filterOptions = $('.filter-option');
  const FAVORITES_STORAGE_KEY = 'product_favorites';
  let currentFilter = 'all';
  let selectedFilters = [];
  let favorites = [];

  try {
    favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    if (!Array.isArray(favorites)) favorites = [];
  } catch (error) {
    favorites = [];
  }

  function getCardId($card) {
    return String($card.attr('data-yt-id') || $card.find('.card-title').first().text().trim());
  }

  function getFavoriteIndex(cardId) {
    return favorites.findIndex(function (favorite) {
      return favorite.id === cardId;
    });
  }

  function getCardData($card) {
    return {
      id: getCardId($card),
      title: $card.find('.card-title').first().text().trim(),
      categories: String($card.attr('data-category') || '').split(' '),
      abstract: $card.attr('data-abstract') || '',
      youtubeId: $card.attr('data-yt-id') || '',
      link: $card.attr('data-link') || ''
    };
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }

  function addFavoritesFilterOption() {
    if ($dropdownMenu.find('[data-category="favs"]').length) return;
    $dropdownMenu.append('<div class="dropdown-divider"></div><a href="#" class="dropdown-item filter-option" data-category="favs">★ Favourites</a>');
    $filterOptions = $('.filter-option');
  }

  function addFavoriteButtons() {
    $cards.each(function () {
      const $card = $(this);
      if ($card.find('.fav-btn').length) return;
      const $button = $('<button type="button" class="fav-btn" aria-label="Save to favourites" aria-pressed="false" title="Save to favourites">♥</button>');
      const $previewArea = $card.find('.video-preview-wrapper').first();
      if ($previewArea.length) $previewArea.append($button);
      else $card.prepend($button);
    });
  }

  function updateFavoriteButtons() {
    $('.fav-btn').each(function () {
      const $button = $(this);
      const isFavorite = getFavoriteIndex(getCardId($button.closest('.card'))) > -1;
      $button.toggleClass('active', isFavorite)
        .attr('aria-pressed', isFavorite)
        .attr('aria-label', isFavorite ? 'Remove from favourites' : 'Save to favourites')
        .attr('title', isFavorite ? 'Remove from favourites' : 'Save to favourites');
    });
  }

  function closeDropdown() {
    $dropdownMenu.removeClass('show').css('display', 'none');
  }

  function applyFilters() {
    const rawQuery = String($searchInput.val() || '').toLowerCase().trim();
    const searchKeywords = rawQuery ? rawQuery.split(/\s+/) : [];
    const wantsFavorites = selectedFilters.includes('favs');
    const categoryFilters = selectedFilters.filter(function (filter) { return filter !== 'favs'; });
    let visibleCount = 0;

    $cards.each(function () {
      const $card = $(this);
      const categories = String($card.attr('data-category') || '').split(' ');
      const matchesTopFilter = currentFilter === 'all' || categories.includes(currentFilter);
      const matchesCategories = categoryFilters.length === 0 || categoryFilters.some(function (filter) { return categories.includes(filter); });
      const matchesFavorites = !wantsFavorites || getFavoriteIndex(getCardId($card)) > -1;
      const matchesFilter = selectedFilters.length > 0 ? matchesCategories && matchesFavorites : matchesTopFilter;
      const matchesSearch = searchKeywords.every(function (keyword) { return $card.text().toLowerCase().includes(keyword); });

      if (matchesFilter && matchesSearch) {
        $card.removeClass('hidden');
        visibleCount++;
      } else {
        $card.addClass('hidden');
      }
    });
    $noResults.toggle(visibleCount === 0);
  }

  function renderActiveTags() {
    const displayNames = { '2d': '2D Animation', '3d': '3D Render', video: 'Explanation', blender: 'Blender Studio', gobelins: 'GOBELINS Paris', favs: '★ Favourites' };
    $activeFiltersContainer.empty();
    selectedFilters.forEach(function (filterValue) {
      const label = displayNames[filterValue] || filterValue;
      $activeFiltersContainer.append('<div class="active-filter-pill">' + label + '<button type="button" class="remove-filter" data-category="' + filterValue + '" aria-label="Remove ' + label + ' filter">×</button></div>');
    });
  }

  $toggleBtn.on('click', function (event) {
    event.stopPropagation();
    if ($dropdownMenu.hasClass('show')) closeDropdown();
    else $dropdownMenu.addClass('show').css('display', 'block');
  });
  $(document).on('click', closeDropdown);
  $dropdownMenu.on('click', function (event) { event.stopPropagation(); });

  $filterBtns.on('click', function () {
    const $button = $(this);
    $filterBtns.removeClass('active');
    $button.addClass('active');
    currentFilter = $button.attr('data-filter');
    selectedFilters = [];
    $filterOptions.removeClass('active');
    renderActiveTags();
    applyFilters();
  });

  $dropdownMenu.on('click', '.filter-option', function (event) {
    event.preventDefault();
    const $option = $(this);
    const filterValue = $option.attr('data-category');
    if (!filterValue) return;
    const index = selectedFilters.indexOf(filterValue);
    if (index > -1) {
      selectedFilters.splice(index, 1);
      $option.removeClass('active');
    } else {
      selectedFilters.push(filterValue);
      $option.addClass('active');
    }
    $filterBtns.removeClass('active');
    renderActiveTags();
    applyFilters();
    closeDropdown();
  });

  $activeFiltersContainer.on('click', '.remove-filter', function () {
    const filterValue = $(this).attr('data-category');
    selectedFilters = selectedFilters.filter(function (item) { return item !== filterValue; });
    $filterOptions.filter('[data-category="' + filterValue + '"]').removeClass('active');
    if (selectedFilters.length === 0 && $filterBtns.length) {
      $filterBtns.removeClass('active');
      $filterBtns.first().addClass('active');
      currentFilter = 'all';
    }
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

  $cards.on('click', '.fav-btn', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const $card = $(this).closest('.card');
    const favoriteData = getCardData($card);
    const index = getFavoriteIndex(favoriteData.id);
    if (index > -1) favorites.splice(index, 1);
    else favorites.push(favoriteData);
    saveFavorites();
    updateFavoriteButtons();
    if (selectedFilters.includes('favs')) applyFilters();
  });

  function openModal($card) {
    const category = $card.find('.tag').map(function () { return $(this).text(); }).get().join(' • ');
    $('#modalTitle').text($card.find('.card-title').first().text());
    $('#modalCategory').text(category);
    $('#modalAbstract').text($card.attr('data-abstract'));
    $('#modalLink').attr('href', $card.attr('data-link'));
    $('#modalYoutubeIframe').attr('src', 'https://www.youtube-nocookie.com/embed/' + $card.attr('data-yt-id') + '?autoplay=1');
    $modal.addClass('active');
    $('body').css('overflow', 'hidden');
  }

  function clearModalVideo() {
    $modal.removeClass('active');
    $('#modalYoutubeIframe').attr('src', '');
    $('body').css('overflow', 'auto');
  }

  $cards.on('click', function (event) {
    if (!$(event.target).closest('.fav-btn').length) openModal($(this));
  });
  $closeModal.on('click', clearModalVideo);
  $modal.on('click', function (event) { if (event.target === this) clearModalVideo(); });
  $(document).on('keydown', function (event) { if (event.key === 'Escape' && $modal.hasClass('active')) clearModalVideo(); });

  $cards.each(function () {
    const $card = $(this);
    const iframe = $card.find('.preview-iframe').get(0);
    const video = $card.find('.preview-video').get(0);
    $card.on('mouseenter', function () {
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      if (video) { video.currentTime = 0; video.play().catch(function () {}); }
    });
    $card.on('mouseleave', function () {
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      if (video) { video.pause(); video.currentTime = 0; }
    });
  });

  addFavoritesFilterOption();
  addFavoriteButtons();
  updateFavoriteButtons();
  renderActiveTags();
  applyFilters();
});
