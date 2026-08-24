document.addEventListener('DOMContentLoaded', () => {
/* ==========================================================================
     1. DYNAMIC SIDE NAV LINK HIGHLIGHTING (MENTORS PAGE - UNTOUCHED)
     ========================================================================== */
  const mentorIntroFrames = document.querySelectorAll('.mentor-intro-frame');
  const sideNavLinks = document.querySelectorAll('.side-nav-link');

  if (mentorIntroFrames.length > 0 && sideNavLinks.length > 0) {
    const updateActiveNavLink = () => {
      const checkPoint = window.innerHeight * 0.3;
      let activeId = '';

      mentorIntroFrames.forEach((frame) => {
        const rect = frame.getBoundingClientRect();
        if (rect.top <= checkPoint) {
          const parentBlock = frame.closest('.mentor-block');
          if (parentBlock) {
            activeId = parentBlock.getAttribute('id');
          }
        }
      });

      if (activeId) {
        sideNavLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${activeId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    };

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    window.addEventListener('resize', updateActiveNavLink, { passive: true });
    
    updateActiveNavLink();
  }
});