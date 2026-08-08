/* ==========================================================================
   ADMIN DASHBOARD & MODERATION CONTROLLER
   ========================================================================== */

import { 
  LocalDB, 
  supabaseClient, 
  fetchSupabaseItems, 
  fetchSupabaseUsers, 
  fetchSupabaseContacts 
} from '../assets/js/supabase.js';
import { initTheme, toggleTheme, showToast, formatDate, escapeHTML, toggleProfileMenu } from '../assets/js/utils.js';
import { checkAuthGuard, handleLogout } from '../auth/auth.js';

window.toggleTheme = toggleTheme;
window.handleLogout = handleLogout;
window.toggleProfileMenu = toggleProfileMenu;

let currentUser = null;
let currentItems = [];
let currentUsers = [];
let currentClaims = [];

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  currentUser = checkAuthGuard('admin');
  if (!currentUser) return;

  renderAdminInfo();
  await loadAllAdminData();
  setupTabs();
});

function renderAdminInfo() {
  if (!currentUser) return;
  const nameStr = currentUser.full_name || currentUser.email || 'Admin';
  const initialStr = nameStr.charAt(0).toUpperCase();

  const el = document.getElementById('admin-user-name');
  const avatarEl = document.getElementById('nav-user-avatar');
  const dropdownNameEl = document.getElementById('dropdown-user-name');
  const dropdownRoleEl = document.getElementById('dropdown-user-role');

  if (el) el.textContent = nameStr;
  if (avatarEl) avatarEl.textContent = initialStr;
  if (dropdownNameEl) dropdownNameEl.textContent = nameStr;
  if (dropdownRoleEl) dropdownRoleEl.textContent = currentUser.email || 'Administrator';
}

// 1. MASTER ASYNC DATA LOAD FROM SUPABASE
async function loadAllAdminData() {
  try {
    currentUsers = await fetchSupabaseUsers();
    currentItems = await fetchSupabaseItems();
    currentClaims = await fetchSupabaseContacts();

    renderAnalytics();
    renderModerationTable();
    renderUserManagementTable();
    renderClaimsModerationTable();
  } catch (err) {
    console.error("Error loading admin data from Supabase:", err);
  }
}

// 2. ANALYTICS ENGINE
function renderAnalytics() {
  const totalItems = currentItems.length;
  const activeItems = currentItems.filter(i => i.status === 'active').length;
  const returnedItems = currentItems.filter(i => i.status === 'returned').length;
  const lostCount = currentItems.filter(i => i.item_type === 'lost').length;
  const foundCount = currentItems.filter(i => i.item_type === 'found').length;
  const totalUsers = currentUsers.length;
  const totalClaims = currentClaims.length;

  document.getElementById('metric-total-items').textContent = totalItems;
  document.getElementById('metric-active-items').textContent = activeItems;
  document.getElementById('metric-returned-items').textContent = returnedItems;
  document.getElementById('metric-users').textContent = totalUsers;
  document.getElementById('metric-claims').textContent = totalClaims;

  const ratio = foundCount > 0 ? (lostCount / foundCount).toFixed(1) : lostCount;
  document.getElementById('metric-ratio').textContent = `${ratio} : 1`;
}

// 3. REPORT MODERATION TABLE
function renderModerationTable() {
  const tbody = document.getElementById('moderation-table-body');
  if (!tbody) return;

  if (currentItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No reports found.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentItems.map(item => `
    <tr>
      <td>
        <div class="font-medium">${escapeHTML(item.title)}</div>
        <div class="text-xs text-muted">ID: ${item.id}</div>
      </td>
      <td>
        <span class="badge ${item.item_type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.item_type}</span>
      </td>
      <td>${escapeHTML(item.category_name || item.category || 'Category')} / ${escapeHTML(item.location_name || item.location || 'Location')}</td>
      <td>${escapeHTML(item.owner?.full_name || 'Campus User')}</td>
      <td>
        <span class="badge badge-neutral">${item.status}</span>
      </td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-outline btn-sm" onclick="adminDeletePost('${item.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.adminDeletePost = async (id) => {
  if (confirm('Admin Action: Delete this report permanently?')) {
    LocalDB.deleteItem(id);
    currentItems = LocalDB.getItems();
    renderAnalytics();
    renderModerationTable();
    showToast('Report deleted by moderator.', 'success');
  }
};

// 4. USER MANAGEMENT TABLE (ALL SUPABASE USERS)
function renderUserManagementTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (currentUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No registered users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentUsers.map(user => `
    <tr>
      <td>
        <div class="font-medium">${escapeHTML(user.full_name || 'User')}</div>
        <div class="text-xs text-muted">${escapeHTML(user.email || '')}</div>
      </td>
      <td><span class="badge badge-neutral">${(user.role || 'student').toUpperCase()}</span></td>
      <td>${user.phone || 'N/A'}</td>
      <td>
        <span class="badge ${user.is_active !== false ? 'badge-found' : 'badge-lost'}">
          ${user.is_active !== false ? 'Active' : 'Deactivated'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="toggleUserStatus('${user.id}')">
          ${user.is_active !== false ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  `).join('');
}

window.toggleUserStatus = async (userId) => {
  const user = currentUsers.find(u => String(u.id) === String(userId));
  if (user) {
    const newStatus = user.is_active === false ? true : false;
    user.is_active = newStatus;

    if (supabaseClient) {
      try {
        await supabaseClient.from('users').update({ is_active: newStatus }).eq('id', userId);
      } catch (e) {
        console.warn("Supabase user status update notice:", e);
      }
    }

    LocalDB.saveUser(user);
    showToast(`User status updated to ${newStatus ? 'Active' : 'Deactivated'}.`, 'info');
    await loadAllAdminData();
  }
};

// 5. CLAIMS MODERATION TABLE
function renderClaimsModerationTable() {
  const tbody = document.getElementById('claims-table-body');
  if (!tbody) return;

  if (currentClaims.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No claims submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentClaims.map(c => `
    <tr>
      <td>${escapeHTML(c.item?.title || 'Item')}</td>
      <td>${escapeHTML(c.claimer?.full_name || 'Claimer')}</td>
      <td>${escapeHTML(c.contact_message || c.proof_description || 'Proof details')}</td>
      <td><span class="badge badge-neutral">${(c.status || 'pending').toUpperCase()}</span></td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-primary btn-sm" onclick="verifyClaim('${c.id}', 'accepted')">Approve & Mark Returned</button>
          <button class="btn btn-danger btn-sm" onclick="verifyClaim('${c.id}', 'rejected')">Reject</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.verifyClaim = async (claimId, status) => {
  if (supabaseClient) {
    try {
      await supabaseClient.from('contacts').update({ status }).eq('id', claimId);
    } catch (e) {
      console.warn("Supabase claim update notice:", e);
    }
  }

  LocalDB.updateClaimStatus(claimId, status, `Moderated by ${currentUser.full_name}`);
  showToast(`Claim status updated to ${status}.`, 'success');
  await loadAllAdminData();
};

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.style.display = 'block';
    });
  });
}
