// Reports Management
document.addEventListener('DOMContentLoaded', async () => {
    const reportForm = document.getElementById('report-form');
    const fromDateInput = document.getElementById('report-from-date');
    const toDateInput = document.getElementById('report-to-date');
    const reportPreview = document.getElementById('report-preview');

    // Wait for database to initialize
    await db.init();

    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    fromDateInput.value = formatDateInput(thirtyDaysAgo);
    toDateInput.value = formatDateInput(today);

    // Handle form submit
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fromDate = new Date(fromDateInput.value);
        const toDate = new Date(toDateInput.value);
        toDate.setHours(23, 59, 59, 999); // Include full end date

        if (fromDate > toDate) {
            alert('From date cannot be greater than To date');
            return;
        }

        try {
            const sales = await db.getSalesByDateRange(fromDate, toDate);
            await displayReportPreview(sales, fromDate, toDate);
            await generatePDF(sales, fromDate, toDate);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report');
        }
    });

    // Display report preview
    async function displayReportPreview(sales, fromDate, toDate) {
        const restaurantName = await db.getSetting('restaurantName') || 'Restaurant Name';
        const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

        reportPreview.innerHTML = `
            <h3>Report Summary</h3>
            <p><strong>Period:</strong> ${formatDate(fromDate)} to ${formatDate(toDate)}</p>
            <p><strong>Restaurant:</strong> ${escapeHtml(restaurantName)}</p>
            <p><strong>Total Sales:</strong> ${sales.length}</p>
            <p><strong>Total Items Sold:</strong> ${totalItems}</p>
            <p><strong>Total Revenue:</strong> ₹ ${totalSales.toFixed(2)}</p>
            <hr style="margin: 20px 0;">
            <h4>Sales Details</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${sales.length === 0 ? '<p>No sales found for this period.</p>' : sales.map(sale => `
                    <div style="padding: 10px; border-bottom: 1px solid #ddd; margin-bottom: 10px;">
                        <div><strong>Bill No:</strong> ${escapeHtml(sale.billNumber)}</div>
                        <div><strong>Date:</strong> ${formatDate(new Date(sale.date))}</div>
                        <div><strong>Items:</strong> ${sale.items.map(item => `${escapeHtml(item.name)} x ${item.quantity}`).join(', ')}</div>
                        <div><strong>Amount:</strong> ₹ ${sale.totalAmount.toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate PDF
    async function generatePDF(sales, fromDate, toDate) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const restaurantName = await db.getSetting('restaurantName') || 'Restaurant Name';
        const restaurantAddress = await db.getSetting('restaurantAddress') || '';
        const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(restaurantName, 105, yPos, { align: 'center' });
        yPos += 10;

        if (restaurantAddress) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(restaurantAddress, 105, yPos, { align: 'center' });
            yPos += 10;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Report', 105, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`, 105, yPos, { align: 'center' });
        yPos += 10;

        doc.line(10, yPos, 200, yPos);
        yPos += 10;

        // Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 10, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales: ${sales.length}`, 15, yPos);
        yPos += 7;
        doc.text(`Total Items Sold: ${totalItems}`, 15, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Revenue: ₹ ${totalSales.toFixed(2)}`, 15, yPos);
        yPos += 10;

        doc.line(10, yPos, 200, yPos);
        yPos += 10;

        // Sales details
        if (sales.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Sales Details', 10, yPos);
            yPos += 10;

            sales.forEach((sale, index) => {
                // Check if we need a new page
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. Bill No: ${sale.billNumber}`, 15, yPos);
                yPos += 7;

                doc.setFont('helvetica', 'normal');
                doc.text(`Date: ${formatDate(new Date(sale.date))}`, 20, yPos);
                yPos += 7;

                sale.items.forEach(item => {
                    doc.text(`   • ${item.name} x ${item.quantity} = ₹ ${(item.price * item.quantity).toFixed(2)}`, 20, yPos);
                    yPos += 6;
                });

                doc.setFont('helvetica', 'bold');
                doc.text(`Total: ₹ ${sale.totalAmount.toFixed(2)}`, 150, yPos - (sale.items.length * 6));
                yPos += 5;

                doc.line(15, yPos, 195, yPos);
                yPos += 8;
            });
        } else {
            doc.setFontSize(10);
            doc.text('No sales found for this period.', 15, yPos);
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
            doc.text(`Generated on: ${formatDate(new Date())}`, 10, 285);
        }

        // Save PDF
        const fileName = `Sales_Report_${formatDateInput(fromDate)}_to_${formatDateInput(toDate)}.pdf`;
        doc.save(fileName);
    }

    // Format date for input
    function formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for display
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

