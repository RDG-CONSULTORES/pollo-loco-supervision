// El Pollo Loco Dashboard Application
console.log('🚀 HOTFIX VERSION LOADING...');

class DashboardApp {
    constructor() {
        this.apiUrl = window.location.origin;
        this.currentData = null;
        this.charts = {};
        this.map = null;
        this.init();
    }

    init() {
        console.log('📱 Initializing Dashboard App...');
        this.setupEventListeners();
        this.initializeTabs();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Filter buttons
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('downloadReportBtn').addEventListener('click', () => this.downloadReport());

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('locationModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    initializeTabs() {
        // Show first tab by default
        this.switchTab('mapa');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Initialize content based on tab
        switch(tabName) {
            case 'mapa':
                this.initializeMap();
                break;
            case 'grupos':
                this.updateGruposChart();
                break;
            case 'areas':
                this.updateAreasChart();
                break;
            case 'tendencias':
                this.updateTendenciasChart();
                break;
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        try {
            await Promise.all([
                this.loadKPIs(),
                this.loadFilters(),
                this.loadDashboardData()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Error al cargar los datos iniciales');
        } finally {
            this.showLoading(false);
        }
    }

    async loadKPIs() {
        try {
            const response = await fetch(`${this.apiUrl}/api/kpis`);
            const kpis = await response.json();
            
            document.getElementById('networkPerformance').textContent = kpis.averageScore + '%';
            document.getElementById('totalLocations').textContent = kpis.totalLocations;
            document.getElementById('activeGroups').textContent = kpis.activeGroups;
            document.getElementById('totalEvaluations').textContent = kpis.totalSupervisions;
            
            this.updateLastUpdate();
        } catch (error) {
            console.error('Error loading KPIs:', error);
        }
    }

    async loadFilters() {
        try {
            // Load grupos
            const gruposResponse = await fetch(`${this.apiUrl}/api/grupos`);
            const grupos = await gruposResponse.json();
            
            const grupoFilter = document.getElementById('grupoFilter');
            grupos.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.grupo;
                option.textContent = grupo.grupo;
                grupoFilter.appendChild(option);
            });

            // Load estados
            const estadosResponse = await fetch(`${this.apiUrl}/api/estados`);
            const estados = await estadosResponse.json();
            
            const estadoFilter = document.getElementById('estadoFilter');
            estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.estado;
                option.textContent = estado.estado;
                estadoFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    async loadDashboardData() {
        try {
            const filters = this.getCurrentFilters();
            const params = new URLSearchParams(filters);
            
            const response = await fetch(`${this.apiUrl}/api/dashboard-data?${params}`);
            this.currentData = await response.json();
            
            // Update all visualizations
            this.updateAllCharts();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    getCurrentFilters() {
        return {
            grupo: document.getElementById('grupoFilter').value,
            estado: document.getElementById('estadoFilter').value,
            trimestre: document.getElementById('trimestreFilter').value
        };
    }

    async applyFilters() {
        this.showLoading(true);
        try {
            await this.loadKPIs();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError('Error al aplicar filtros');
        } finally {
            this.showLoading(false);
        }
    }

    clearFilters() {
        document.getElementById('grupoFilter').value = '';
        document.getElementById('estadoFilter').value = '';
        document.getElementById('trimestreFilter').value = '';
        this.applyFilters();
    }

    async downloadReport() {
        try {
            const filters = this.getCurrentFilters();
            const grupo = filters.grupo || 'all';
            
            // Create download URL with all current filters
            const params = new URLSearchParams({
                estado: filters.estado || 'all',
                trimestre: filters.trimestre || 'all',
                format: 'html'
            });
            
            const reportUrl = `${this.apiUrl}/api/generate-report/${grupo}?${params}`;
            
            // Open report in new window
            window.open(reportUrl, '_blank');
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Error al generar el reporte');
        }
    }

    updateAllCharts() {
        if (this.currentData) {
            this.updateGruposChart();
            this.updateAreasChart();
            this.updateTendenciasChart();
            this.updateMapData();
        }
    }

    updateGruposChart() {
        const ctx = document.getElementById('gruposChart');
        if (!ctx || !this.currentData) return;

        if (this.charts.grupos) {
            this.charts.grupos.destroy();
        }

        this.charts.grupos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.currentData.grupos?.map(g => g.grupo) || [],
                datasets: [{
                    label: 'Performance (%)',
                    data: this.currentData.grupos?.map(g => g.promedio) || [],
                    backgroundColor: 'rgba(255, 107, 53, 0.7)',
                    borderColor: 'rgba(255, 107, 53, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateAreasChart() {
        const ctx = document.getElementById('areasChart');
        if (!ctx || !this.currentData) return;

        if (this.charts.areas) {
            this.charts.areas.destroy();
        }

        this.charts.areas = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.currentData.areas?.map(a => a.area) || [],
                datasets: [{
                    data: this.currentData.areas?.map(a => a.promedio) || [],
                    backgroundColor: [
                        '#FF6B35',
                        '#D63031',
                        '#00b894',
                        '#fdcb6e',
                        '#6c5ce7',
                        '#a29bfe',
                        '#fd79a8',
                        '#e17055'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateTendenciasChart() {
        const ctx = document.getElementById('tendenciasChart');
        if (!ctx || !this.currentData) return;

        if (this.charts.tendencias) {
            this.charts.tendencias.destroy();
        }

        this.charts.tendencias = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.currentData.tendencias?.map(t => t.periodo) || [],
                datasets: [{
                    label: 'Performance General',
                    data: this.currentData.tendencias?.map(t => t.promedio) || [],
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    async initializeMap() {
        if (this.map) return;

        try {
            // Initialize Leaflet map
            this.map = L.map('map').setView([25.6866, -100.3161], 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Load map data
            await this.updateMapData();
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    async updateMapData() {
        if (!this.map) return;

        try {
            const filters = this.getCurrentFilters();
            const params = new URLSearchParams(filters);
            
            const response = await fetch(`${this.apiUrl}/api/map/data?${params}`);
            const mapData = await response.json();

            // Clear existing markers
            this.map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    this.map.removeLayer(layer);
                }
            });

            // Add new markers
            mapData.forEach(location => {
                const color = this.getMarkerColor(location.promedio);
                const marker = L.circleMarker([location.latitud, location.longitud], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: 8
                }).addTo(this.map);

                marker.bindPopup(`
                    <strong>${location.sucursal}</strong><br>
                    Estado: ${location.estado}<br>
                    Performance: ${location.promedio}%<br>
                    Evaluaciones: ${location.evaluaciones}
                `);

                marker.on('click', () => {
                    this.showLocationDetails(location);
                });
            });
        } catch (error) {
            console.error('Error updating map data:', error);
        }
    }

    getMarkerColor(performance) {
        if (performance >= 90) return '#00b894';
        if (performance >= 80) return '#fdcb6e';
        if (performance >= 70) return '#e17055';
        return '#d63031';
    }

    showLocationDetails(location) {
        document.getElementById('modalTitle').textContent = location.sucursal;
        document.getElementById('modalContent').innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>Estado:</strong> ${location.estado}<br>
                <strong>Grupo:</strong> ${location.grupo}<br>
                <strong>Performance:</strong> ${location.promedio}%<br>
                <strong>Total Evaluaciones:</strong> ${location.evaluaciones}
            </div>
        `;
        document.getElementById('locationModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('locationModal').style.display = 'none';
    }

    updateLastUpdate() {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = 
            `Última actualización: ${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX')}`;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});

// Global functions for external access
window.app = {
    downloadReport: () => window.dashboardApp?.downloadReport()
};