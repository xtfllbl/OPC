// OPC_ATTD: Android Status Bar Controller
(function(global) {
    'use strict';

    let statusTime = null;
    let statusWifi = null;
    let statusNetworkLabel = null;
    let statusBattery = null;
    let statusBatteryValue = null;
    let statusBatteryLevel = null;

    function updateStatusTime() {
        if (!statusTime) return;
        statusTime.textContent = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date());
    }

    function updateConnectionStatus() {
        const isOnline = navigator.onLine;
        if (statusWifi) {
            statusWifi.classList.toggle('offline', !isOnline);
            statusWifi.setAttribute('aria-label', isOnline ? 'Wi-Fi connected' : 'Network offline');
        }
        if (statusNetworkLabel) {
            statusNetworkLabel.textContent = isOnline ? '4G' : 'OFF';
            statusNetworkLabel.classList.toggle('offline', !isOnline);
        }
    }

    function renderBatteryStatus(level, charging = false) {
        const percentage = Math.max(0, Math.min(100, Math.round(level * 100)));
        if (statusBatteryValue) statusBatteryValue.textContent = String(percentage);
        if (statusBatteryLevel) statusBatteryLevel.style.width = percentage + '%';
        if (statusBattery) {
            statusBattery.classList.toggle('low', percentage <= 15 && !charging);
            statusBattery.setAttribute(
                'aria-label',
                'Battery ' + percentage + ' percent' + (charging ? ', charging' : '')
            );
        }
    }

    async function initializeAppStatusBar() {
        statusTime = document.getElementById('status-time');
        statusWifi = document.getElementById('status-wifi');
        statusNetworkLabel = document.getElementById('status-network-label');
        statusBattery = document.getElementById('status-battery');
        statusBatteryValue = document.getElementById('status-battery-value');
        statusBatteryLevel = document.getElementById('status-battery-level');

        updateStatusTime();
        setInterval(updateStatusTime, 1000);

        updateConnectionStatus();
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);

        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const updateBattery = () => renderBatteryStatus(battery.level, battery.charging);
                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            } catch (error) {
                renderBatteryStatus(0.87);
            }
        } else {
            renderBatteryStatus(0.87);
        }
    }

    global.StatusBar = {
        init: initializeAppStatusBar,
        updateTime: updateStatusTime,
        updateConnection: updateConnectionStatus,
        renderBattery: renderBatteryStatus
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAppStatusBar);
    } else {
        initializeAppStatusBar();
    }
})(window);
