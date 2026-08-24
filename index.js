
document.addEventListener('DOMContentLoaded', () => {
  const joinForm = document.getElementById('joinForm');
  const submitBtn = document.getElementById('submitBtn');
  const modal = document.getElementById('joinModal');
  const successCard = document.getElementById('successCard');
  const scriptURL = 'https://script.google.com/macros/s/AKfycbz6A1GD1461jFaxjWhHp8QCXf6u5tV_QWO0MZ1TLYVJeU6LA_wkM-CVk_Z9sjSSZZxT/exec';

  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      fetch(scriptURL, { method: 'POST', body: new FormData(joinForm) })
        .then((response) => {
          // Hide form inputs and show small success card
          joinForm.style.display = 'none';
          successCard.style.display = 'flex';
          
          // Reset form fields
          joinForm.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Registration';

          // Automatically close modal after 2 seconds
          setTimeout(() => {
            if (modal) {
              modal.classList.remove('is-open');
            }
            // Reset visibility for next time modal is opened
            setTimeout(() => {
              joinForm.style.display = 'flex';
              successCard.style.display = 'none';
            }, 300);
          }, 2000);
        })
        .catch((error) => {
          alert('Something went wrong. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Registration';
        });
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openJoinModal');
  const closeBtn = document.getElementById('closeJoinModal');
  const modal = document.getElementById('joinModal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('is-open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('is-open');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
      }
    });

    // Close modal when pressing the Escape key
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
      }
    });
  }
});

/* ==========================================================================
   Why Join Section Interactive Effects
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const featureCards = document.querySelectorAll('.why-feature');

  // Highlight number tag on card hover
  featureCards.forEach((card) => {
    const numberTag = card.querySelector('.why-feature-number');
    if (!numberTag) return;

    card.addEventListener('mouseenter', () => {
      numberTag.style.backgroundColor = 'var(--sky-blue)';
      numberTag.style.color = '#ffffff';
    });

    card.addEventListener('mouseleave', () => {
      numberTag.style.backgroundColor = 'rgba(61, 184, 255, 0.1)';
      numberTag.style.color = 'var(--sky-blue)';
    });
  });

  // Intersection Observer for scroll-in fade animation
  const observerOptions = {
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  featureCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.4s ease ${index * 0.15}s, transform 0.4s ease ${index * 0.15}s, border-color 0.25s ease, box-shadow 0.25s ease`;
    observer.observe(card);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const eventButtons = document.querySelectorAll('.open-event-modal');
  const modal = document.getElementById('joinModal');

  eventButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('is-open');
      }
    });
  });
});
