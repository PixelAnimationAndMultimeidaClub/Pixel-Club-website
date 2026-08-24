const registrationModal = document.getElementById("registrationModal");
const registrationForm = document.getElementById("registrationForm");
const successMessage = document.getElementById("successMessage");

// Open registration form
function openRegistration(workshop, date, time) {
    document.getElementById("selectedWorkshop").textContent = workshop;
    document.getElementById("selectedDate").textContent = "DATE: " + date;
    document.getElementById("selectedTime").textContent = "TIME: " + time;

    registrationForm.style.display = "block";
    successMessage.style.display = "none";

    registrationModal.classList.add("show");
    document.body.style.overflow = "hidden";
}
// Close registration form
function closeRegistration() {
  registrationModal.classList.remove("show");
  document.body.style.overflow = "auto";
  registrationForm.style.display = "block";
  successMessage.style.display = "none";
  registrationForm.reset();

  const submitBtn = registrationForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Registration";
  }
}

// Submit registration
registrationForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const submitBtn = registrationForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const registrationData = {
    workshop: document.getElementById("selectedWorkshop").textContent.trim(),
    fullName: document.getElementById("name").value,
    studentID: document.getElementById("studentID").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    experience: document.getElementById("experience").value,
    additionalInfo: document.getElementById("message").value
  };

  // Send data to your Google Apps Script URL
  fetch("https://script.google.com/macros/s/AKfycbxmn_46wJkRONYiC6dr_D-XNrs8LR09s50dbwDPDVXLVRibf3sHF9YRVQCvLHbly23S/exec", {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(registrationData)
  })
  .then(() => {
    registrationForm.style.display = "none";
    successMessage.style.display = "block";
  })
  .catch(error => console.error("Error saving data:", error));
});

// Close modal when clicking outside the form
registrationModal.addEventListener("click", function(event) {
  if (event.target === registrationModal) {
    closeRegistration();
  }
});

// Close modal with ESC key
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeRegistration();
  }
});

// Search, Dropdown & Multi-Selection Filtering Logic
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('eventSearch');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const cards = document.querySelectorAll('.grid .card');
  const noResultsEl = document.getElementById('noResults');
  const activeFiltersContainer = document.getElementById('activeFiltersContainer');

  // Dropdown elements
  const toggleBtn = document.getElementById('filterDropdownToggle');
  const dropdownMenu = document.getElementById('filterDropdownMenu');
  const filterOptions = document.querySelectorAll('.filter-option');
  const submenuParents = document.querySelectorAll('.dropdown-submenu-parent');

  let selectedFilters = [];

  // 1. Toggle main dropdown menu
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

  // 2. Prevent parent menu clicks from acting as links (making them pure hover triggers)
  submenuParents.forEach(parent => {
    const parentLink = parent.querySelector(':scope > a');
    if (parentLink) {
      parentLink.addEventListener('click', (e) => {
        e.preventDefault();
      });
    }
  });

  // 3. Handle Filter Option Clicks & Close Menu on Selection
  filterOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = option.dataset.type || option.dataset.level;
      if (!filterValue) return;

      const index = selectedFilters.indexOf(filterValue);
      if (index > -1) {
        selectedFilters.splice(index, 1);
        option.classList.remove('active');
      } else {
        selectedFilters.push(filterValue);
        option.classList.add('active');
      }

      renderActiveTags();
      applyFilters();

      // Close the main dropdown menu upon selection
      if (dropdownMenu) {
        dropdownMenu.classList.remove('show');
      }
    });
  });

  // Render active pills under search bar with delete buttons
  function renderActiveTags() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    const displayNames = {
      'workshop': 'Workshop',
      'tutorial': 'Tutorial',
      'bootcamp': 'Bootcamp',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };

    selectedFilters.forEach(val => {
      const pill = document.createElement('div');
      pill.className = 'active-filter-pill';
      pill.innerHTML = `${displayNames[val] || val} <button type="button" class="remove-filter" aria-label="Remove filter">×</button>`;
      
      pill.querySelector('.remove-filter').addEventListener('click', () => {
        selectedFilters = selectedFilters.filter(v => v !== val);
        filterOptions.forEach(opt => {
          if (opt.dataset.type === val || opt.dataset.level === val) {
            opt.classList.remove('active');
          }
        });
        renderActiveTags();
        applyFilters();
      });

      activeFiltersContainer.appendChild(pill);
    });
  }

  // 4. Multi-Keyword Search & Filter Handling
  function applyFilters() {
    const rawQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const searchKeywords = rawQuery ? rawQuery.split(/\s+/) : [];
    let visibleCount = 0;

    cards.forEach(card => {
      const cardType = (card.getAttribute('data-type') || '').toLowerCase();
      const cardLevel = (card.getAttribute('data-level') || '').toLowerCase();
      const cardText = card.textContent.toLowerCase();

      const matchesFilter = selectedFilters.length === 0 || 
                            selectedFilters.includes(cardType) || 
                            selectedFilters.includes(cardLevel);

      const matchesSearch = searchKeywords.every(keyword => cardText.includes(keyword));

      if (matchesFilter && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsEl) {
      noResultsEl.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
  }

  // Search Input & Clear 'X' Listeners
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

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchInput.value !== '') {
        searchInput.value = '';
        searchClearBtn.classList.remove('active');
        applyFilters();
      }
    });
  }

  renderActiveTags();
  applyFilters();
});
