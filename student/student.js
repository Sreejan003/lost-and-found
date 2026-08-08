/* ==========================================================================
   STUDENT PORTAL MAIN CONTROLLER & COMPONENT LOGIC
   ========================================================================== */

import { LocalDB, supabaseClient, fetchSupabaseItems, fetchSupabaseCategories, fetchSupabaseLocations } from '../assets/js/supabase.js';
import { initTheme, toggleTheme, showToast, openModal, closeModal, formatDate, debounce, escapeHTML, getItemImage, toggleProfileMenu } from '../assets/js/utils.js';
import { filterItems } from '../assets/js/search.js';
import { generateAIDescription } from '../assets/js/ai-engine.js';
import { uploadItemImage } from '../assets/js/storage.js';
import { checkAuthGuard, handleLogout } from '../auth/auth.js';
import '../assets/js/cleanup-cron.js';

// Global exports for HTML inline handlers
window.toggleTheme = toggleTheme;
window.handleLogout = handleLogout;
window.toggleProfileMenu = toggleProfileMenu;

let currentUser = null;
let allItems = [];
let categories = [];
let locations = [];

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  currentUser = checkAuthGuard('student');
  if (!currentUser) return;

  renderUserNav();
  await loadReferenceData();
  await loadItemsFeed();
  setupEventListeners();
  updateNotificationBadge();
});

// Render user profile info in navbar
function renderUserNav() {
  if (!currentUser) return;
  const nameStr = currentUser.full_name || currentUser.email || 'User';
  const initialStr = nameStr.charAt(0).toUpperCase();

  const nameEl = document.getElementById('nav-user-name');
  const avatarEl = document.getElementById('nav-user-avatar');
  const dropdownNameEl = document.getElementById('dropdown-user-name');
  const dropdownRoleEl = document.getElementById('dropdown-user-role');

  if (nameEl) nameEl.textContent = nameStr;
  if (avatarEl) avatarEl.textContent = initialStr;
  if (dropdownNameEl) dropdownNameEl.textContent = nameStr;
  if (dropdownRoleEl) dropdownRoleEl.textContent = currentUser.email || (currentUser.role ? currentUser.role.toUpperCase() : 'Student');
}

// Load Categories and Locations
async function loadReferenceData() {
  categories = await fetchSupabaseCategories();
  locations = await fetchSupabaseLocations();

  populateDropdowns('select-category', categories, 'All Categories');
  populateDropdowns('select-location', locations, 'All Locations');
  populateDropdowns('modal-category', categories, 'Select Category');
  populateDropdowns('modal-location', locations, 'Select Location');
}

function populateDropdowns(elementId, items, defaultText) {
  const select = document.getElementById(elementId);
  if (!select) return;
  const isModal = elementId.startsWith('modal');
  const defaultValue = isModal ? "" : "all";
  select.innerHTML = `<option value="${defaultValue}" ${isModal ? 'disabled selected' : ''}>${defaultText}</option>` +
    items.map(item => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('');
}

// Load Items Feed
export async function loadItemsFeed() {
  const feedContainer = document.getElementById('items-feed');
  if (!feedContainer) return;

  feedContainer.innerHTML = `<div class="flex justify-center py-6" style="grid-column: 1/-1;"><span class="spinner"></span> Loading items...</div>`;

  allItems = await fetchSupabaseItems();
  applyFilters();
}

// Apply Smart Search & Filters
function applyFilters() {
  const searchQuery = document.getElementById('search-input')?.value || '';
  const categoryId = document.getElementById('select-category')?.value || 'all';
  const locationId = document.getElementById('select-location')?.value || 'all';
  const itemType = document.getElementById('select-type')?.value || 'all';

  const filtered = filterItems(allItems, { searchQuery, categoryId, locationId, itemType, status: 'active' });

  renderItemsGrid(filtered);
}

// Render Grid Cards
function renderItemsGrid(items) {
  const container = document.getElementById('items-feed');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <h3>No matching items found</h3>
        <p>Try adjusting your search query or filters.</p>
      </div>
    `;
    return;
  }

  const lostItems = items.filter(i => i.item_type === 'lost');
  const foundItems = items.filter(i => i.item_type === 'found');

  const renderCard = (item) => {
    const imgUrl = getItemImage(item);
    return `
    <article class="card card-hover flex flex-col justify-between" id="item-card-${item.id}">
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="badge ${item.item_type === 'lost' ? 'badge-lost' : 'badge-found'}">
            ${item.item_type.toUpperCase()}
          </span>
          <span class="text-xs text-muted">Date: ${formatDate(item.reported_date || item.created_at)}</span>
        </div>

        <div style="height: 180px; width: 100%; overflow: hidden; border-radius: var(--radius-sm); margin-bottom: 0.75rem; background: var(--bg-tertiary);">
          <img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(item.title)}" class="item-card-image" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';">
        </div>

        <h3 class="item-card-title mb-2">${escapeHTML(item.title)}</h3>
        <p class="text-sm text-secondary mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${escapeHTML(item.description)}
        </p>
      </div>

      <div>
        <div class="item-meta">
          <span class="item-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/></svg>
            ${escapeHTML(item.category_name)}
          </span>
          <span class="item-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21s-6-5.33-6-10a6 6 0 1112 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
            ${escapeHTML(item.location_name)}
          </span>
        </div>

        <div class="flex gap-2 mt-4">
          <a href="./item-details.html?id=${item.id}" class="btn btn-secondary btn-sm" style="flex: 1;">
            View Details
          </a>
        </div>
      </div>
    </article>
    `;
  };

  let html = '';

  if (lostItems.length > 0) {
    html += `
      <div style="grid-column: 1/-1; margin-top: 0.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;" class="flex items-center justify-between">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--accent-danger);" class="flex items-center gap-2">
          <span>🔴</span> Lost Items (${lostItems.length})
        </h2>
        <span class="text-xs text-muted">Items reported missing by campus members</span>
      </div>
      ${lostItems.map(renderCard).join('')}
    `;
  }

  if (foundItems.length > 0) {
    html += `
      <div style="grid-column: 1/-1; margin-top: 2rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;" class="flex items-center justify-between">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--accent-success);" class="flex items-center gap-2">
          <span>🟢</span> Found Items (${foundItems.length})
        </h2>
        <span class="text-xs text-muted">Items found around campus waiting to be claimed</span>
      </div>
      ${foundItems.map(renderCard).join('')}
    `;
  }

  container.innerHTML = html;
}

// Event Listeners Setup
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => applyFilters(), 300));
  }

  ['select-category', 'select-location', 'select-type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
  });

  // Post Item Modal Handlers
  const btnPost = document.getElementById('btn-post-item');
  if (btnPost) {
    btnPost.addEventListener('click', () => {
      const dateEl = document.getElementById('modal-date');
      if (dateEl) {
        const todayStr = new Date().toISOString().split('T')[0];
        dateEl.value = todayStr;
        dateEl.max = todayStr;
      }
      openModal('modal-post-item');
    });
  }

  const closeBtns = document.querySelectorAll('.modal-close, [data-close-modal]');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) closeModal(modal.id);
    });
  });

  // AI Description Generator Trigger
  const btnAI = document.getElementById('btn-generate-ai');
  if (btnAI) {
    btnAI.addEventListener('click', handleAIGeneration);
  }

  // Form Submit Post Item
  const postForm = document.getElementById('form-post-item');
  if (postForm) {
    postForm.addEventListener('submit', handlePostItemSubmit);
  }
}

// AI Description Generator Handler
export async function handleAIGeneration(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('modal-title')?.value || '';
  const itemType = document.getElementById('modal-type')?.value || 'lost';
  const categoryId = document.getElementById('modal-category')?.value;
  const locationId = document.getElementById('modal-location')?.value;
  const color = document.getElementById('modal-color')?.value || '';
  const features = document.getElementById('modal-features')?.value || '';
  const prompts = document.getElementById('modal-ai-prompt')?.value || '';

  const catName = categories.find(c => String(c.id) === String(categoryId))?.name || '';
  const locName = locations.find(l => String(l.id) === String(locationId))?.name || '';

  const btnAI = document.getElementById('btn-generate-ai');
  if (btnAI) {
    btnAI.disabled = true;
    btnAI.innerHTML = `<span class="spinner"></span> Generating AI Description...`;
  }

  try {
    const aiDesc = await generateAIDescription({
      title,
      itemType,
      category: catName,
      location: locName,
      color,
      features,
      rawPrompts: prompts
    });

  const descEl = document.getElementById('modal-description');
  if (descEl) {
    descEl.value = aiDesc;
    descEl.focus();
  }
  showToast('AI Description generated successfully!', 'success');
} catch (err) {
  console.error('AI Generation Error:', err);
  showToast('Failed to generate AI description.', 'error');
} finally {
  if (btnAI) {
    btnAI.disabled = false;
    btnAI.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Generate Description with AI`;
  }
}
}

window.handleAIGeneration = handleAIGeneration;

// Post New Item Form Submit
async function handlePostItemSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const title = document.getElementById('modal-title').value.trim();
  const description = document.getElementById('modal-description').value.trim();
  const categoryRaw = document.getElementById('modal-category').value;
  const locationRaw = document.getElementById('modal-location').value;
  const category_id = (categoryRaw && categoryRaw !== 'all') ? (isNaN(Number(categoryRaw)) ? categoryRaw : Number(categoryRaw)) : null;
  const location_id = (locationRaw && locationRaw !== 'all') ? (isNaN(Number(locationRaw)) ? locationRaw : Number(locationRaw)) : null;
  const item_type = document.getElementById('modal-type').value;
  const color = document.getElementById('modal-color').value.trim();
  const features = document.getElementById('modal-features').value.trim();
  const imageFile = document.getElementById('modal-image').files[0];

  const reported_date = document.getElementById('modal-date')?.value || new Date().toISOString().split('T')[0];
  const dateObj = new Date(reported_date);
  const now = new Date();

  if (!title || !description || category_id === null || location_id === null) {
    showToast('Please fill out all required fields (Title, Description, Category, Location).', 'error');
    return;
  }

  if (isNaN(dateObj.getTime())) {
    showToast('Please select a valid report date.', 'error');
    return;
  }

  if (dateObj > now) {
    showToast('Report date cannot be in the future.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> Submitting report...`;

  try {
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadItemImage(imageFile);
    }

    const newItem = LocalDB.saveItem({
      user_id: currentUser.id,
      title,
      description,
      category_id,
      location_id,
      item_type,
      color,
      distinguishing_features: features,
      image_url: imageUrl,
      reported_date,
      status: 'active',
      is_ai_generated: description.includes('AI') || Boolean(document.getElementById('modal-ai-prompt')?.value)
    });

    // Notify other users of match (simplified trigger)
    if (currentUser && currentUser.id) {
      LocalDB.createNotification(
        currentUser.id,
        'Item Posted',
        `Your ${item_type} item "${title}" has been successfully published.`,
        'success',
        newItem.id
      );
    }

    showToast(`New ${item_type} item reported!`, 'success');
    closeModal('modal-post-item');
    form.reset();
    await loadItemsFeed();
    updateNotificationBadge();

  } catch (err) {
    console.error("Error posting item:", err);
    const errMsg = err?.message || (typeof err === 'string' ? err : 'Unexpected error occurred.');
    showToast('Error posting item: ' + errMsg, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Publish Item</span>`;
  }
}

// Notification Badge Update
function updateNotificationBadge() {
  if (!currentUser) return;
  const notes = LocalDB.getNotifications(currentUser.id);
  const unreadCount = notes.filter(n => !n.is_read).length;
  const badgeEl = document.getElementById('unread-notes-count');
  if (badgeEl) {
    badgeEl.textContent = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  }
}
