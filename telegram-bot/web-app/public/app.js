// =====================================================
// EL POLLO LOCO - DASHBOARD INTERACTIVO
// Sistema completo con datos reales de supervision_operativa_clean
// =====================================================

class ElPolloLocoDashboard {
    constructor() {
        this.map = null;
        this.charts = {};
        this.currentFilters = {
            grupo: '',
            estado: '',
            trimestre: ''
        };
        this.data = {
            locations: [],
            overview: {},
            groups: [],
            areas: [],
            trends: []
        };
        
        // Google Maps API key (configurar en producción)
        this.googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
        
        this.init();
    }

    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    async init() {
        console.log('🚀 Iniciando El Pollo Loco Dashboard...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Initialize map
        this.initMap();
        
        // Initialize charts
        this.initCharts();
        
        console.log('✅ Dashboard inicializado correctamente');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filter controls
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('locationModal').addEventListener('click', (e) => {
            if (e.target.id === 'locationModal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // =====================================================
    // DATA LOADING
    // =====================================================
    async loadInitialData() {
        this.showLoading();
        
        try {
            console.log('📊 Cargando datos iniciales...');
            
            // Load filter options
            await this.loadFilterOptions();
            
            // Load main data
            await this.loadAllData();
            
            console.log('✅ Datos cargados:', {
                locations: this.data.locations.length,
                groups: this.data.groups.length,
                areas: this.data.areas.length
            });
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            this.showError('Error cargando datos del servidor');
        } finally {
            this.hideLoading();
        }
    }

    async loadFilterOptions() {
        try {
            // Load groups
            const groupsResponse = await fetch('/api/filters/groups');
            const groups = await groupsResponse.json();
            this.populateSelect('grupoFilter', groups.map(g => ({ value: g.name, text: g.name })));

            // Load states
            const statesResponse = await fetch('/api/filters/states');
            const states = await statesResponse.json();
            this.populateSelect('estadoFilter', states.map(s => ({ value: s.name, text: s.name })));

        } catch (error) {
            console.error('Error cargando opciones de filtros:', error);
        }
    }

    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        const currentOptions = Array.from(select.options).slice(1); // Keep first option
        currentOptions.forEach(option => option.remove());
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            select.appendChild(optionElement);
        });
    }

    async loadAllData() {
        const queryParams = new URLSearchParams(this.currentFilters).toString();
        
        try {
            // Load all data in parallel
            const [locationsRes, overviewRes, groupsRes, areasRes, trendsRes] = await Promise.all([
                fetch(`/api/locations?${queryParams}`),
                fetch(`/api/performance/overview?${queryParams}`),
                fetch(`/api/performance/groups?${queryParams}`),
                fetch(`/api/performance/areas?${queryParams}`),
                fetch(`/api/performance/trends?${queryParams}`)
            ]);

            this.data.locations = await locationsRes.json();
            this.data.overview = await overviewRes.json();
            this.data.groups = await groupsRes.json();
            this.data.areas = await areasRes.json();
            this.data.trends = await trendsRes.json();

            // Update UI
            this.updateKPIs();
            this.updateMap();
            this.updateCharts();

            // Notify Telegram Web App
            if (window.telegramWebApp?.isInTelegram) {
                window.telegramWebApp.notifyDataLoaded({
                    locations: this.data.locations.length,
                    groups: this.data.groups.length,
                    performance: this.data.overview.network_performance
                });
            }

        } catch (error) {
            console.error('Error cargando datos:', error);
            throw error;
        }
    }

    // =====================================================
    // KPIs UPDATE
    // =====================================================
    updateKPIs() {
        const overview = this.data.overview;
        
        document.getElementById('networkPerformance').textContent = `${overview.network_performance || 0}%`;
        document.getElementById('totalLocations').textContent = this.formatNumber(overview.total_locations || 0);
        document.getElementById('activeGroups').textContent = overview.active_groups || 0;
        document.getElementById('totalEvaluations').textContent = this.formatNumber(overview.total_evaluations || 0);
        
        // Update last update time
        if (overview.last_update) {
            const lastUpdate = new Date(overview.last_update).toLocaleString('es-MX');
            document.getElementById('lastUpdate').textContent = `Actualizado: ${lastUpdate}`;
        }
    }

    formatNumber(num) {
        return new Intl.NumberFormat('es-MX').format(num);
    }

    // =====================================================
    // MAP FUNCTIONALITY
    // =====================================================
    initMap() {
        try {
            // Check if Google Maps is available
            if (typeof google !== 'undefined' && google.maps) {
                this.initGoogleMap();
            } else {
                // Load Google Maps dynamically
                this.loadGoogleMapsAPI();
            }
        } catch (error) {
            console.error('Error inicializando mapa:', error);
            this.initMapPlaceholder();
        }
    }

    loadGoogleMapsAPI() {
        // For demo purposes, show map placeholder
        // In production, load: `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&callback=initMap`
        console.log('📍 Google Maps API key required for production');
        this.initMapPlaceholder();
    }

    initGoogleMap() {
        const mapContainer = document.getElementById('map');
        
        // Center map on Mexico (approximate center of all locations)
        const mexicoCenter = { lat: 25.6866, lng: -100.3161 };
        
        this.map = new google.maps.Map(mapContainer, {
            zoom: 8,
            center: mexicoCenter,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        this.updateMapMarkers();
        console.log('📍 Google Map inicializado');
    }

    initMapPlaceholder() {
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
                <div style="text-align: center; color: #6c757d;">
                    <i class="fas fa-map" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Mapa Interactivo</h3>
                    <p>Configurar Google Maps API key para habilitar el mapa</p>
                    <div style="margin-top: 20px;">
                        <button onclick="dashboard.showMapInfo()" class="btn-primary">
                            <i class="fas fa-info-circle"></i> Ver ${this.data.locations.length} Ubicaciones
                        </button>
                    </div>
                    <div style="margin-top: 12px;">
                        <small>Coordenadas reales disponibles para todas las sucursales</small>
                    </div>
                </div>
            </div>
        `;
        
        console.log('📍 Map placeholder inicializado');
    }

    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        if (this.mapMarkers) {
            this.mapMarkers.forEach(marker => marker.setMap(null));
        }
        this.mapMarkers = [];

        // Add markers for each location
        this.data.locations.forEach(location => {
            if (location.lat && location.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
                    map: this.map,
                    title: `${location.name} - ${location.performance}%`,
                    icon: this.getMarkerIcon(location.performance)
                });

                // Add info window
                const infoWindow = new google.maps.InfoWindow({
                    content: this.createMarkerInfoContent(location)
                });

                marker.addListener('click', () => {
                    infoWindow.open(this.map, marker);
                });

                this.mapMarkers.push(marker);
            }
        });

        // Fit bounds to show all markers
        if (this.mapMarkers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            this.mapMarkers.forEach(marker => {
                bounds.extend(marker.getPosition());
            });
            this.map.fitBounds(bounds);
        }
    }

    getMarkerIcon(performance) {
        let color = '#E17055'; // Critical
        if (performance >= 95) color = '#00B894'; // Excellent
        else if (performance >= 85) color = '#00CEC9'; // Good
        else if (performance >= 75) color = '#FDCB6E'; // Warning

        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        };
    }

    createMarkerInfoContent(location) {
        return `
            <div style="padding: 8px; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #2D3436;">${location.name}</h4>
                <div style="margin-bottom: 6px;">
                    <strong>Grupo:</strong> ${location.group}
                </div>
                <div style="margin-bottom: 6px;">
                    <strong>Ubicación:</strong> ${location.municipality}, ${location.state}
                </div>
                <div style="margin-bottom: 6px;">
                    <strong>Performance:</strong> 
                    <span class="${this.getPerformanceClass(location.performance)}" style="font-weight: bold;">
                        ${location.performance}%
                    </span>
                </div>
                <div style="margin-bottom: 6px;">
                    <strong>Evaluaciones:</strong> ${location.total_evaluations}
                </div>
                <div style="margin-top: 10px; font-size: 0.8em; color: #6c757d;">
                    Última evaluación: ${new Date(location.last_evaluation).toLocaleDateString('es-MX')}
                </div>
            </div>
        `;
    }

    showMapInfo() {
        const locations = this.data.locations;
        const modalContent = `
            <h4><i class="fas fa-store"></i> Sucursales Cargadas: ${locations.length}</h4>
            <div style="max-height: 300px; overflow-y: auto; margin-top: 16px;">
                ${locations.map((loc, i) => `
                    <div style="padding: 12px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between;">
                        <div>
                            <strong>${loc.name}</strong><br>
                            <small style="color: #6c757d;">${loc.group} - ${loc.state}</small>
                        </div>
                        <div style="text-align: right;">
                            <span class="performance-badge ${this.getPerformanceClass(loc.performance)}">${loc.performance}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                <small><i class="fas fa-info-circle"></i> Para habilitar el mapa interactivo, configurar token de Mapbox en el código</small>
            </div>
        `;
        
        this.showModal('Ubicaciones de Sucursales', modalContent);
    }

    updateMap() {
        if (this.map && typeof google !== 'undefined') {
            this.updateMapMarkers();
        } else {
            // Update placeholder with current data
            this.initMapPlaceholder();
        }
        console.log(`📍 Map data updated: ${this.data.locations.length} locations`);
    }

    // =====================================================
    // CHARTS FUNCTIONALITY
    // =====================================================
    initCharts() {
        this.initGruposChart();
        this.initAreasChart();
        this.initTendenciasChart();
    }

    initGruposChart() {
        const ctx = document.getElementById('gruposChart').getContext('2d');
        this.charts.grupos = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Performance (%)',
                    data: [],
                    backgroundColor: [],
                    borderColor: 'rgba(255, 107, 53, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataPoint = context.raw;
                                return `Performance: ${dataPoint}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    initAreasChart() {
        const ctx = document.getElementById('areasChart').getContext('2d');
        this.charts.areas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Performance (%)',
                    data: [],
                    backgroundColor: [],
                    borderColor: 'rgba(214, 48, 49, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initTendenciasChart() {
        const ctx = document.getElementById('tendenciasChart').getContext('2d');
        this.charts.tendencias = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Performance Promedio (%)',
                    data: [],
                    borderColor: 'rgba(255, 107, 53, 1)',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updateGruposChart();
        this.updateAreasChart();
        this.updateTendenciasChart();
    }

    updateGruposChart() {
        const groups = this.data.groups.slice(0, 15); // Top 15 groups
        const labels = groups.map(g => g.name);
        const data = groups.map(g => g.performance);
        const colors = data.map(value => this.getPerformanceColor(value));

        this.charts.grupos.data.labels = labels;
        this.charts.grupos.data.datasets[0].data = data;
        this.charts.grupos.data.datasets[0].backgroundColor = colors;
        this.charts.grupos.update();
    }

    updateAreasChart() {
        const areas = this.data.areas.slice(0, 10); // Bottom 10 areas (opportunities)
        const labels = areas.map(a => this.truncateText(a.area, 20));
        const data = areas.map(a => a.performance);
        const colors = data.map(value => this.getPerformanceColor(value));

        this.charts.areas.data.labels = labels;
        this.charts.areas.data.datasets[0].data = data;
        this.charts.areas.data.datasets[0].backgroundColor = colors;
        this.charts.areas.update();
    }

    updateTendenciasChart() {
        const trends = this.data.trends;
        const labels = trends.map(t => `Q${t.quarter} 2025`);
        const data = trends.map(t => t.performance);

        this.charts.tendencias.data.labels = labels;
        this.charts.tendencias.data.datasets[0].data = data;
        this.charts.tendencias.update();
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    getPerformanceColor(value) {
        if (value >= 95) return 'rgba(0, 184, 148, 0.8)'; // Excellent
        if (value >= 85) return 'rgba(0, 206, 201, 0.8)'; // Good
        if (value >= 75) return 'rgba(253, 203, 110, 0.8)'; // Warning
        return 'rgba(225, 112, 85, 0.8)'; // Critical
    }

    getPerformanceClass(value) {
        if (value >= 95) return 'text-excellent';
        if (value >= 85) return 'text-good';
        if (value >= 75) return 'text-warning';
        return 'text-critical';
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // =====================================================
    // TAB MANAGEMENT
    // =====================================================
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Trigger chart resize for visible charts
        setTimeout(() => {
            if (this.charts[tabName]) {
                this.charts[tabName].resize();
            }
        }, 100);
    }

    // =====================================================
    // FILTERS
    // =====================================================
    applyFilters() {
        this.currentFilters = {
            grupo: document.getElementById('grupoFilter').value,
            estado: document.getElementById('estadoFilter').value,
            trimestre: document.getElementById('trimestreFilter').value
        };
        
        console.log('🔍 Aplicando filtros:', this.currentFilters);
        
        // Notify Telegram Web App about filter changes
        if (window.telegramWebApp?.isInTelegram) {
            window.telegramWebApp.notifyFilterApplied(this.currentFilters);
        }
        
        this.loadAllData();
    }

    clearFilters() {
        document.getElementById('grupoFilter').value = '';
        document.getElementById('estadoFilter').value = '';
        document.getElementById('trimestreFilter').value = '';
        
        this.currentFilters = { grupo: '', estado: '', trimestre: '' };
        this.loadAllData();
    }

    // =====================================================
    // MODAL MANAGEMENT
    // =====================================================
    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('locationModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('locationModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // =====================================================
    // LOADING & ERROR STATES
    // =====================================================
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        console.error('❌', message);
        // Could show a toast notification here
        alert(`Error: ${message}`);
    }
}

// =====================================================
// INITIALIZE DASHBOARD
// =====================================================
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ElPolloLocoDashboard();
});

// Make dashboard available globally for debugging
window.dashboard = dashboard;