document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Hamburger Menu Toggle
  const hamburger = document.getElementById("hamburger-btn");
  const navMenu = document.getElementById("navbar-nav");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }

  // 2. Scrub Bar Scroll Progress
  const scrubFill = document.getElementById("scrubFill");
  
  window.addEventListener("scroll", () => {
    // Calculate how far down the user has scrolled
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    // Update the width of the scrub bar fill based on scroll percentage
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      if (scrubFill) {
        scrubFill.style.width = progress + "%";
      }
    }
  });
  /* ==========================================================================
     0. INTRO VIDEO ANIMATION (FIRST VISIT & REFRESH ONLY, NEVER ON NAV)
     ========================================================================== */
  // Check if the page load was triggered by a refresh or a direct entry
  const navigationEntries = performance.getEntriesByType('navigation');
  const isRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
  
  // Also check if it's the very first time entering the site in this session
  const hasVisited = sessionStorage.getItem('pixel_visited');

  if (isRefresh || !hasVisited) {
    sessionStorage.setItem('pixel_visited', 'true');

    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #0f0d18;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease;
    `;

    const video = document.createElement('video');
    video.src = 'videos/pixel.mp4';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;

    overlay.appendChild(video);
    document.body.appendChild(overlay);

    video.addEventListener('ended', () => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 500);
    });

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
      }
    }, 3000);
  } else {
    // If it's a normal link navigation from another page, ensure flag is set
    sessionStorage.setItem('pixel_visited', 'true');
  }
});
