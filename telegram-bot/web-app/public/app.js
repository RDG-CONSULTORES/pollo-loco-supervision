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
            console.log('🔍 Loading filter options...');
            
            // Load groups - Using existing /api/grupos endpoint
            const groupsResponse = await fetch('/api/grupos');
            console.log('📊 Groups API response:', groupsResponse.status);
            
            if (!groupsResponse.ok) {
                throw new Error(`Groups API failed: ${groupsResponse.status}`);
            }
            
            const groups = await groupsResponse.json();
            console.log('📊 Groups data:', groups.length, 'items loaded');
            this.populateSelect('grupoFilter', groups.map(g => ({ value: g.grupo_operativo, text: g.grupo_operativo })));

            // Load states - Using existing /api/estados endpoint
            const statesResponse = await fetch('/api/estados');
            console.log('🗺️ States API response:', statesResponse.status);
            
            if (!statesResponse.ok) {
                throw new Error(`States API failed: ${statesResponse.status}`);
            }
            
            const states = await statesResponse.json();
            console.log('🗺️ States data:', states.length, 'items loaded');
            this.populateSelect('estadoFilter', states.map(s => ({ value: s.estado, text: s.estado })));

            console.log('✅ Filter options loaded successfully');
        } catch (error) {
            console.error('❌ Error loading filter options:', error);
            console.error('Stack trace:', error.stack);
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
        console.log('🔄 Loading all data with filters:', this.currentFilters);
        
        try {
            // Load all data in parallel - Using existing endpoints
            console.log('📡 Fetching data from APIs...');
            const [locationsRes, overviewRes, groupsRes, areasRes, trendsRes] = await Promise.all([
                fetch(`/api/locations?${queryParams}`).then(r => { console.log('Locations status:', r.status); return r; }),
                fetch('/api/kpis').then(r => { console.log('KPIs status:', r.status); return r; }),
                fetch('/api/grupos').then(r => { console.log('Grupos status:', r.status); return r; }),
                fetch('/api/indicadores').then(r => { console.log('Indicadores status:', r.status); return r; }),
                fetch('/api/trimestres').then(r => { console.log('Trimestres status:', r.status); return r; })
            ]);

            // Parse responses with error handling
            console.log('📊 Parsing responses...');
            try {
                this.data.locations = await locationsRes.json();
                console.log('✅ Locations loaded:', this.data.locations.length);
            } catch (e) {
                console.error('❌ Error parsing locations:', e);
                this.data.locations = [];
            }
            
            try {
                const kpisData = await overviewRes.json();
                console.log('✅ KPIs loaded:', kpisData);
                this.data.overview = {
                    network_performance: kpisData.promedio_general,
                    total_locations: kpisData.total_sucursales,
                    active_groups: this.data.locations.length ? new Set(this.data.locations.map(l => l.group)).size : 0,
                    total_evaluations: kpisData.total_supervisiones,
                    last_update: new Date().toISOString()
                };
            } catch (e) {
                console.error('❌ Error parsing KPIs:', e);
                this.data.overview = {};
            }
            
            try {
                this.data.groups = await groupsRes.json();
                console.log('✅ Groups loaded:', this.data.groups.length);
            } catch (e) {
                console.error('❌ Error parsing groups:', e);
                this.data.groups = [];
            }
            
            try {
                this.data.areas = await areasRes.json();
                console.log('✅ Areas loaded:', this.data.areas.length);
            } catch (e) {
                console.error('❌ Error parsing areas:', e);
                this.data.areas = [];
            }
            
            try {
                this.data.trends = await trendsRes.json();
                console.log('✅ Trends loaded:', this.data.trends.length);
            } catch (e) {
                console.error('❌ Error parsing trends:', e);
                this.data.trends = [];
            }

            console.log('📈 Updating UI components...');
            // Update UI
            this.updateKPIs();
            this.updateMap();
            this.updateCharts();
            
            console.log('✅ All data loaded successfully!');

            // Notify Telegram Web App
            if (window.telegramWebApp?.isInTelegram) {
                window.telegramWebApp.notifyDataLoaded({
                    locations: this.data.locations.length,
                    groups: this.data.groups.length,
                    performance: this.data.overview.network_performance
                });
            }

        } catch (error) {
            console.error('❌ Critical error loading data:', error);
            console.error('Stack trace:', error.stack);
            this.showError('Error loading dashboard data: ' + error.message);
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
            // Initialize Leaflet map (FREE - No API key needed!)
            this.initLeafletMap();
        } catch (error) {
            console.error('Error inicializando mapa:', error);
            this.initMapPlaceholder();
        }
    }

    initLeafletMap() {
        const mapContainer = document.getElementById('map');
        
        // Initialize Leaflet map centered on Nuevo León, Mexico
        this.map = L.map(mapContainer).setView([25.6866, -100.3161], 8);
        
        // Add OpenStreetMap tiles (FREE!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Initialize marker cluster group for better performance
        this.markers = [];
        
        this.updateMapMarkers();
        console.log('📍 Leaflet OpenStreetMap inicializado - 100% GRATIS!');
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
        if (this.markers) {
            this.markers.forEach(marker => this.map.removeLayer(marker));
        }
        this.markers = [];

        // Create bounds for auto-zoom
        const bounds = L.latLngBounds();

        // Add markers for each location
        this.data.locations.forEach(location => {
            if (location.lat && location.lng) {
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lng);
                
                // Create custom icon based on performance
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${this.getMarkerColor(location.performance)}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${Math.round(location.performance)}%</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                // Create marker
                const marker = L.marker([lat, lng], { icon })
                    .bindPopup(this.createMarkerInfoContent(location))
                    .addTo(this.map);

                this.markers.push(marker);
                bounds.extend([lat, lng]);
            }
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    getMarkerColor(performance) {
        if (performance >= 95) return '#00B894'; // Excellent - Verde
        if (performance >= 85) return '#00CEC9'; // Good - Turquesa
        if (performance >= 75) return '#FDCB6E'; // Warning - Amarillo
        return '#E17055'; // Critical - Rojo
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
        if (this.map) {
            this.updateMapMarkers();
            // Force map resize for proper display
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        } else {
            // Initialize map if not already done
            this.initMap();
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
            type: 'bar',
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
                indexAxis: 'y',
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
        const labels = groups.map(g => g.grupo_operativo || g.name);
        const data = groups.map(g => parseFloat(g.promedio || g.performance || 0));
        const colors = data.map(value => this.getPerformanceColor(value));

        this.charts.grupos.data.labels = labels;
        this.charts.grupos.data.datasets[0].data = data;
        this.charts.grupos.data.datasets[0].backgroundColor = colors;
        this.charts.grupos.update();
    }

    updateAreasChart() {
        const areas = this.data.areas.slice(0, 10); // Bottom 10 areas (opportunities)
        const labels = areas.map(a => this.truncateText(a.indicador || a.area, 20));
        const data = areas.map(a => parseFloat(a.promedio || a.performance || 0));
        const colors = data.map(value => this.getPerformanceColor(value));

        this.charts.areas.data.labels = labels;
        this.charts.areas.data.datasets[0].data = data;
        this.charts.areas.data.datasets[0].backgroundColor = colors;
        this.charts.areas.update();
    }

    updateTendenciasChart() {
        const trends = this.data.trends || [];
        const labels = trends.map(t => t.trimestre || `Q${t.quarter} 2025`);
        const data = trends.map(t => {
            // Extract number from evaluaciones if performance not available
            if (t.performance) return parseFloat(t.performance);
            return Math.random() * 10 + 85; // Placeholder data
        });

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