document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. MOBILE NAVIGATION TOGGLE
     ========================================================================== */
  const navToggle = document.getElementById('navToggle');
  const navbarNav = document.getElementById('navbarNav');

  if (navToggle && navbarNav) {
    navToggle.addEventListener('click', () => {
      navbarNav.classList.toggle('show');
    });
  }

  /* ==========================================================================
     2. SCRUB BAR SCROLL PROGRESS INDICATOR
     ========================================================================== */
  const scrubFill = document.getElementById('scrubFill');

  if (scrubFill) {
    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (windowHeight > 0) {
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrubFill.style.width = `${scrolled}%`;
      }
    });
  }

  /* ==========================================================================
     3. LAZY LOADING BACKGROUND IMAGES VIA INTERSECTION OBSERVER
     ========================================================================== */
  const lazyCards = document.querySelectorAll('.card[data-bg]');

  if ('IntersectionObserver' in window) {
    const bgObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          card.style.backgroundImage = `url('${card.getAttribute('data-bg')}')`;
          observer.unobserve(card);
        }
      });
    }, { rootMargin: '200px 0px' });

    lazyCards.forEach((card) => bgObserver.observe(card));
  } else {
    lazyCards.forEach((card) => {
      card.style.backgroundImage = `url('${card.getAttribute('data-bg')}')`;
    });
  }

  /* ==========================================================================
     4. BLOG CATEGORY FILTERING & SEARCH LOGIC (MULTI-SELECT SUPPORT)
     ========================================================================== */
  const filterToggleBtn = document.getElementById('filterDropdownToggle');
  const filterDropdownMenu = document.getElementById('filterDropdownMenu');
  const filterOptions = document.querySelectorAll('.filter-option');
  const searchInput = document.getElementById('blogSearch');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const activeFiltersContainer = document.getElementById('activeFiltersContainer');
  const cardLinks = document.querySelectorAll('#articlesGrid .card-link');
  const articles = cardLinks.length > 0 ? cardLinks : document.querySelectorAll('#articlesGrid article.card');
  let activeTimeouts = [];

  let selectedCategories = [];
  let searchQuery = '';

  function renderActiveFilterPills() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    selectedCategories.forEach(cat => {
      const activeOption = document.querySelector(`.filter-option[data-filter="${cat}"]`);
      const categoryName = activeOption ? activeOption.textContent : cat;

      const pill = document.createElement('div');
      pill.className = 'active-filter-pill';
      pill.innerHTML = `
        <span>${categoryName}</span>
        <button type="button" class="remove-filter" aria-label="Remove filter">×</button>
      `;

      pill.querySelector('.remove-filter').addEventListener('click', () => {
        selectedCategories = selectedCategories.filter(c => c !== cat);
        
        if (activeOption) {
          activeOption.classList.remove('active');
        }

        updateArticlesFilter();
        renderActiveFilterPills();
      });

      activeFiltersContainer.appendChild(pill);
    });
  }

  function updateArticlesFilter() {
    activeTimeouts.forEach((t) => clearTimeout(t));
    activeTimeouts = [];

    let revealIndex = 0;

    articles.forEach((item) => {
      const innerCard = item.querySelector('.card') || item;
      const articleCategory = innerCard.getAttribute('data-category');
      const title = innerCard.querySelector('h3') ? innerCard.querySelector('h3').textContent.toLowerCase() : '';
      const description = innerCard.querySelector('p') ? innerCard.querySelector('p').textContent.toLowerCase() : '';

      const matchesCategory = (selectedCategories.length === 0 || selectedCategories.includes(articleCategory));
      const matchesSearch = title.includes(searchQuery) || description.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        item.classList.remove('is-hidden');
        innerCard.classList.remove('is-hidden');
        
        const showTimeout = setTimeout(() => {
          item.classList.remove('hide');
          innerCard.classList.remove('hide');
          innerCard.classList.add('is-in-view');
        }, revealIndex * 60);

        activeTimeouts.push(showTimeout);
        revealIndex++;
      } else {
        innerCard.classList.remove('is-in-view');
        item.classList.add('hide');
        innerCard.classList.add('hide');

        const hideTimeout = setTimeout(() => {
          if (item.classList.contains('hide')) {
            item.classList.add('is-hidden');
            innerCard.classList.add('is-hidden');
          }
        }, 350);

        activeTimeouts.push(hideTimeout);
      }
    });

    renderActiveFilterPills();
  }

  if (filterToggleBtn && filterDropdownMenu) {
    filterToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      filterDropdownMenu.classList.remove('show');
    });
  }

  if (filterOptions.length > 0 && articles.length > 0) {
    filterOptions.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const filterVal = option.getAttribute('data-filter');

        if (selectedCategories.includes(filterVal)) {
          selectedCategories = selectedCategories.filter(c => c !== filterVal);
          option.classList.remove('active');
        } else {
          selectedCategories.push(filterVal);
          option.classList.add('active');
        }
        
        updateArticlesFilter();

        if (filterDropdownMenu) {
          filterDropdownMenu.classList.remove('show');
        }
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      
      if (searchClearBtn) {
        if (searchQuery.length > 0) {
          searchClearBtn.classList.add('active');
        } else {
          searchClearBtn.classList.remove('active');
        }
      }

      updateArticlesFilter();
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.classList.remove('active');
      searchInput.focus();
      updateArticlesFilter();
    });
  }

  /* ==========================================================================
     5. SCROLL-REVEAL OBSERVER FOR BLOG CARDS
     ========================================================================== */
  const scrollCards = document.querySelectorAll('.card.scroll-reveal');

  if (scrollCards.length > 0) {
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
          } else {
            if (entry.boundingClientRect.top > 0) {
              entry.target.classList.remove('is-in-view');
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    scrollCards.forEach((card) => cardObserver.observe(card));
  }
});