/* ==========================================================================
   REUSABLE UTILITIES & HELPERS (Theme, Toast, Sanitization, Debounce, Date)
   ========================================================================== */

import { CONFIG } from './config.js';

// --- 1. Theme Management (Dark / Light Mode) ---
export function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || 'dark';
  setTheme(savedTheme);
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme);
  const toggleBtns = document.querySelectorAll('.theme-toggle');
  toggleBtns.forEach(btn => {
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    btn.innerHTML = theme === 'dark' 
      ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>` 
      : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
  });
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// --- 2. Toast Notifications ---
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  
  const iconMap = {
    success: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
    error: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    info: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- 3. HTML Sanitization ---
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- 4. Debounce Helper ---
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- 5. Date Formatting ---
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// --- 6. Modal Controller ---
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const firstInput = modal.querySelector('input, select, textarea, button:not(.modal-close)');
    if (firstInput) firstInput.focus();
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// --- 7. Form Validation ---
export function validateForm(form) {
  if (!form) return false;
  let isValid = true;
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    const formGroup = input.closest('.form-group') || input.parentElement;
    const errorSpan = formGroup ? formGroup.querySelector('.form-error') : null;

    if (errorSpan) errorSpan.textContent = '';
    input.classList.remove('input-error');

    if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      input.classList.add('input-error');
      if (errorSpan) errorSpan.textContent = 'This field is required.';
      return;
    }

    if (input.type === 'email' && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        isValid = false;
        input.classList.add('input-error');
        if (errorSpan) errorSpan.textContent = 'Please enter a valid email address.';
        return;
      }
    }

    if (input.hasAttribute('minlength') && input.value) {
      const min = parseInt(input.getAttribute('minlength'), 10);
      if (input.value.length < min) {
        isValid = false;
        input.classList.add('input-error');
        if (errorSpan) errorSpan.textContent = `Must be at least ${min} characters.`;
        return;
      }
    }
  });

  return isValid;
}

// --- 8. Robust Image Resolver ---
export function getItemImage(item) {
  if (item && item.image_url && String(item.image_url).trim().length > 5) {
    return item.image_url;
  }
  const cat = String(item?.category_name || item?.category || '').toLowerCase();
  if (cat.includes('electr') || cat.includes('phone') || cat.includes('laptop') || cat.includes('headphone')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('doc') || cat.includes('id') || cat.includes('card') || cat.includes('paper')) {
    return 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('access') || cat.includes('watch') || cat.includes('bottle') || cat.includes('bag') || cat.includes('wallet')) {
    return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('cloth') || cat.includes('wear') || cat.includes('jacket') || cat.includes('hoodie') || cat.includes('shirt')) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('book') || cat.includes('station') || cat.includes('pen') || cat.includes('textbook')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';
}

// --- 9. Profile Dropdown Toggle ---
export function toggleProfileMenu(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const menu = document.getElementById('profile-dropdown-menu');
  const trigger = document.getElementById('profile-dropdown-trigger');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    menu.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  } else {
    menu.classList.add('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
}

if (typeof window !== 'undefined') {
  window.toggleProfileMenu = toggleProfileMenu;

  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.profile-dropdown-container');
    if (dropdown && !dropdown.contains(e.target)) {
      const menu = document.getElementById('profile-dropdown-menu');
      const trigger = document.getElementById('profile-dropdown-trigger');
      if (menu) menu.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

