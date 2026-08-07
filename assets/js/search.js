/* ==========================================================================
   ADVANCED FEATURE: SMART SEARCH & MULTI-FIELD FILTER ENGINE
   ========================================================================== */

/**
 * Filter items using smart multi-field matching
 */
export function filterItems(items, { searchQuery = '', categoryId = 'all', locationId = 'all', itemType = 'all', status = 'active' }) {
  if (!Array.isArray(items)) return [];

  const query = searchQuery.trim().toLowerCase();

  return items.filter(item => {
    // 1. Status Filter
    if (status !== 'all' && item.status !== status) {
      return false;
    }

    // 2. Item Type Filter (lost / found)
    if (itemType !== 'all' && item.item_type !== itemType) {
      return false;
    }

    // 3. Category Filter
    if (categoryId !== 'all' && String(item.category_id) !== String(categoryId)) {
      return false;
    }

    // 4. Location Filter
    if (locationId !== 'all' && String(item.location_id) !== String(locationId)) {
      return false;
    }

    // 5. Smart Multi-field Search Query
    if (query) {
      const titleMatch = (item.title || '').toLowerCase().includes(query);
      const descMatch = (item.description || '').toLowerCase().includes(query);
      const colorMatch = (item.color || '').toLowerCase().includes(query);
      const categoryMatch = (item.category_name || '').toLowerCase().includes(query);
      const locationMatch = (item.location_name || '').toLowerCase().includes(query);
      const featureMatch = (item.distinguishing_features || '').toLowerCase().includes(query);

      return titleMatch || descMatch || colorMatch || categoryMatch || locationMatch || featureMatch;
    }

    return true;
  });
}
