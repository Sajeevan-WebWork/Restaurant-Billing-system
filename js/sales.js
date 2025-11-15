// Sales Management
let allSales = [];

document.addEventListener('DOMContentLoaded', async () => {
    const salesList = document.getElementById('sales-list');
    const filterDateInput = document.getElementById('filter-date');
    const applyFilterBtn = document.getElementById('apply-filter');
    const clearFilterBtn = document.getElementById('clear-filter');

    // Wait for database to initialize
    await db.init();

    // Load all sales
    loadSales();

    // Apply filter
    applyFilterBtn.addEventListener('click', () => {
        const filterDate = filterDateInput.value;
        if (filterDate) {
            filterSalesByDate(new Date(filterDate));
        } else {
            loadSales();
        }
    });

    // Clear filter
    clearFilterBtn.addEventListener('click', () => {
        filterDateInput.value = '';
        loadSales();
    });

    // Load all sales
    async function loadSales() {
        try {
            allSales = await db.getAllSales();
            displaySales(allSales);
        } catch (error) {
            console.error('Error loading sales:', error);
            salesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Error loading sales</p>';
        }
    }

    // Filter sales by date
    function filterSalesByDate(filterDate) {
        const filtered = allSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === filterDate.toDateString();
        });
        displaySales(filtered);
    }

    // Display sales
    function displaySales(sales) {
        if (sales.length === 0) {
            salesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #7f8c8d;">No sales found.</p>';
            return;
        }

        salesList.innerHTML = sales.map(sale => {
            const saleDate = new Date(sale.date);
            const detailsId = `sale-details-${sale.id}`;
            const isExpanded = document.getElementById(detailsId)?.style.display === 'block';

            return `
                <div class="sale-card">
                    <div class="sale-card-header">
                        <div>
                            <div class="sale-bill-number">${escapeHtml(sale.billNumber)}</div>
                            <div class="sale-date">${formatDate(saleDate)}</div>
                        </div>
                        <div class="sale-total">₹ ${sale.totalAmount.toFixed(2)}</div>
                    </div>
                    <div class="sale-items">
                        ${sale.items.length} item(s)
                    </div>
                    <div class="sale-actions">
                        <button class="btn btn-primary" onclick="toggleSaleDetails(${sale.id})">
                            ${isExpanded ? '👇 Hide' : '👆 Show'} Details
                        </button>
                        <button class="btn btn-success" onclick="reprintBill(${sale.id})">🖨️ Reprint Bill</button>
                    </div>
                    <div id="sale-details-${sale.id}" class="sale-details" style="display: ${isExpanded ? 'block' : 'none'};">
                        ${sale.items.map(item => `
                            <div class="sale-details-item">
                                <span>${escapeHtml(item.name)} x ${item.quantity}</span>
                                <span>₹ ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Toggle sale details
    window.toggleSaleDetails = function(id) {
        const detailsDiv = document.getElementById(`sale-details-${id}`);
        if (detailsDiv) {
            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
            // Reload to update button text
            loadSales();
        }
    };

    // Reprint bill
    window.reprintBill = async function(id) {
        try {
            const sale = await db.getSale(id);
            if (!sale) {
                alert('Sale not found');
                return;
            }

            const restaurantName = await db.getSetting('restaurantName') || 'Restaurant Name';
            const restaurantAddress = await db.getSetting('restaurantAddress') || '';
            const upiId = await db.getSetting('upiId') || '';

            // Create bill HTML
            const billWindow = window.open('', '_blank');
            billWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bill - ${sale.billNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                        .bill-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px; }
                        .bill-header h2 { margin: 0 0 10px 0; font-size: 28px; }
                        .bill-header p { margin: 5px 0; color: #666; }
                        .bill-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                        .bill-total { margin-top: 20px; padding-top: 20px; border-top: 3px solid #000; }
                        .total-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; }
                        .qr-code-container { text-align: center; margin: 30px 0; }
                        .qr-code-container canvas { border: 2px solid #000; padding: 10px; }
                        .upi-id { text-align: center; margin-top: 15px; font-weight: bold; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="bill-header">
                        <h2>${escapeHtml(restaurantName)}</h2>
                        ${restaurantAddress ? `<p>${escapeHtml(restaurantAddress)}</p>` : ''}
                        <p>Bill No: ${escapeHtml(sale.billNumber)}</p>
                        <p>Date: ${formatDate(new Date(sale.date))}</p>
                    </div>
                    <div class="bill-items">
                        ${sale.items.map(item => `
                            <div class="bill-item">
                                <div>${escapeHtml(item.name)} x ${item.quantity}</div>
                                <div>₹ ${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="bill-total">
                        <div class="total-row">
                            <span>Total Amount:</span>
                            <span>₹ ${sale.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                    ${upiId ? `
                        <div class="upi-section">
                            <h3>Pay via UPI</h3>
                            <div id="qr-code" class="qr-code-container"></div>
                            <p class="upi-id">UPI ID: ${escapeHtml(upiId)}</p>
                        </div>
                        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
                        <script>
                            const upiString = 'upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${sale.totalAmount.toFixed(2)}&cu=INR';
                            new QRCode(document.getElementById('qr-code'), {
                                text: upiString,
                                width: 200,
                                height: 200,
                                colorDark: '#000000',
                                colorLight: '#ffffff',
                                correctLevel: QRCode.CorrectLevel.H
                            });
                        </script>
                    ` : ''}
                    <div style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()">🖨️ Print</button>
                    </div>
                </body>
                </html>
            `);
            billWindow.document.close();
        } catch (error) {
            console.error('Error reprinting bill:', error);
            alert('Error reprinting bill');
        }
    };

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

