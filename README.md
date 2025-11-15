# Restaurant Billing System

A simple, user-friendly billing system for small restaurants built with vanilla HTML, CSS, and JavaScript. All data is stored locally in the browser using IndexedDB, so no server is required.

## Features

- **Item Management (CRUD)**: Add, edit, and delete menu items with images
- **Billing Interface**: Create bills by selecting items, managing cart, and generating invoices
- **UPI Integration**: Generate QR codes for UPI payments
- **Sales Management**: View all sales transactions with date filtering
- **Reports**: Generate and download PDF sales reports by date range
- **Settings**: Configure restaurant name, address, and UPI ID
- **Simple UI**: Large buttons, clear icons, high contrast colors - designed for easy use

## Getting Started

1. Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. No installation or server setup required
3. All data is stored locally in your browser using IndexedDB

## Usage

### First Time Setup

1. Go to **Settings** page
2. Enter your restaurant name
3. Enter your restaurant address (optional)
4. Enter your UPI ID (required for QR code generation)
5. Click "Save Settings"

### Adding Items

1. Go to **Items** page
2. Fill in the form:
   - Item name (required)
   - Price (required)
   - Category (optional)
   - Image (optional - upload from your device)
3. Click "Save Item"
4. Items will appear in the grid below

### Creating a Bill

1. Go to **Billing** page
2. Click on items to add them to cart
3. Adjust quantities using + and - buttons
4. Click "Generate Bill" when ready
5. Review the bill with UPI QR code
6. Click "Print Bill" to print
7. Click "Save Bill" to save the transaction

### Viewing Sales

1. Go to **Sales** page
2. View all saved sales
3. Filter by date using the date filter
4. Click "Show Details" to see item details
5. Click "Reprint Bill" to generate a printable bill

### Generating Reports

1. Go to **Reports** page
2. Select date range (From Date and To Date)
3. Click "Download PDF Report"
4. PDF will be automatically downloaded

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

## Data Storage

All data is stored locally in your browser using IndexedDB:
- Items are stored with images (as base64)
- Sales transactions are stored permanently
- Settings are stored for quick access

**Note**: Data is stored in the browser. If you clear browser data, all information will be lost. For backup, you can export reports regularly.

## Libraries Used

- **qrcode.js**: For generating UPI QR codes (loaded via CDN)
- **jsPDF**: For generating PDF reports (loaded via CDN)

## Support

This is a simple, standalone application. All features work offline after the initial page load.

## License

Free to use and modify.

