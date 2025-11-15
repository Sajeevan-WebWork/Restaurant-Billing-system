// Billing Interface
let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
    const itemsGridBilling = document.getElementById('items-grid-billing');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const clearCartBtn = document.getElementById('clear-cart');
    const generateBillBtn = document.getElementById('generate-bill');
    const billModal = document.getElementById('bill-modal');
    const closeBillBtn = document.getElementById('close-bill');
    const saveBillBtn = document.getElementById('save-bill');
    const printBillBtn = document.getElementById('print-bill');

    // Wait for database to initialize
    await db.init();

    // Load items
    loadItems();

    // Clear cart
    clearCartBtn.addEventListener('click', () => {
        cart = [];
        updateCart();
    });

    // Generate bill
    generateBillBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is empty. Please add items to cart.');
            return;
        }
        showBill();
    });

    // Close bill modal
    closeBillBtn.addEventListener('click', () => {
        billModal.style.display = 'none';
    });

    // Save bill
    saveBillBtn.addEventListener('click', async () => {
        await saveBill();
    });

    // Print bill
    printBillBtn.addEventListener('click', () => {
        window.print();
    });

    // Load items from database
    async function loadItems() {
        try {
            const items = await db.getAllItems();
            displayItems(items);
        } catch (error) {
            console.error('Error loading items:', error);
            alert('Error loading items');
        }
    }

    // Display items in grid
    function displayItems(items) {
        if (items.length === 0) {
            itemsGridBilling.innerHTML = '<p style="text-align: center; padding: 40px; color: #7f8c8d;">No items available. Please add items first.</p>';
            return;
        }

        itemsGridBilling.innerHTML = items.map(item => `
            <div class="item-card-billing" onclick="addToCart(${item.id}, '${escapeHtml(item.name)}', ${item.price}, '${item.image ? escapeHtml(item.image) : ''}')">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : '<div class="item-image" style="background-color: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 36px;">📦</div>'}
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">₹ ${item.price.toFixed(2)}</div>
            </div>
        `).join('');
    }

    // Add item to cart
    window.addToCart = function(id, name, price, image) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price,
                image,
                quantity: 1
            });
        }
        updateCart();
    };

    // Update cart display
    function updateCart() {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">No items in cart</p>';
            cartTotal.textContent = '₹ 0.00';
            return;
        }

        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                    </div>
                    <div class="cart-item-price">₹ ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `₹ ${total.toFixed(2)}`;
    }

    // Remove from cart
    window.removeFromCart = function(id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    };

    // Increase quantity
    window.increaseQuantity = function(id) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += 1;
            updateCart();
        }
    };

    // Decrease quantity
    window.decreaseQuantity = function(id) {
        const item = cart.find(item => item.id === id);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                cart = cart.filter(cartItem => cartItem.id !== id);
            }
            updateCart();
        }
    };

    // Show bill
    async function showBill() {
        const restaurantName = await db.getSetting('restaurantName') || 'Restaurant Name';
        const restaurantAddress = await db.getSetting('restaurantAddress') || '';
        const upiId = await db.getSetting('upiId') || '';

        if (!upiId) {
            alert('Please set UPI ID in Settings first.');
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const billNumber = generateBillNumber();
        const now = new Date();

        // Update bill header
        document.getElementById('restaurant-name').textContent = restaurantName;
        document.getElementById('restaurant-address').textContent = restaurantAddress;
        document.getElementById('bill-number').textContent = billNumber;
        document.getElementById('bill-date').textContent = formatDate(now);
        document.getElementById('display-upi-id').textContent = `UPI ID: ${upiId}`;

        // Update bill items
        const billItemsDiv = document.getElementById('bill-items');
        billItemsDiv.innerHTML = cart.map(item => `
            <div class="bill-item">
                <div class="bill-item-name">${escapeHtml(item.name)} x ${item.quantity}</div>
                <div class="bill-item-details">
                    <div>₹ ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        // Update total
        document.getElementById('bill-total-amount').textContent = `₹ ${total.toFixed(2)}`;

        // Generate QR code
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${total.toFixed(2)}&cu=INR`;
        const qrCodeDiv = document.getElementById('upi-qr-code');
        qrCodeDiv.innerHTML = '';
        
        new QRCode(qrCodeDiv, {
            text: upiString,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // Store bill data for saving
        billModal.dataset.billNumber = billNumber;
        billModal.dataset.total = total;
        billModal.dataset.date = now.toISOString();

        // Show modal
        billModal.style.display = 'flex';
    }

    // Save bill
    async function saveBill() {
        try {
            const billNumber = billModal.dataset.billNumber;
            const total = parseFloat(billModal.dataset.total);
            const date = billModal.dataset.date;

            await db.addSale({
                billNumber,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount: total,
                date: new Date(date)
            });

            alert('Bill saved successfully!');
            
            // Clear cart
            cart = [];
            updateCart();
            
            // Close modal
            billModal.style.display = 'none';
        } catch (error) {
            console.error('Error saving bill:', error);
            alert('Error saving bill. Please try again.');
        }
    }

    // Generate unique bill number
    function generateBillNumber() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        return `BILL-${dateStr}-${timeStr}`;
    }

    // Format date
    function formatDate(date) {
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

