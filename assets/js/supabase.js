/* ==========================================================================
   CENTRALIZED SUPABASE CLIENT & LOCAL STORAGE DATABASE ENGINE
   ========================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from './config.js';

let supabaseClient = null;

try {
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && !CONFIG.SUPABASE_URL.includes("YOUR_SUPABASE")) {
    supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase SDK initialization notice - operating with local persistence database:", e);
}

export { supabaseClient };

/* ==========================================================================
   LOCAL DB STORAGE ENGINE FOR GUARANTEED FAULT-TOLERANT FUNCTIONALITY
   ========================================================================== */

const DB_KEYS = {
  CATEGORIES: `${CONFIG.STORAGE_PREFIX}categories`,
  LOCATIONS: `${CONFIG.STORAGE_PREFIX}locations`,
  USERS: `${CONFIG.STORAGE_PREFIX}users`,
  ITEMS: `${CONFIG.STORAGE_PREFIX}items`,
  CONTACTS: `${CONFIG.STORAGE_PREFIX}contacts`,
  ADMIN_LOGS: `${CONFIG.STORAGE_PREFIX}admin_logs`,
  NOTIFICATIONS: `${CONFIG.STORAGE_PREFIX}notifications`,
  MESSAGES: `${CONFIG.STORAGE_PREFIX}messages`,
  DELETED_ITEMS: `${CONFIG.STORAGE_PREFIX}deleted_items`,
  SESSION: `${CONFIG.STORAGE_PREFIX}session`
};

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Electronics", description: "Phones, laptops, tablets, headphones, chargers" },
  { id: 2, name: "Documents / ID Cards", description: "Student IDs, driver licenses, passports, folders" },
  { id: 3, name: "Accessories", description: "Watches, jewelry, sunglasses, bags, wallets" },
  { id: 4, name: "Clothing", description: "Jackets, coats, hoodies, caps, shoes" },
  { id: 5, name: "Stationery / Books", description: "Textbooks, notebooks, pens, calculators" },
  { id: 6, name: "Other", description: "Miscellaneous campus items" }
];

const DEFAULT_LOCATIONS = [
  { id: 1, name: "Library", building_code: "LIB-MAIN" },
  { id: 2, name: "Canteen", building_code: "SC-FOOD" },
  { id: 3, name: "Hostel", building_code: "RES-BLOCK" },
  { id: 4, name: "Classrooms", building_code: "ACAD-BLDG" },
  { id: 5, name: "Sports Complex", building_code: "GYM-ATH" },
  { id: 6, name: "Other", building_code: "CAMPUS-WIDE" }
];

const DEFAULT_USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@gmail.com",
    password: "admin12345",
    full_name: "Admin Moderator",
    phone: "555-0199",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "11111111-1111-1111-1111-111111111112",
    email: "admin@lostfound.edu",
    password: "admin12345",
    full_name: "Admin Moderator",
    phone: "555-0199",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "student@lostfound.edu",
    password: "student123",
    full_name: "Alex Johnson",
    phone: "555-0142",
    role: "student",
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "sam@lostfound.edu",
    password: "student123",
    full_name: "Sam Wilson",
    phone: "555-0188",
    role: "student",
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_ITEMS = [];

function initLocalStorage() {
  if (!localStorage.getItem(DB_KEYS.CATEGORIES)) {
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(DB_KEYS.LOCATIONS)) {
    localStorage.setItem(DB_KEYS.LOCATIONS, JSON.stringify(DEFAULT_LOCATIONS));
  }
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    const existingUsers = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
    let updated = false;
    DEFAULT_USERS.forEach(defUser => {
      if (!existingUsers.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
        existingUsers.push(defUser);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(existingUsers));
    }
  }
  if (!localStorage.getItem(DB_KEYS.ITEMS)) {
    localStorage.setItem(DB_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
  } else {
    // Scrub stock image URLs from local database cache
    try {
      const storedItems = JSON.parse(localStorage.getItem(DB_KEYS.ITEMS) || '[]');
      if (Array.isArray(storedItems)) {
        let modified = false;
        storedItems.forEach(item => {
          if (item.image_url && item.image_url.includes('unsplash.com')) {
            item.image_url = '';
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem(DB_KEYS.ITEMS, JSON.stringify(storedItems));
        }
      }
    } catch (e) {}
  }
  if (!localStorage.getItem(DB_KEYS.CONTACTS)) {
    localStorage.setItem(DB_KEYS.CONTACTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.ADMIN_LOGS)) {
    localStorage.setItem(DB_KEYS.ADMIN_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.MESSAGES)) {
    localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.DELETED_ITEMS)) {
    localStorage.setItem(DB_KEYS.DELETED_ITEMS, JSON.stringify([]));
  }
}

initLocalStorage();

export const LocalDB = {
  getCollection(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  saveCollection(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  },
  
  // Categories & Locations
  getCategories() { return this.getCollection(DB_KEYS.CATEGORIES); },
  getLocations() { return this.getCollection(DB_KEYS.LOCATIONS); },

  // Auth & Users
  getUsers() { return this.getCollection(DB_KEYS.USERS); },
  getUserById(id) { return this.getUsers().find(u => u.id === id); },
  getUserByEmail(email) { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); },
  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    this.saveCollection(DB_KEYS.USERS, users);
    return user;
  },

  // Session
  getCurrentSession() {
    const sess = localStorage.getItem(DB_KEYS.SESSION);
    return sess ? JSON.parse(sess) : null;
  },
  setCurrentSession(user) {
    if (!user) localStorage.removeItem(DB_KEYS.SESSION);
    else localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
  },

  // Items
  getItems() {
    const items = this.getCollection(DB_KEYS.ITEMS);
    const deletedIds = this.getCollection(DB_KEYS.DELETED_ITEMS).map(id => String(id));
    const cats = this.getCategories();
    const locs = this.getLocations();
    const users = this.getUsers();

    return items
      .filter(item => !deletedIds.includes(String(item.id)))
      .map(item => ({
        ...item,
        category_name: item.category || cats.find(c => c.id == item.category_id)?.name || 'Other',
        location_name: item.location || locs.find(l => l.id == item.location_id)?.name || 'Other',
        owner: users.find(u => u.id === item.user_id) || { full_name: 'Campus User', email: '' }
      }));
  },
  getItemById(id) {
    return this.getItems().find(i => String(i.id) === String(id));
  },
  async saveItem(itemData) {
    const items = this.getCollection(DB_KEYS.ITEMS);
    const newItem = {
      id: itemData.id || Date.now(),
      created_at: itemData.created_at || new Date().toISOString(),
      status: itemData.status || 'active',
      reported_date: itemData.reported_date || new Date().toISOString().split('T')[0],
      ...itemData
    };

    // 1. Save to local storage cache immediately
    const idx = items.findIndex(i => String(i.id) === String(newItem.id));
    if (idx >= 0) items[idx] = newItem;
    else items.unshift(newItem);
    this.saveCollection(DB_KEYS.ITEMS, items);

    // 2. Sync to Supabase remote database
    if (supabaseClient) {
      try {
        const dbPayload = {
          title: newItem.title,
          description: newItem.description || '',
          category: newItem.category_name || newItem.category || 'Other',
          category_id: newItem.category_id || null,
          location: newItem.location_name || newItem.location || 'Campus',
          location_id: newItem.location_id || null,
          item_type: newItem.item_type || 'lost',
          reported_date: newItem.reported_date,
          color: newItem.color || '',
          distinguishing_features: newItem.distinguishing_features || '',
          status: newItem.status || 'active'
        };

        if (newItem.user_id && typeof newItem.user_id === 'string' && newItem.user_id.includes('-') && newItem.user_id.length > 20) {
          dbPayload.user_id = newItem.user_id;
        }

        const { data: insertedData, error: insertError } = await supabaseClient
          .from('items')
          .insert([dbPayload])
          .select();

        let remoteItem = null;
        if (!insertError && insertedData && insertedData[0]) {
          remoteItem = insertedData[0];
        } else if (insertError) {
          console.warn("Notice: Supabase insert attempt notice:", insertError);
          if (dbPayload.user_id) {
            delete dbPayload.user_id;
            const { data: retryData } = await supabaseClient.from('items').insert([dbPayload]).select().catch(() => ({ data: null }));
            if (retryData && retryData[0]) remoteItem = retryData[0];
          }
        }

        if (newItem.image_url && remoteItem && remoteItem.id) {
          await supabaseClient.from('images').insert([{
            item_id: remoteItem.id,
            image_url: newItem.image_url,
            is_primary: true
          }]).catch(e => console.warn("Supabase images table insert notice:", e));
        }

        if (remoteItem && remoteItem.id) {
          newItem.id = remoteItem.id;
          const updatedItems = this.getCollection(DB_KEYS.ITEMS);
          const uIdx = updatedItems.findIndex(i => String(i.id) === String(newItem.id) || i.title === newItem.title);
          if (uIdx >= 0) {
            updatedItems[uIdx] = { ...updatedItems[uIdx], ...newItem };
            this.saveCollection(DB_KEYS.ITEMS, updatedItems);
          }
        }
      } catch (err) {
        console.warn("Supabase item sync exception:", err);
      }
    }

    return newItem;
  },
  async deleteItem(id) {
    const items = this.getCollection(DB_KEYS.ITEMS).filter(i => String(i.id) !== String(id));
    this.saveCollection(DB_KEYS.ITEMS, items);

    const deleted = this.getCollection(DB_KEYS.DELETED_ITEMS);
    if (!deleted.includes(String(id))) {
      deleted.push(String(id));
      this.saveCollection(DB_KEYS.DELETED_ITEMS, deleted);
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from('items').delete().eq('id', id);
        await supabaseClient.from('images').delete().eq('item_id', id).catch(() => {});
        await supabaseClient.from('contacts').delete().eq('item_id', id).catch(() => {});
      } catch (e) {
        console.warn("Supabase item delete notice:", e);
      }
    }
  },

  // Contacts / Claims
  getContacts() {
    const contacts = this.getCollection(DB_KEYS.CONTACTS);
    const items = this.getItems();
    const users = this.getUsers();
    return contacts.map(c => ({
      ...c,
      item: items.find(i => String(i.id) === String(c.item_id)),
      claimer: users.find(u => u.id === c.interested_user_id)
    }));
  },
  getClaims() {
    return this.getContacts();
  },
  saveContact(contactData) {
    const contacts = this.getCollection(DB_KEYS.CONTACTS);
    const newContact = {
      id: contactData.id || Date.now(),
      status: contactData.status || 'pending',
      created_at: new Date().toISOString(),
      ...contactData
    };
    const idx = contacts.findIndex(c => String(c.id) === String(newContact.id));
    if (idx >= 0) contacts[idx] = newContact;
    else contacts.unshift(newContact);
    this.saveCollection(DB_KEYS.CONTACTS, contacts);
    return newContact;
  },
  saveClaim(claimData) {
    return this.saveContact({
      item_id: claimData.item_id,
      interested_user_id: claimData.claimer_id,
      contact_message: claimData.proof_description,
      status: claimData.status || 'pending'
    });
  },
  updateClaimStatus(claimId, status, adminNotes = '') {
    const contacts = this.getCollection(DB_KEYS.CONTACTS);
    const idx = contacts.findIndex(c => String(c.id) === String(claimId));
    if (idx >= 0) {
      contacts[idx].status = status;
      contacts[idx].admin_notes = adminNotes;
      contacts[idx].response_date = new Date().toISOString();

      if (status === 'approved' || status === 'verified' || status === 'accepted') {
        const items = this.getCollection(DB_KEYS.ITEMS);
        const itemIdx = items.findIndex(i => String(i.id) === String(contacts[idx].item_id));
        if (itemIdx >= 0) {
          items[itemIdx].status = 'returned';
          this.saveCollection(DB_KEYS.ITEMS, items);
        }
      }
      this.saveCollection(DB_KEYS.CONTACTS, contacts);
    }
  },

  // Admin Logs & Actions
  getAdminLogs() {
    return this.getCollection(DB_KEYS.ADMIN_LOGS);
  },
  saveAdminLog(logData) {
    const logs = this.getCollection(DB_KEYS.ADMIN_LOGS);
    const newLog = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...logData
    };
    logs.unshift(newLog);
    this.saveCollection(DB_KEYS.ADMIN_LOGS, logs);
    return newLog;
  },

  // Notifications
  getNotifications(userId = null) {
    const notes = this.getCollection(DB_KEYS.NOTIFICATIONS);
    if (!userId) return notes;
    return notes.filter(n => String(n.user_id) === String(userId));
  },
  createNotification(userId, title, message, type = 'info', itemId = null) {
    const notes = this.getCollection(DB_KEYS.NOTIFICATIONS);
    const newNote = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title,
      message,
      type,
      item_id: itemId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notes.unshift(newNote);
    this.saveCollection(DB_KEYS.NOTIFICATIONS, notes);
    return newNote;
  },
  markNotificationRead(id) {
    const notes = this.getCollection(DB_KEYS.NOTIFICATIONS);
    const idx = notes.findIndex(n => String(n.id) === String(id));
    if (idx >= 0) {
      notes[idx].is_read = true;
      this.saveCollection(DB_KEYS.NOTIFICATIONS, notes);
    }
  },

  // Messaging Service
  getMessages(itemId, userId1, userId2) {
    const msgs = this.getCollection(DB_KEYS.MESSAGES);
    return msgs.filter(m => 
      String(m.item_id) === String(itemId) &&
      ((String(m.sender_id) === String(userId1) && String(m.receiver_id) === String(userId2)) ||
       (String(m.sender_id) === String(userId2) && String(m.receiver_id) === String(userId1)))
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  getUserConversations(userId) {
    const msgs = this.getCollection(DB_KEYS.MESSAGES);
    const items = this.getItems();
    const users = this.getUsers();

    const userMsgs = msgs.filter(m => String(m.sender_id) === String(userId) || String(m.receiver_id) === String(userId));
    
    const convMap = new Map();
    userMsgs.forEach(m => {
      const otherId = String(m.sender_id) === String(userId) ? m.receiver_id : m.sender_id;
      const key = `${m.item_id}_${otherId}`;
      if (!convMap.has(key) || new Date(m.created_at) > new Date(convMap.get(key).created_at)) {
        const item = items.find(i => String(i.id) === String(m.item_id)) || { title: 'Campus Item' };
        const otherUser = users.find(u => String(u.id) === String(otherId)) || { full_name: 'Campus User', email: '' };
        convMap.set(key, {
          key,
          item_id: m.item_id,
          item_title: item.title,
          other_user_id: otherId,
          other_user_name: otherUser.full_name || otherUser.email,
          last_message: m.message,
          last_message_time: m.created_at,
          unread: !m.is_read && String(m.receiver_id) === String(userId)
        });
      }
    });

    return Array.from(convMap.values()).sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
  },

  sendMessage({ item_id, sender_id, sender_name, receiver_id, message }) {
    const msgs = this.getCollection(DB_KEYS.MESSAGES);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item_id,
      sender_id,
      sender_name: sender_name || 'Campus User',
      receiver_id,
      message,
      created_at: new Date().toISOString(),
      is_read: false
    };
    msgs.push(newMsg);
    this.saveCollection(DB_KEYS.MESSAGES, msgs);

    // Create notification for receiver
    const item = this.getItemById(item_id) || { title: 'an item' };
    this.createNotification(
      receiver_id,
      'New Direct Message',
      `${sender_name || 'A user'} sent you a message regarding "${item.title}": "${message.length > 40 ? message.substring(0, 40) + '...' : message}"`,
      'info',
      item_id
    );

    return newMsg;
  },

  markMessagesRead(itemId, senderId, receiverId) {
    const msgs = this.getCollection(DB_KEYS.MESSAGES);
    let updated = false;
    msgs.forEach(m => {
      if (String(m.item_id) === String(itemId) && String(m.sender_id) === String(senderId) && String(m.receiver_id) === String(receiverId)) {
        m.is_read = true;
        updated = true;
      }
    });
    if (updated) this.saveCollection(DB_KEYS.MESSAGES, msgs);
  }
};

/* ==========================================================================
   DIRECT SUPABASE DATA OPERATIONS (WITH FALLBACK)
   ========================================================================== */

export async function fetchSupabaseItems() {
  if (supabaseClient) {
    try {
      const { data: itemsData, error: itemsError } = await supabaseClient
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!itemsError && itemsData) {
        let imageMap = new Map();
        try {
          const { data: imagesData } = await supabaseClient.from('images').select('*');
          if (imagesData && Array.isArray(imagesData)) {
            imagesData.forEach(img => {
              if (img.item_id && img.image_url) {
                if (!imageMap.has(String(img.item_id)) || img.is_primary) {
                  imageMap.set(String(img.item_id), img.image_url);
                }
              }
            });
          }
        } catch (imgErr) {
          console.warn("Notice: images table query notice:", imgErr);
        }

        const localItems = LocalDB.getCollection(DB_KEYS.ITEMS);
        const deletedIds = LocalDB.getCollection(DB_KEYS.DELETED_ITEMS).map(id => String(id));
        const itemMap = new Map();
        
        // 1. Add global remote items from Supabase
        itemsData.forEach(item => {
          if (!deletedIds.includes(String(item.id))) {
            const mappedItem = {
              status: item.status || 'active',
              category_name: item.category || 'Other',
              location_name: item.location || 'Campus',
              ...item,
              image_url: item.image_url || imageMap.get(String(item.id)) || ''
            };
            itemMap.set(String(item.id), mappedItem);
          }
        });

        // 2. Background sync any local-only items to Supabase so all users see them
        for (const localItem of localItems) {
          if (localItem && localItem.title && !deletedIds.includes(String(localItem.id))) {
            const existsRemote = itemsData.some(r => String(r.id) === String(localItem.id) || (r.title === localItem.title && String(r.description || '') === String(localItem.description || '')));
            if (!existsRemote && localItem.id && String(localItem.id).length > 10) {
              try {
                const dbPayload = {
                  title: localItem.title,
                  description: localItem.description || '',
                  category: localItem.category_name || localItem.category || 'Other',
                  category_id: localItem.category_id || null,
                  location: localItem.location_name || localItem.location || 'Campus',
                  location_id: localItem.location_id || null,
                  item_type: localItem.item_type || 'lost',
                  reported_date: localItem.reported_date || new Date().toISOString().split('T')[0],
                  color: localItem.color || '',
                  distinguishing_features: localItem.distinguishing_features || '',
                  image_url: localItem.image_url || '',
                  status: localItem.status || 'active'
                };
                const { data: synced } = await supabaseClient.from('items').insert([dbPayload]).select();
                if (synced && synced[0]) {
                  const sItem = {
                    ...synced[0],
                    category_name: synced[0].category || localItem.category_name,
                    location_name: synced[0].location || localItem.location_name,
                    image_url: localItem.image_url || ''
                  };
                  itemMap.set(String(synced[0].id), sItem);
                }
              } catch (syncErr) {
                console.warn("Background item sync notice:", syncErr);
              }
            }
          }
        }

        const merged = Array.from(itemMap.values());
        LocalDB.saveCollection(DB_KEYS.ITEMS, merged);
        return LocalDB.getItems();
      }
    } catch (err) {
      console.warn("Supabase fetch notice, using local cache:", err);
    }
  }
  return LocalDB.getItems();
}

export async function fetchSupabaseUsers() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const localUsers = LocalDB.getUsers();
        const userMap = new Map();
        data.forEach(u => userMap.set(String(u.id), u));
        localUsers.forEach(u => {
          const remote = userMap.get(String(u.id));
          if (!remote) userMap.set(String(u.id), u);
          else userMap.set(String(u.id), { ...remote, ...u });
        });
        const merged = Array.from(userMap.values());
        LocalDB.saveCollection(DB_KEYS.USERS, merged);
        return LocalDB.getUsers();
      }
    } catch (err) {
      console.warn("Supabase users notice:", err);
    }
  }
  return LocalDB.getUsers();
}

export async function fetchSupabaseContacts() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('contacts').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const localContacts = LocalDB.getCollection(DB_KEYS.CONTACTS);
        const contactMap = new Map();
        data.forEach(c => contactMap.set(String(c.id), c));
        localContacts.forEach(c => {
          const remote = contactMap.get(String(c.id));
          if (!remote) contactMap.set(String(c.id), c);
          else contactMap.set(String(c.id), { ...remote, ...c });
        });
        const merged = Array.from(contactMap.values());
        LocalDB.saveCollection(DB_KEYS.CONTACTS, merged);
        return LocalDB.getContacts();
      }
    } catch (err) {
      console.warn("Supabase contacts notice:", err);
    }
  }
  return LocalDB.getContacts();
}

export async function fetchSupabaseCategories() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('categories').select('*');
      if (!error && data && data.length > 0) {
        LocalDB.saveCollection(DB_KEYS.CATEGORIES, data);
        return data;
      }
    } catch (err) {
      console.warn("Supabase categories notice:", err);
    }
  }
  return LocalDB.getCategories();
}

export async function fetchSupabaseLocations() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('locations').select('*');
      if (!error && data && data.length > 0) {
        LocalDB.saveCollection(DB_KEYS.LOCATIONS, data);
        return data;
      }
    } catch (err) {
      console.warn("Supabase locations notice:", err);
    }
  }
  return LocalDB.getLocations();
}
