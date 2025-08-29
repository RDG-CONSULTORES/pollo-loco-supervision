// =====================================================
// TELEGRAM MINI APP INTEGRATION
// Optimizations for Telegram Web App
// =====================================================

class TelegramWebApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isInTelegram = !!this.tg;
        this.user = null;
        
        console.log('📱 Telegram Web App detection:', this.isInTelegram);
        
        if (this.isInTelegram) {
            this.initTelegramWebApp();
        }
    }

    initTelegramWebApp() {
        // Initialize Telegram Web App
        this.tg.ready();
        this.tg.expand();
        
        // Get user info
        this.user = this.tg.initDataUnsafe?.user;
        
        // Configure main button
        this.tg.MainButton.text = "Actualizar Datos";
        this.tg.MainButton.color = "#FF6B35";
        this.tg.MainButton.textColor = "#FFFFFF";
        
        // Configure back button
        this.tg.BackButton.show();
        this.tg.BackButton.onClick(() => {
            this.tg.close();
        });

        // Set theme
        this.setTelegramTheme();
        
        // Setup haptic feedback
        this.setupHapticFeedback();
        
        console.log('✅ Telegram Web App initialized:', {
            user: this.user,
            theme: this.tg.themeParams,
            platform: this.tg.platform
        });
    }

    setTelegramTheme() {
        const theme = this.tg.themeParams;
        
        if (theme.bg_color) {
            document.documentElement.style.setProperty('--telegram-bg', theme.bg_color);
        }
        
        if (theme.text_color) {
            document.documentElement.style.setProperty('--telegram-text', theme.text_color);
        }
        
        if (theme.hint_color) {
            document.documentElement.style.setProperty('--telegram-hint', theme.hint_color);
        }
        
        if (theme.button_color) {
            document.documentElement.style.setProperty('--telegram-button', theme.button_color);
        }

        // Apply Telegram theme if dark mode
        if (theme.bg_color && this.isColorDark(theme.bg_color)) {
            document.body.classList.add('telegram-dark');
        }
    }

    setupHapticFeedback() {
        // Add haptic feedback to buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn-primary, .btn-secondary, .tab, .kpi-card')) {
                this.hapticImpact('light');
            }
        });

        // Add haptic feedback to filter changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('select')) {
                this.hapticImpact('medium');
            }
        });
    }

    hapticImpact(style = 'light') {
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred(style);
        }
    }

    hapticNotification(type = 'success') {
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.notificationOccurred(type);
        }
    }

    isColorDark(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness < 128;
    }

    showMainButton(text = 'Actualizar Datos', callback = null) {
        if (!this.tg?.MainButton) return;
        
        this.tg.MainButton.text = text;
        this.tg.MainButton.show();
        
        if (callback) {
            this.tg.MainButton.onClick(callback);
        }
    }

    hideMainButton() {
        if (this.tg?.MainButton) {
            this.tg.MainButton.hide();
        }
    }

    showAlert(message) {
        if (this.tg?.showAlert) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }

    showConfirm(message, callback) {
        if (this.tg?.showConfirm) {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    sendData(data) {
        if (this.tg?.sendData) {
            this.tg.sendData(JSON.stringify(data));
        } else {
            console.log('📤 Would send to Telegram:', data);
        }
    }

    // Integration methods for dashboard
    notifyDataLoaded(stats) {
        this.hapticNotification('success');
        
        const message = `✅ Datos cargados: ${stats.locations} sucursales, ${stats.groups} grupos`;
        
        // Update main button
        this.showMainButton('📊 Ver Reportes', () => {
            this.sendData({
                action: 'request_report',
                stats: stats,
                timestamp: new Date().toISOString()
            });
        });

        console.log('📱 Telegram notified:', message);
    }

    notifyFilterApplied(filters) {
        this.hapticImpact('medium');
        
        const activeFilters = Object.entries(filters).filter(([key, value]) => value).length;
        
        if (activeFilters > 0) {
            this.showMainButton(`🔍 ${activeFilters} Filtros Activos`, () => {
                this.sendData({
                    action: 'share_filters',
                    filters: filters,
                    timestamp: new Date().toISOString()
                });
            });
        } else {
            this.showMainButton('📊 Ver Todos los Datos');
        }
    }

    notifyError(error) {
        this.hapticNotification('error');
        this.showAlert(`❌ Error: ${error}`);
    }

    // Performance optimization for mobile
    optimizeForMobile() {
        // Disable hover effects on touch devices
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        // Optimize scrolling
        document.body.style.overscrollBehavior = 'contain';
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Add touch-friendly sizing
        document.documentElement.style.setProperty('--touch-target-size', '44px');
    }

    // Telegram-specific viewport handling
    handleViewportChanges() {
        if (!this.tg) return;

        // Listen for viewport changes
        this.tg.onEvent('viewportChanged', (eventData) => {
            console.log('📱 Viewport changed:', eventData);
            
            // Recalculate map size if visible
            if (window.dashboard && dashboard.map) {
                setTimeout(() => {
                    google.maps.event.trigger(dashboard.map, 'resize');
                }, 100);
            }
        });

        // Handle theme changes
        this.tg.onEvent('themeChanged', () => {
            console.log('🎨 Theme changed');
            this.setTelegramTheme();
        });
    }
}

// =====================================================
// TELEGRAM-SPECIFIC CSS OPTIMIZATIONS
// =====================================================
function addTelegramStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Telegram Web App optimizations */
        .telegram-webapp {
            --telegram-safe-area-inset-top: env(safe-area-inset-top, 0px);
            --telegram-safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Dark theme support */
        .telegram-dark {
            --background-light: var(--telegram-bg, #1a1a1a);
            --white: var(--telegram-bg, #2a2a2a);
            --dark-gray: var(--telegram-text, #ffffff);
            --light-gray: var(--telegram-hint, #999999);
        }

        /* Touch-friendly improvements */
        .touch-device button,
        .touch-device .btn-primary,
        .touch-device .btn-secondary,
        .touch-device select {
            min-height: var(--touch-target-size, 44px);
            min-width: var(--touch-target-size, 44px);
        }

        .touch-device .tab {
            min-height: 48px;
            padding: 12px 16px;
        }

        .touch-device .kpi-card {
            padding: 20px;
            margin-bottom: 12px;
        }

        /* Reduce animations on mobile */
        .touch-device * {
            transition-duration: 0.15s !important;
        }

        /* Improve text readability on small screens */
        @media (max-width: 480px) {
            .telegram-webapp .kpi-content h3 {
                font-size: 1.6rem;
            }
            
            .telegram-webapp .chart-container h3 {
                font-size: 1.1rem;
            }
            
            .telegram-webapp .tab {
                font-size: 0.85rem;
            }
        }

        /* Telegram-specific loading improvements */
        .telegram-webapp .loading-overlay {
            backdrop-filter: blur(3px);
        }

        .telegram-webapp .loading-content {
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);
}

// =====================================================
// INITIALIZE TELEGRAM INTEGRATION
// =====================================================
let telegramWebApp;

document.addEventListener('DOMContentLoaded', () => {
    // Add Telegram styles
    addTelegramStyles();
    
    // Initialize Telegram Web App
    telegramWebApp = new TelegramWebApp();
    
    // Mark body as Telegram Web App
    if (telegramWebApp.isInTelegram) {
        document.body.classList.add('telegram-webapp');
        telegramWebApp.optimizeForMobile();
        telegramWebApp.handleViewportChanges();
    }
    
    // Make available globally
    window.telegramWebApp = telegramWebApp;
});

// Integrate with dashboard
if (typeof window !== 'undefined') {
    window.telegramWebApp = telegramWebApp;
}