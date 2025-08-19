/**
 * IoT Integration Module for Equipment Table
 * Fetches and updates IoT data dynamically
 */

class IoTIntegration {
    constructor() {
        this.iotDataFile = 'iot_data.json';
        this.updateInterval = 30000; // 30 seconds
        this.autoUpdateEnabled = false;
    }

    /**
     * Fetch IoT data from JSON file
     */
    async fetchIoTData() {
        try {
            const response = await fetch(this.iotDataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('IoT data fetched:', data);
            return data;
        } catch (error) {
            console.error('Error fetching IoT data:', error);
            return null;
        }
    }

    /**
     * Update equipment data with IoT hours
     */
    async updateEquipmentWithIoTData(equipmentData) {
        const iotData = await this.fetchIoTData();
        if (!iotData || !iotData.equipment_mapping) {
            console.log('No IoT data available or no equipment mapping');
            return equipmentData;
        }

        // Update equipment with IoT hours based on mapping
        equipmentData.forEach(equipment => {
            const deviceId = iotData.equipment_mapping[equipment.equipmentNumber];
            if (deviceId && deviceId === iotData.device_id) {
                equipment.currentHours = iotData.current_hours;
                equipment.lastIoTUpdate = iotData.last_updated;
                console.log(`Updated equipment ${equipment.equipmentNumber} with ${iotData.current_hours} hours`);
            }
        });

        return equipmentData;
    }

    /**
     * Get IoT status for display
     */
    async getIoTStatus() {
        const iotData = await this.fetchIoTData();
        if (!iotData) {
            return {
                status: 'offline',
                message: 'IoT data unavailable',
                lastUpdate: 'Never'
            };
        }

        const lastUpdate = new Date(iotData.last_updated);
        const now = new Date();
        const timeDiff = now - lastUpdate;
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        let status = 'online';
        let message = `IoT data current (${minutesDiff} min ago)`;

        if (minutesDiff > 60) {
            status = 'stale';
            message = `IoT data stale (${Math.floor(minutesDiff / 60)}h ${minutesDiff % 60}m ago)`;
        }

        if (minutesDiff > 1440) { // 24 hours
            status = 'offline';
            message = 'IoT data very old (>24h)';
        }

        return {
            status,
            message,
            lastUpdate: lastUpdate.toLocaleString(),
            deviceId: iotData.device_id,
            currentHours: iotData.current_hours
        };
    }

    /**
     * Start auto-update of IoT data
     */
    startAutoUpdate(callback) {
        if (this.autoUpdateEnabled) {
            console.log('Auto-update already enabled');
            return;
        }

        this.autoUpdateEnabled = true;
        console.log('Starting IoT auto-update...');

        this.updateTimer = setInterval(async () => {
            if (typeof callback === 'function') {
                await callback();
            }
        }, this.updateInterval);
    }

    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
            this.autoUpdateEnabled = false;
            console.log('IoT auto-update stopped');
        }
    }

    /**
     * Manual refresh of IoT data
     */
    async refreshIoTData() {
        console.log('Manually refreshing IoT data...');
        return await this.fetchIoTData();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTIntegration;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.IoTIntegration = IoTIntegration;
}