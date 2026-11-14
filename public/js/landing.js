/**
 * FlamePay Official Landing Page Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeDrawer = document.getElementById('close-drawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('active');
    });
  }

  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => {
      mobileDrawer.classList.remove('active');
    });
  }

  // Download Modal Elements
  const downloadModal = document.getElementById('download-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const triggerDownloadBtns = document.querySelectorAll('.trigger-download');
  const modalServiceName = document.getElementById('modal-service-name');

  const openDownloadModal = (serviceName = '') => {
    if (downloadModal) {
      if (modalServiceName && serviceName) {
        modalServiceName.textContent = `Get the FlamePay App to use ${serviceName}`;
      } else if (modalServiceName) {
        modalServiceName.textContent = 'Get the FlamePay Super App';
      }
      downloadModal.classList.add('active');
    }
  };

  const closeDownloadModal = () => {
    if (downloadModal) {
      downloadModal.classList.remove('active');
    }
  };

  triggerDownloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openDownloadModal(service);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeDownloadModal);
  }

  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) {
        closeDownloadModal();
      }
    });
  }

  // SMS link sending simulation
  const smsForm = document.getElementById('sms-link-form');
  const smsFeedback = document.getElementById('sms-feedback');

  if (smsForm) {
    smsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('sms-phone-input');
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (phone.length >= 10) {
        if (smsFeedback) {
          smsFeedback.textContent = `Download link sent to +91 ${phone}! Check your SMS.`;
          smsFeedback.style.color = '#10B981';
          smsFeedback.style.display = 'block';
        }
        if (phoneInput) phoneInput.value = '';
        setTimeout(() => {
          closeDownloadModal();
          if (smsFeedback) smsFeedback.style.display = 'none';
        }, 3000);
      } else {
        if (smsFeedback) {
          smsFeedback.textContent = 'Please enter a valid 10-digit mobile number';
          smsFeedback.style.color = '#EF4444';
          smsFeedback.style.display = 'block';
        }
      }
    });
  }

  // Smooth active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        current = sectionId;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
