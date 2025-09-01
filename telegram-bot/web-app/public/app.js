// =====================================================
// EL POLLO LOCO - DASHBOARD INTERACTIVO v2.0
// Sistema completo con Leaflet + OpenStreetMap (GRATIS)
// =====================================================

class ElPolloLocoDashboard {
    constructor() {
        this.map = null;
        this.charts = {};
        this.currentFilters = {
            grupo: '',
            estado: '',
            trimestre: '',
            periodoCas: ''
        };
        this.data = {
            locations: [],
            overview: {},
            groups: [],
            areas: [],
            trends: [],
            periodsCas: []
        };
        
        this.init();
    }

    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    async init() {
        console.log('🚀 DASHBOARD v2.0 - Iniciando El Pollo Loco Dashboard...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize charts FIRST
        this.initCharts();
        
        // Initialize map FIRST  
        this.initMap();
        
        // THEN load data
        await this.loadInitialData();
        
        console.log('✅ Dashboard v2.0 inicializado correctamente');
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
            
            // Load main data
            await this.loadAllData();
            
            // Load filters after data is loaded
            this.populateFilters();
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showError('Error cargando datos iniciales: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadAllData() {
        console.log('🔄 API: Cargando todos los datos...');
        
        try {
            // Load in parallel with detailed logging
            const promises = [
                this.loadKPIData(),
                this.loadGroupData(),
                this.loadLocationData(),
                this.loadAreaData(),
                this.loadTrendData(),
                this.loadPeriodsCasData()
            ];
            
            await Promise.all(promises);
            
            // Update UI with loaded data
            this.updateDashboard();
            
            console.log('✅ API: Todos los datos cargados correctamente');
            
        } catch (error) {
            console.error('❌ API: Error loading data:', error);
            throw error;
        }
    }

    async loadKPIData() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.trimestre) {
                params.append('trimestre', this.currentFilters.trimestre);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/kpis?${queryString}` : '/api/kpis';
            
            console.log('📈 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.overview = await response.json();
            console.log('✅ API: KPIs loaded:', this.data.overview);
            
        } catch (error) {
            console.error('❌ API: Error loading KPIs:', error);
            throw error;
        }
    }

    async loadGroupData() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.trimestre) {
                params.append('trimestre', this.currentFilters.trimestre);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/grupos?${queryString}` : '/api/grupos';
            
            console.log('👥 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.groups = await response.json();
            console.log(`✅ API: Groups loaded (${this.data.groups.length}):`, this.data.groups);
            
        } catch (error) {
            console.error('❌ API: Error loading groups:', error);
            throw error;
        }
    }

    async loadLocationData() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.trimestre) {
                params.append('trimestre', this.currentFilters.trimestre);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/locations?${queryString}` : '/api/locations';
            
            console.log('📍 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.locations = await response.json();
            console.log(`✅ API: Locations loaded (${this.data.locations.length}):`, this.data.locations);
            
        } catch (error) {
            console.error('❌ API: Error loading locations:', error);
            throw error;
        }
    }

    async loadAreaData() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.trimestre) {
                params.append('trimestre', this.currentFilters.trimestre);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/indicadores?${queryString}` : '/api/indicadores';
            
            console.log('🎯 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.areas = await response.json();
            console.log(`✅ API: Areas loaded (${this.data.areas.length}):`, this.data.areas);
            
        } catch (error) {
            console.error('❌ API: Error loading areas:', error);
            throw error;
        }
    }

    async loadTrendData() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/trimestres?${queryString}` : '/api/trimestres';
            
            console.log('📈 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.trends = await response.json();
            console.log(`✅ API: Trends loaded (${this.data.trends.length}):`, this.data.trends);
            
        } catch (error) {
            console.error('❌ API: Error loading trends:', error);
            throw error;
        }
    }

    async loadPeriodsCasData() {
        try {
            console.log('📅 API: Fetching /api/periodos-cas...');
            const response = await fetch('/api/periodos-cas');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.periodsCas = await response.json();
            console.log(`✅ API: Períodos CAS loaded (${this.data.periodsCas.length}):`, this.data.periodsCas);
            
        } catch (error) {
            console.error('❌ API: Error loading períodos CAS:', error);
            throw error;
        }
    }

    // =====================================================
    // MAPA (LEAFLET + OPENSTREETMAP - GRATIS!)
    // =====================================================
    initMap() {
        try {
            console.log('🗺️  Inicializando mapa con Leaflet...');
            
            // Check if map already exists
            if (this.map) {
                console.log('ℹ️  Mapa ya existe, removiendo...');
                this.map.remove();
                this.map = null;
            }
            
            // Create map centered on Mexico
            this.map = L.map('map').setView([23.6345, -102.5528], 5);
            
            // Add OpenStreetMap tiles (FREE!)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);
            
            console.log('✅ Mapa Leaflet inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando mapa:', error);
        }
    }

    updateMap() {
        if (!this.map || !this.data.locations) {
            console.warn('⚠️  Mapa o datos no disponibles');
            return;
        }
        
        try {
            console.log(`🗺️  Actualizando mapa con ${this.data.locations.length} ubicaciones...`);
            
            // Clear existing markers
            this.map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    this.map.removeLayer(layer);
                }
            });
            
            // Add markers for each location
            this.data.locations.forEach(location => {
                if (location.lat && location.lng) {
                    const marker = L.marker([location.lat, location.lng])
                        .addTo(this.map);
                    
                    // Create popup content
                    const popupContent = `
                        <div class="location-popup">
                            <h4>${location.name}</h4>
                            <p><strong>Grupo:</strong> ${location.group}</p>
                            <p><strong>Estado:</strong> ${location.state}</p>
                            <p><strong>Performance:</strong> ${location.performance}%</p>
                            <p><strong>Evaluaciones:</strong> ${location.total_evaluations}</p>
                        </div>
                    `;
                    
                    marker.bindPopup(popupContent);
                    
                    // Click handler for detailed view
                    marker.on('click', () => {
                        this.showLocationDetails(location);
                    });
                }
            });
            
            console.log('✅ Mapa actualizado correctamente');
            
        } catch (error) {
            console.error('❌ Error actualizando mapa:', error);
        }
    }

    // =====================================================
    // CHARTS (CHART.JS)
    // =====================================================
    initCharts() {
        console.log('📊 Inicializando gráficos...');
        
        try {
            // Performance por Grupo (Bar Chart)
            const gruposCtx = document.getElementById('gruposChart');
            if (gruposCtx) {
                this.charts.grupos = new Chart(gruposCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Performance (%)',
                            data: [],
                            backgroundColor: 'rgba(231, 76, 60, 0.7)',
                            borderColor: 'rgba(231, 76, 60, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    maxTicksLimit: 6
                                }
                            },
                            x: {
                                ticks: {
                                    maxRotation: 45,
                                    maxTicksLimit: 10
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 10,
                                bottom: 10
                            }
                        }
                    }
                });
            }

            // Áreas de Oportunidad (Doughnut Chart)
            const areasCtx = document.getElementById('areasChart');
            if (areasCtx) {
                this.charts.areas = new Chart(areasCtx, {
                    type: 'doughnut',
                    data: {
                        labels: [],
                        datasets: [{
                            data: [],
                            backgroundColor: [
                                'rgba(231, 76, 60, 0.7)',
                                'rgba(52, 152, 219, 0.7)',
                                'rgba(46, 204, 113, 0.7)',
                                'rgba(241, 196, 15, 0.7)',
                                'rgba(155, 89, 182, 0.7)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    maxWidth: 200,
                                    padding: 15,
                                    usePointStyle: true
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10
                            }
                        },
                        elements: {
                            arc: {
                                borderWidth: 2
                            }
                        }
                    }
                });
            }

            // Tendencias (Line Chart)
            const tendenciasCtx = document.getElementById('tendenciasChart');
            if (tendenciasCtx) {
                this.charts.tendencias = new Chart(tendenciasCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Evaluaciones por Trimestre',
                            data: [],
                            borderColor: 'rgba(231, 76, 60, 1)',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderWidth: 2,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    maxTicksLimit: 8
                                }
                            },
                            x: {
                                ticks: {
                                    maxRotation: 0
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 10,
                                bottom: 10
                            }
                        },
                        elements: {
                            point: {
                                radius: 4,
                                hoverRadius: 6
                            },
                            line: {
                                tension: 0.2
                            }
                        }
                    }
                });
            }
            
            console.log('✅ Gráficos inicializados correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando gráficos:', error);
        }
    }

    // =====================================================
    // UI UPDATES
    // =====================================================
    updateDashboard() {
        console.log('🔄 Actualizando dashboard...');
        
        try {
            this.updateKPIs();
            this.updateCharts();
            this.updateMap();
            
            // Update last update time
            document.getElementById('lastUpdate').textContent = 
                `Última actualización: ${new Date().toLocaleString('es-MX')}`;
                
            console.log('✅ Dashboard actualizado correctamente');
            
        } catch (error) {
            console.error('❌ Error actualizando dashboard:', error);
        }
    }

    updateKPIs() {
        console.log('📊 Actualizando KPIs...', this.data.overview);
        
        try {
            // Network Performance
            const networkPerf = document.getElementById('networkPerformance');
            if (networkPerf && this.data.overview.promedio_general) {
                networkPerf.textContent = `${this.data.overview.promedio_general}%`;
            }

            // Total Locations (from filtered data)
            const totalLocs = document.getElementById('totalLocations');
            if (totalLocs) {
                // Use filtered total from KPIs or count locations
                const count = this.data.overview.total_sucursales || this.data.locations.length;
                totalLocs.textContent = count;
            }

            // Active Groups (from filtered data)
            const activeGroups = document.getElementById('activeGroups');
            if (activeGroups) {
                // If filtering by group, show 1, otherwise show total unique groups
                if (this.currentFilters.grupo) {
                    activeGroups.textContent = '1';
                } else {
                    // Count unique groups from overview or locations
                    const uniqueGroups = this.data.overview.total_grupos || 
                        new Set(this.data.locations.map(l => l.group)).size;
                    activeGroups.textContent = uniqueGroups;
                }
            }

            // Total Evaluations
            const totalEvals = document.getElementById('totalEvaluations');
            if (totalEvals && this.data.overview.total_supervisiones) {
                totalEvals.textContent = this.data.overview.total_supervisiones;
            }
            
            console.log('✅ KPIs actualizados correctamente');
            
        } catch (error) {
            console.error('❌ Error actualizando KPIs:', error);
        }
    }

    updateCharts() {
        console.log('📊 Actualizando gráficos...');
        
        try {
            // Update Groups Chart
            if (this.charts.grupos && this.data.groups && this.data.groups.length > 0) {
                this.charts.grupos.data.labels = this.data.groups.map(g => g.grupo_operativo);
                this.charts.grupos.data.datasets[0].data = this.data.groups.map(g => parseFloat(g.promedio));
                this.charts.grupos.update();
                console.log('✅ Gráfico de grupos actualizado');
            }

            // Update Areas Chart
            if (this.charts.areas && this.data.areas && this.data.areas.length > 0) {
                this.charts.areas.data.labels = this.data.areas.map(a => a.indicador);
                this.charts.areas.data.datasets[0].data = this.data.areas.map(a => parseFloat(a.promedio));
                this.charts.areas.update();
                console.log('✅ Gráfico de áreas actualizado');
            }

            // Update Trends Chart
            if (this.charts.tendencias && this.data.trends && this.data.trends.length > 0) {
                this.charts.tendencias.data.labels = this.data.trends.map(t => t.trimestre);
                this.charts.tendencias.data.datasets[0].data = this.data.trends.map(t => parseInt(t.evaluaciones));
                this.charts.tendencias.update();
                console.log('✅ Gráfico de tendencias actualizado');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando gráficos:', error);
        }
    }

    // =====================================================
    // TAB MANAGEMENT
    // =====================================================
    switchTab(tabName) {
        console.log(`🔄 Cambiando a tab: ${tabName}`);
        
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
        
        // Special handling for map tab
        if (tabName === 'mapa') {
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        }
    }

    // =====================================================
    // FILTERS
    // =====================================================
    populateFilters() {
        console.log('🔧 Llenando filtros...');
        
        try {
            // Populate Grupo filter
            const grupoFilter = document.getElementById('grupoFilter');
            if (grupoFilter && this.data.groups) {
                // Clear existing options except the first one
                grupoFilter.innerHTML = '<option value="">Todos los grupos</option>';
                
                // Add unique groups
                const uniqueGroups = [...new Set(this.data.groups.map(g => g.grupo_operativo))].sort();
                uniqueGroups.forEach(grupo => {
                    const option = document.createElement('option');
                    option.value = grupo;
                    option.textContent = grupo;
                    grupoFilter.appendChild(option);
                });
                console.log(`✅ Filtro grupos llenado con ${uniqueGroups.length} opciones`);
            }
            
            // Populate Estado filter
            const estadoFilter = document.getElementById('estadoFilter');
            if (estadoFilter && this.data.locations) {
                // Clear existing options except the first one
                estadoFilter.innerHTML = '<option value="">Todos los estados</option>';
                
                // Get unique states from locations
                const uniqueStates = [...new Set(this.data.locations.map(l => l.state).filter(s => s))].sort();
                uniqueStates.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado;
                    option.textContent = estado;
                    estadoFilter.appendChild(option);
                });
                console.log(`✅ Filtro estados llenado con ${uniqueStates.length} opciones`);
            }
            
            // Populate Período CAS filter
            const periodoCasFilter = document.getElementById('periodoCasFilter');
            if (periodoCasFilter && this.data.periodsCas) {
                // Clear existing options except the first one
                periodoCasFilter.innerHTML = '<option value="">Todos los períodos</option>';
                
                // Add períodos CAS (skip "all" option since we already have "Todos los períodos")
                this.data.periodsCas
                    .filter(periodo => periodo.periodo !== 'all')
                    .forEach(periodo => {
                        const option = document.createElement('option');
                        option.value = periodo.periodo;
                        option.textContent = `${periodo.nombre} (${periodo.count})`;
                        periodoCasFilter.appendChild(option);
                    });
                console.log(`✅ Filtro períodos CAS llenado con ${this.data.periodsCas.length - 1} opciones`);
            }
            
            console.log('✅ Filtros poblados correctamente');
        } catch (error) {
            console.error('❌ Error llenando filtros:', error);
        }
    }
    
    applyFilters() {
        console.log('🔍 Aplicando filtros...');
        
        this.currentFilters.grupo = document.getElementById('grupoFilter').value;
        this.currentFilters.estado = document.getElementById('estadoFilter').value;
        this.currentFilters.trimestre = document.getElementById('trimestreFilter').value;
        this.currentFilters.periodoCas = document.getElementById('periodoCasFilter').value;
        
        console.log('Filtros aplicados:', this.currentFilters);
        
        // Show loading
        this.showLoading();
        
        // Reload data with filters
        Promise.all([
            this.loadKPIData(),      // Load filtered KPIs
            this.loadGroupData(),    // Load filtered groups - FIXED!
            this.loadLocationData(), // Load filtered locations
            this.loadAreaData(),     // Load filtered areas
            this.loadTrendData()     // Load filtered trends
        ]).then(() => {
            // Update all UI components
            this.updateKPIs();
            this.updateCharts();
            this.updateMap();
            this.hideLoading();
        }).catch(error => {
            console.error('Error applying filters:', error);
            this.hideLoading();
        });
    }

    clearFilters() {
        console.log('🧹 Limpiando filtros...');
        
        document.getElementById('grupoFilter').value = '';
        document.getElementById('estadoFilter').value = '';
        document.getElementById('trimestreFilter').value = '';
        document.getElementById('periodoCasFilter').value = '';
        
        this.currentFilters = { grupo: '', estado: '', trimestre: '', periodoCas: '' };
        
        // Show loading
        this.showLoading();
        
        // Reload all data without filters
        Promise.all([
            this.loadKPIData(),
            this.loadGroupData(),    // Load groups without filters - FIXED!
            this.loadLocationData(),
            this.loadAreaData(),
            this.loadTrendData()
        ]).then(() => {
            // Update all UI components
            this.updateKPIs();
            this.updateCharts();
            this.updateMap();
            this.hideLoading();
        }).catch(error => {
            console.error('Error clearing filters:', error);
            this.hideLoading();
        });
    }

    // =====================================================
    // MODAL MANAGEMENT
    // =====================================================
    showLocationDetails(location) {
        const modal = document.getElementById('locationModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        
        title.textContent = location.name;
        content.innerHTML = `
            <div class="location-details">
                <p><strong>Grupo Operativo:</strong> ${location.group}</p>
                <p><strong>Estado:</strong> ${location.state}</p>
                <p><strong>Municipio:</strong> ${location.municipality}</p>
                <p><strong>Performance:</strong> ${location.performance}%</p>
                <p><strong>Total Evaluaciones:</strong> ${location.total_evaluations}</p>
                <p><strong>Última Evaluación:</strong> ${new Date(location.last_evaluation).toLocaleDateString('es-MX')}</p>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('locationModal').style.display = 'none';
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        console.error('❌ Error:', message);
        // Could implement toast notifications here
        alert('Error: ' + message);
    }
}

// =====================================================
// INITIALIZATION
// =====================================================
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing dashboard...');
    dashboard = new ElPolloLocoDashboard();
});

// Telegram WebApp integration
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    console.log('📱 Telegram WebApp initialized');
}