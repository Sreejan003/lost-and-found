/* ==========================================================================
   ADVANCED FEATURE: AUTOMATED 40-DAY EXPIRATION & CLEANUP TASK
   ========================================================================== */

import { LocalDB, supabaseClient } from './supabase.js';
import { CONFIG } from './config.js';

/**
 * Sweeps the database for lost/found items older than 40 days (or past expires_at)
 * and automatically archives or deletes them.
 */
export async function runAutoCleanupTask() {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - CONFIG.AUTO_CLEANUP_DAYS * 86400000);
    
    let purgedCount = 0;

    // 1. Local Database Auto Cleanup
    const localItems = LocalDB.getCollection(`${CONFIG.STORAGE_PREFIX}items`);
    const validItems = [];

    for (const item of localItems) {
      const createdAt = new Date(item.created_at || item.reported_date);
      const isExpired = item.expires_at ? new Date(item.expires_at) < now : createdAt < cutoffDate;

      if (isExpired && item.status !== 'archived') {
        purgedCount++;
        // Auto archive expired prompt / item
      } else {
        validItems.push(item);
      }
    }

    if (purgedCount > 0) {
      LocalDB.saveCollection(`${CONFIG.STORAGE_PREFIX}items`, validItems);
      console.log(`[Auto Cleanup Task] Successfully auto-archived/deleted ${purgedCount} expired items (older than 40 days).`);
    }

    // 2. Remote Supabase Cleanup if connected
    if (supabaseClient) {
      const { data: expiredItems } = await supabaseClient
        .from('items')
        .select('id')
        .lt('created_at', cutoffDate.toISOString())
        .neq('status', 'archived');

      if (expiredItems && expiredItems.length > 0) {
        const idsToUpdate = expiredItems.map(i => i.id);
        await supabaseClient
          .from('items')
          .update({ status: 'archived' })
          .in('id', idsToUpdate);
        console.log(`[Supabase Auto Cleanup] Archived ${idsToUpdate.length} items on remote server.`);
      }
    }
  } catch (err) {
    console.error("[Auto Cleanup Task Error]:", err);
  }
}

// Automatically trigger on script load
runAutoCleanupTask();
