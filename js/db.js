// IndexedDB Database Wrapper
class Database {
    constructor() {
        this.dbName = 'RestaurantBillingDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create items store
                if (!db.objectStoreNames.contains('items')) {
                    const itemsStore = db.createObjectStore('items', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    itemsStore.createIndex('name', 'name', { unique: false });
                    itemsStore.createIndex('category', 'category', { unique: false });
                }

                // Create sales store
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    salesStore.createIndex('billNumber', 'billNumber', { unique: true });
                    salesStore.createIndex('date', 'date', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', {
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    // Add item to items store
    async addItem(item) {
        const transaction = this.db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        return new Promise((resolve, reject) => {
            const request = store.add({
                ...item,
                createdAt: new Date()
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all items
    async getAllItems() {
        const transaction = this.db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get item by ID
    async getItem(id) {
        const transaction = this.db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Update item
    async updateItem(id, item) {
        const transaction = this.db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        return new Promise((resolve, reject) => {
            const existingItem = store.get(id);
            existingItem.onsuccess = () => {
                const updateRequest = store.put({
                    ...existingItem.result,
                    ...item,
                    id: id
                });
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            existingItem.onerror = () => reject(existingItem.error);
        });
    }

    // Delete item
    async deleteItem(id) {
        const transaction = this.db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Add sale
    async addSale(sale) {
        const transaction = this.db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        return new Promise((resolve, reject) => {
            const request = store.add({
                ...sale,
                date: new Date()
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all sales
    async getAllSales() {
        const transaction = this.db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                // Sort by date descending (newest first)
                const sales = request.result.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                resolve(sales);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get sale by ID
    async getSale(id) {
        const transaction = this.db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get sales by date range
    async getSalesByDateRange(fromDate, toDate) {
        const allSales = await this.getAllSales();
        return allSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= fromDate && saleDate <= toDate;
        });
    }

    // Get setting
    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Set setting
    async setSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get all settings
    async getAllSettings() {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global database instance
const db = new Database();

// Initialize database when script loads
db.init().catch(error => {
    console.error('Database initialization error:', error);
});

