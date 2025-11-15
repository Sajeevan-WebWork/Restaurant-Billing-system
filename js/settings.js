// Settings Management
document.addEventListener('DOMContentLoaded', async () => {
    const settingsForm = document.getElementById('settings-form');
    const restaurantNameInput = document.getElementById('restaurant-name');
    const restaurantAddressInput = document.getElementById('restaurant-address');
    const upiIdInput = document.getElementById('upi-id');

    // Wait for database to initialize
    await db.init();

    // Load existing settings
    async function loadSettings() {
        try {
            const restaurantName = await db.getSetting('restaurantName') || '';
            const restaurantAddress = await db.getSetting('restaurantAddress') || '';
            const upiId = await db.getSetting('upiId') || '';

            restaurantNameInput.value = restaurantName;
            restaurantAddressInput.value = restaurantAddress;
            upiIdInput.value = upiId;
        } catch (error) {
            console.error('Error loading settings:', error);
            showMessage('Error loading settings', 'error');
        }
    }

    // Save settings
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const restaurantName = restaurantNameInput.value.trim();
        const restaurantAddress = restaurantAddressInput.value.trim();
        const upiId = upiIdInput.value.trim();

        if (!restaurantName || !upiId) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            await db.setSetting('restaurantName', restaurantName);
            await db.setSetting('restaurantAddress', restaurantAddress);
            await db.setSetting('upiId', upiId);

            showMessage('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('Error saving settings', 'error');
        }
    });

    // Show message
    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        settingsForm.parentElement.insertBefore(messageDiv, settingsForm);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Load settings on page load
    loadSettings();
});

