import { Contact } from '../types';

const DB_NAME = 'VaultKeyDB';
const DB_VERSION = 2; // Incremented version to force upgrade if needed, though structure changes might require clear
const STORES = {
  CONTACTS: 'contacts',
};

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
        db.createObjectStore(STORES.CONTACTS, { keyPath: 'id' });
      }
      // Clean up old stores if they exist from previous version
      if (db.objectStoreNames.contains('directories')) {
        db.deleteObjectStore('directories');
      }
    };
  });
};

export const StorageService = {
  async init(): Promise<void> {
    await openDB();
  },

  async getAllContacts(): Promise<Contact[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONTACTS, 'readonly');
      const store = transaction.objectStore(STORES.CONTACTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveContact(contact: Contact): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONTACTS, 'readwrite');
      const store = transaction.objectStore(STORES.CONTACTS);
      const request = store.put(contact);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteContact(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONTACTS, 'readwrite');
      const store = transaction.objectStore(STORES.CONTACTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
