// Items Management
let editingItemId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const itemForm = document.getElementById('item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemPriceInput = document.getElementById('item-price');
    const itemCategoryInput = document.getElementById('item-category');
    const itemImageInput = document.getElementById('item-image');
    const itemImageUrlInput = document.getElementById('item-image-url');
    const loadImageUrlBtn = document.getElementById('load-image-url');
    const imagePreview = document.getElementById('image-preview');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');

    // Wait for database to initialize
    await db.init();

    // Initialize demo items if database is empty
    await initializeDemoItems();

    // Load all items
    loadItems();

    // Handle image URL load
    loadImageUrlBtn.addEventListener('click', async () => {
        const imageUrl = itemImageUrlInput.value.trim();
        if (!imageUrl) {
            showMessage('Please enter an image URL', 'error');
            return;
        }

        try {
            loadImageUrlBtn.disabled = true;
            loadImageUrlBtn.textContent = '⏳ Loading...';

            // Preview the image
            const img = document.createElement('img');
            img.onload = () => {
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #27ae60';
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);

                // Clear file input when URL is used
                itemImageInput.value = '';

                loadImageUrlBtn.disabled = false;
                loadImageUrlBtn.textContent = '🖼️ Load Image from URL';
                showMessage('Image loaded successfully!', 'success');
            };
            img.onerror = () => {
                imagePreview.innerHTML = '';
                loadImageUrlBtn.disabled = false;
                loadImageUrlBtn.textContent = '🖼️ Load Image from URL';
                showMessage('Failed to load image. Please check the URL.', 'error');
            };
            img.src = imageUrl;
        } catch (error) {
            console.error('Error loading image from URL:', error);
            loadImageUrlBtn.disabled = false;
            loadImageUrlBtn.textContent = '🖼️ Load Image from URL';
            showMessage('Error loading image from URL', 'error');
        }
    });

    // Handle image upload preview
    itemImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #27ae60';
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);

                // Clear URL input when file is used
                itemImageUrlInput.value = '';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form submit
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = itemNameInput.value.trim();
        const price = parseFloat(itemPriceInput.value);
        const category = itemCategoryInput.value.trim();
        const imageFile = itemImageInput.files[0];
        const imageUrl = itemImageUrlInput.value.trim();

        if (!name || isNaN(price) || price <= 0) {
            showMessage('Please fill in all required fields correctly', 'error');
            return;
        }

        try {
            let imageBase64 = '';

            // Priority: URL > File upload > existing image (if editing)
            if (imageUrl) {
                // Convert URL to base64
                try {
                    imageBase64 = await urlToBase64(imageUrl);
                } catch (error) {
                    showMessage('Failed to load image from URL. Please check the URL and try again.', 'error');
                    return;
                }
            } else if (imageFile) {
                // Convert file to base64
                imageBase64 = await fileToBase64(imageFile);
            } else if (editingItemId) {
                // Keep existing image if editing and no new image provided
                const existingItem = await db.getItem(editingItemId);
                imageBase64 = existingItem ? existingItem.image : '';
            }

            const itemData = {
                name,
                price,
                category: category || '',
                image: imageBase64
            };

            if (editingItemId) {
                // Update existing item
                await db.updateItem(editingItemId, itemData);
                showMessage('Item updated successfully!', 'success');
            } else {
                // Add new item
                await db.addItem(itemData);
                showMessage('Item added successfully!', 'success');
            }

            // Reset form
            resetForm();
            loadItems();
        } catch (error) {
            console.error('Error saving item:', error);
            showMessage('Error saving item', 'error');
        }
    });

    // Cancel edit
    cancelBtn.addEventListener('click', () => {
        resetForm();
    });

    // Convert image URL to base64
    async function urlToBase64(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return ''; // Return empty string if image fails to load
        }
    }

    // Initialize demo items
    async function initializeDemoItems() {
        try {
            const existingItems = await db.getAllItems();
            if (existingItems.length > 0) {
                return; // Don't add demo items if items already exist
            }

            // Demo items with image URLs from free stock photo services (Unsplash)
            const demoItemsWithImages = [
                {
                    name: 'Butter Naan',
                    price: 25.00,
                    category: 'Bread',
                    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Dal Makhani',
                    price: 150.00,
                    category: 'Main Course',
                    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Paneer Tikka',
                    price: 180.00,
                    category: 'Starter',
                    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Chicken Biryani',
                    price: 220.00,
                    category: 'Main Course',
                    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Mango Lassi',
                    price: 60.00,
                    category: 'Beverage',
                    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Gulab Jamun',
                    price: 80.00,
                    category: 'Dessert',
                    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Chole Bhature',
                    price: 120.00,
                    category: 'Main Course',
                    imageUrl: 'https://images.unsplash.com/photo-1562962234-4fe8e0f38e0a?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Samosa (2 pcs)',
                    price: 40.00,
                    category: 'Snack',
                    imageUrl: 'https://images.unsplash.com/photo-1601050690777-50d61e2d5d5a?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Masala Dosa',
                    price: 90.00,
                    category: 'Breakfast',
                    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80'
                },
                {
                    name: 'Ice Cream',
                    price: 70.00,
                    category: 'Dessert',
                    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop&q=80'
                }
            ];

            console.log('Loading demo items with images...');

            // Convert images to base64 and add items
            for (const item of demoItemsWithImages) {
                let imageBase64 = '';
                try {
                    imageBase64 = await urlToBase64(item.imageUrl);
                } catch (error) {
                    console.warn(`Failed to load image for ${item.name}, using empty image`);
                }

                await db.addItem({
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    image: imageBase64
                });
            }

            console.log('Demo items initialized with images');
        } catch (error) {
            console.error('Error initializing demo items:', error);
        }
    }

    // Load all items
    async function loadItems() {
        try {
            const items = await db.getAllItems();
            displayItems(items);
        } catch (error) {
            console.error('Error loading items:', error);
            showMessage('Error loading items', 'error');
        }
    }

    // Display items in grid
    function displayItems(items) {
        const itemsGrid = document.getElementById('items-grid');

        if (items.length === 0) {
            itemsGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #7f8c8d;">No items found. Add your first item above.</p>';
            return;
        }

        itemsGrid.innerHTML = items.map(item => `
            <div class="item-card">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : '<div class="item-image" style="background-color: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 48px;">📦</div>'}
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">₹ ${item.price.toFixed(2)}</div>
                ${item.category ? `<div class="item-category">${escapeHtml(item.category)}</div>` : ''}
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="editItem(${item.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteItem(${item.id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Edit item
    window.editItem = async function (id) {
        try {
            const item = await db.getItem(id);
            if (item) {
                editingItemId = id;
                itemNameInput.value = item.name;
                itemPriceInput.value = item.price;
                itemCategoryInput.value = item.category || '';
                itemImageInput.value = '';
                itemImageUrlInput.value = ''; // Clear URL field

                if (item.image) {
                    const img = document.createElement('img');
                    img.src = item.image;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '200px';
                    img.style.borderRadius = '8px';
                    img.style.border = '2px solid #3498db';
                    imagePreview.innerHTML = '';
                    imagePreview.appendChild(img);
                } else {
                    imagePreview.innerHTML = '';
                }

                formTitle.textContent = 'Edit Item';
                cancelBtn.style.display = 'inline-block';
                itemForm.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error loading item:', error);
            showMessage('Error loading item', 'error');
        }
    };

    // Delete item
    window.deleteItem = async function (id) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            await db.deleteItem(id);
            showMessage('Item deleted successfully!', 'success');
            loadItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            showMessage('Error deleting item', 'error');
        }
    };

    // Reset form
    function resetForm() {
        editingItemId = null;
        itemForm.reset();
        imagePreview.innerHTML = '';
        formTitle.textContent = 'Add New Item';
        cancelBtn.style.display = 'none';
    }

    // Convert file to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show message
    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        itemForm.parentElement.insertBefore(messageDiv, itemForm);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});

