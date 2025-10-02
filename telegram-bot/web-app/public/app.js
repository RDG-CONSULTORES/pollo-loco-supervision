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
            periodsCas: [],
            sucursalesRanking: []  // NEW: Para la gráfica de sucursales
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
                this.loadPeriodsCasData(),
                this.loadSucursalesRanking()  // NEW: Load sucursales ranking
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
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
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
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
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
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
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
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
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
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
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

    async loadSucursalesRanking() {
        try {
            // Build query params from filters
            const params = new URLSearchParams();
            if (this.currentFilters.grupo) {
                params.append('grupo', this.currentFilters.grupo);
            }
            if (this.currentFilters.estado) {
                params.append('estado', this.currentFilters.estado);
            }
            if (this.currentFilters.sucursal) {
                params.append('sucursal', this.currentFilters.sucursal);
            }
            if (this.currentFilters.trimestre) {
                params.append('trimestre', this.currentFilters.trimestre);
            }
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/api/sucursales-ranking?${queryString}` : '/api/sucursales-ranking';
            
            console.log('🏪 API: Fetching', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data.sucursalesRanking = await response.json();
            console.log(`✅ API: Sucursales ranking loaded (${this.data.sucursalesRanking.length}):`, this.data.sucursalesRanking);
            
        } catch (error) {
            console.error('❌ API: Error loading sucursales ranking:', error);
            // SAFE: Don't throw error to prevent blocking dashboard load
            this.data.sucursalesRanking = []; // Set empty array as fallback
            console.warn('⚠️ Dashboard will continue without sucursales ranking data');
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
                    
                    // Create enhanced popup content with supervision details
                    const performanceClass = location.performance >= 90 ? 'excellent' : 
                                           location.performance >= 70 ? 'good' : 'critical';
                    
                    const popupContent = `
                        <div class="location-popup">
                            <div class="popup-header">
                                <h4><i class="fas fa-store"></i> ${location.name || location.sucursal}</h4>
                                <span class="performance-badge ${performanceClass}">
                                    ${location.performance || location.promedio}%
                                </span>
                            </div>
                            
                            <div class="popup-body">
                                <div class="popup-row">
                                    <i class="fas fa-users"></i>
                                    <span><strong>Grupo:</strong> ${location.group || location.grupo_operativo}</span>
                                </div>
                                
                                <div class="popup-row">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span><strong>Estado:</strong> ${location.state || location.estado}</span>
                                </div>
                                
                                <div class="popup-row">
                                    <i class="fas fa-chart-line"></i>
                                    <span><strong>Supervisiones:</strong> ${location.total_evaluations || location.total_supervisiones || 'N/A'}</span>
                                </div>
                                
                                <div class="popup-row">
                                    <i class="fas fa-calendar"></i>
                                    <span><strong>Última supervisión:</strong> ${location.fecha_supervision || 'N/A'}</span>
                                </div>
                                
                                ${location.areas_criticas ? `
                                <div class="popup-section">
                                    <strong><i class="fas fa-exclamation-triangle"></i> Áreas de Oportunidad:</strong>
                                    <ul class="areas-list">
                                        ${location.areas_criticas.map(area => 
                                            `<li>${area.nombre}: <span class="area-percentage">${area.porcentaje}%</span></li>`
                                        ).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="popup-footer">
                                <small>Click para más detalles</small>
                            </div>
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
        
        // SAFE: Register Chart.js annotation plugin only if available
        try {
            if (typeof ChartAnnotation !== 'undefined' && ChartAnnotation) {
                Chart.register(ChartAnnotation);
                console.log('✅ ChartAnnotation plugin registered successfully');
            } else {
                console.warn('⚠️ ChartAnnotation plugin not loaded, meta lines will be disabled');
            }
        } catch (error) {
            console.warn('⚠️ Error registering ChartAnnotation plugin:', error.message);
        }
        
        // Helper function for safe annotation config
        const getSafeAnnotationConfig = () => {
            if (typeof ChartAnnotation !== 'undefined' && ChartAnnotation) {
                return {
                    annotation: {
                        annotations: {
                            metaLine: {
                                type: 'line',
                                yMin: 90,
                                yMax: 90,
                                borderColor: 'rgba(231, 76, 60, 1)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Meta CAS 90%',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                };
            } else {
                return {}; // Return empty config if plugin not available
            }
        };
        
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
                            },
                            tooltip: {
                                backgroundColor: 'rgba(33, 37, 41, 0.95)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: 'var(--primary-orange)',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: function(context) {
                                        return `📊 ${context[0].label}`;
                                    },
                                    beforeBody: function(context) {
                                        const dataIndex = context[0].dataIndex;
                                        const groupData = window.dashboard?.data?.groups?.[dataIndex];
                                        return [
                                            `Performance: ${context[0].parsed.y}%`,
                                            `Sucursales: ${groupData?.totalSucursales || 'N/A'}`,
                                            `Supervisiones: ${groupData?.totalEvaluaciones || 'N/A'}`
                                        ];
                                    },
                                    label: function(context) {
                                        const dataIndex = context.dataIndex;
                                        const groupData = dashboard.data.groups[dataIndex];
                                        
                                        if (context.parsed.y >= 90) {
                                            return '🟢 Excelente - Meta CAS alcanzada';
                                        } else if (context.parsed.y >= 70) {
                                            return '🟡 Bueno - Cerca de la meta';
                                        } else {
                                            return '🔴 Crítico - Requiere atención';
                                        }
                                    },
                                    afterBody: function(context) {
                                        return ['', '💡 Click para filtrar por este grupo'];
                                    }
                                }
                            },
                            ...getSafeAnnotationConfig()  // SAFE: Add annotation only if plugin available
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
                            },
                            tooltip: {
                                backgroundColor: 'rgba(33, 37, 41, 0.95)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: 'var(--critical)',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: function(context) {
                                        return `⚠️  ${context[0].label}`;
                                    },
                                    beforeBody: function(context) {
                                        const dataIndex = context[0].dataIndex;
                                        const areaData = window.dashboard?.data?.areas?.[dataIndex];
                                        return [
                                            `Performance promedio: ${context[0].parsed}%`,
                                            `Evaluaciones: ${areaData?.evaluaciones || 'N/A'}`,
                                            `Sucursales afectadas: ${areaData?.sucursales_afectadas || 'N/A'}`
                                        ];
                                    },
                                    label: function(context) {
                                        if (context.parsed >= 90) {
                                            return '🟢 Área fuerte - Mantener estándar';
                                        } else if (context.parsed >= 70) {
                                            return '🟡 Área de mejora - Atención moderada';
                                        } else {
                                            return '🔴 Área crítica - Acción inmediata requerida';
                                        }
                                    },
                                    afterBody: function(context) {
                                        return ['', '💡 Enfocarse en capacitación y procesos'];
                                    }
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

            // NEW: Sucursales Ranking (Bar Chart with 90% meta line)
            const sucursalesCtx = document.getElementById('sucursalesChart');
            if (sucursalesCtx) {
                this.charts.sucursales = new Chart(sucursalesCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Performance (%)',
                            data: [],
                            backgroundColor: 'rgba(46, 204, 113, 0.7)',
                            borderColor: 'rgba(46, 204, 113, 1)',
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
                            },
                            tooltip: {
                                backgroundColor: 'rgba(33, 37, 41, 0.95)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: 'var(--excellent)',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: function(context) {
                                        return `🏪 ${context[0].label}`;
                                    },
                                    beforeBody: function(context) {
                                        const dataIndex = context[0].dataIndex;
                                        const sucursalData = window.dashboard?.data?.sucursalesRanking?.[dataIndex];
                                        return [
                                            `Performance: ${context[0].parsed.y}%`,
                                            `Grupo: ${sucursalData?.grupo_operativo || 'N/A'}`,
                                            `Estado: ${sucursalData?.estado || 'N/A'}`,
                                            `Última supervisión: ${sucursalData?.fecha_supervision?.substring(0, 10) || 'N/A'}`
                                        ];
                                    },
                                    label: function(context) {
                                        if (context.parsed.y >= 90) {
                                            return '🟢 Excelente - Meta CAS alcanzada';
                                        } else if (context.parsed.y >= 70) {
                                            return '🟡 Bueno - Cerca de la meta';
                                        } else {
                                            return '🔴 Crítico - Requiere atención inmediata';
                                        }
                                    },
                                    afterBody: function(context) {
                                        const dataIndex = context[0].dataIndex;
                                        const sucursalData = window.dashboard?.data?.sucursalesRanking?.[dataIndex];
                                        const areasProblema = sucursalData?.areas_criticas || [];
                                        
                                        if (areasProblema.length > 0) {
                                            return ['', '⚠️  Áreas de oportunidad:', ...areasProblema.slice(0, 3).map(area => `• ${area}`)];
                                        } else {
                                            return ['', '💡 Click para ver detalles completos'];
                                        }
                                    }
                                }
                            },
                            ...getSafeAnnotationConfig()  // SAFE: Add annotation only if plugin available
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
                                    maxTicksLimit: 20
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

            // NEW: Update Sucursales Ranking Chart
            if (this.charts.sucursales && this.data.sucursalesRanking && this.data.sucursalesRanking.length > 0) {
                this.charts.sucursales.data.labels = this.data.sucursalesRanking.map(s => s.sucursal);
                this.charts.sucursales.data.datasets[0].data = this.data.sucursalesRanking.map(s => parseFloat(s.promedio));
                this.charts.sucursales.update();
                console.log('✅ Gráfico de sucursales actualizado');
            }
            
            // NEW: Call Areas visualization update
            this.updateAreasVisualization();
            
            // NEW: Update trends cards (NO TOCA LA GRÁFICA)
            this.updateTrendsCards();
            
        } catch (error) {
            console.error('❌ Error actualizando gráficos:', error);
        }
    }

    // =====================================================
    // AREAS DE OPORTUNIDAD v2.0 - NEW ENHANCED VISUALIZATION
    // =====================================================
    updateAreasVisualization() {
        try {
            if (this.data.areas && this.data.areas.length > 0) {
                console.log('🎯 Actualizando visualización Areas de Oportunidad v2.0...');
                
                // Update Heat Map
                this.renderHeatMap();
                
                // Update Top/Bottom Cards
                this.renderTopBottomCards();
                
                // Update existing bar chart with dynamic colors
                this.updateAreasBarChart();
                
                console.log('✅ Visualización Areas de Oportunidad v2.0 actualizada');
            }
        } catch (error) {
            console.error('❌ Error actualizando Areas de Oportunidad v2.0:', error);
        }
    }

    renderHeatMap() {
        const heatMapContainer = document.getElementById('areasHeatMap');
        if (!heatMapContainer || !this.data.areas) return;
        
        try {
            // Clear existing content
            heatMapContainer.innerHTML = '';
            
            // Create heat map items for all 29 areas
            this.data.areas.forEach((area, index) => {
                const item = document.createElement('div');
                item.className = `heat-map-item heat-map-${area.color_category || 'critical'}`;
                
                item.innerHTML = `
                    <div class="area-rank">#${area.rank_position || index + 1}</div>
                    <div class="area-name">${area.indicador}</div>
                    <div class="area-value">${parseFloat(area.promedio).toFixed(1)}%</div>
                `;
                
                // Add tooltip on hover
                item.title = `${area.indicador}: ${parseFloat(area.promedio).toFixed(1)}% (${area.evaluaciones} evaluaciones)`;
                
                heatMapContainer.appendChild(item);
            });
            
            console.log(`✅ Heat map rendered with ${this.data.areas.length} areas`);
            
        } catch (error) {
            console.error('❌ Error rendering heat map:', error);
        }
    }

    renderTopBottomCards() {
        const topPerformersContainer = document.getElementById('topPerformersCards');
        const criticalAreasContainer = document.getElementById('criticalAreasCards');
        
        if (!topPerformersContainer || !criticalAreasContainer || !this.data.areas) return;
        
        try {
            // Sort areas by performance (descending)
            const sortedAreas = [...this.data.areas].sort((a, b) => parseFloat(b.promedio) - parseFloat(a.promedio));
            
            // Top 5 performers
            const top5 = sortedAreas.slice(0, 5);
            topPerformersContainer.innerHTML = '';
            
            top5.forEach((area, index) => {
                const card = document.createElement('div');
                card.className = 'performance-card';
                card.innerHTML = `
                    <span class="name">${index + 1}. ${area.indicador}</span>
                    <span class="value">${parseFloat(area.promedio).toFixed(1)}%</span>
                `;
                card.title = `${area.evaluaciones} evaluaciones`;
                topPerformersContainer.appendChild(card);
            });
            
            // Bottom 5 critical areas
            const bottom5 = sortedAreas.slice(-5).reverse();
            criticalAreasContainer.innerHTML = '';
            
            bottom5.forEach((area, index) => {
                const card = document.createElement('div');
                card.className = 'critical-card';
                card.innerHTML = `
                    <span class="name">${sortedAreas.length - 4 + index}. ${area.indicador}</span>
                    <span class="value">${parseFloat(area.promedio).toFixed(1)}%</span>
                `;
                card.title = `${area.evaluaciones} evaluaciones - REQUIERE ATENCIÓN`;
                criticalAreasContainer.appendChild(card);
            });
            
            console.log('✅ Top/Bottom cards rendered');
            
        } catch (error) {
            console.error('❌ Error rendering top/bottom cards:', error);
        }
    }

    updateAreasBarChart() {
        if (!this.charts.areas || !this.data.areas) return;
        
        try {
            // Enhanced areas chart with dynamic colors based on performance
            const colors = this.data.areas.map(area => {
                const avg = parseFloat(area.promedio);
                if (avg >= 90) return 'rgba(0, 184, 148, 0.8)';        // Excellent - Green
                if (avg >= 80) return 'rgba(0, 206, 201, 0.8)';        // Good - Teal  
                if (avg >= 70) return 'rgba(253, 203, 110, 0.8)';      // Regular - Yellow
                return 'rgba(225, 112, 85, 0.8)';                      // Critical - Red
            });
            
            const borderColors = this.data.areas.map(area => {
                const avg = parseFloat(area.promedio);
                if (avg >= 90) return 'rgba(0, 184, 148, 1)';          // Excellent
                if (avg >= 80) return 'rgba(0, 206, 201, 1)';          // Good  
                if (avg >= 70) return 'rgba(253, 203, 110, 1)';        // Regular
                return 'rgba(225, 112, 85, 1)';                        // Critical
            });
            
            // Update chart type to bar for better visibility of colors
            this.charts.areas.config.type = 'bar';
            this.charts.areas.data.labels = this.data.areas.map(a => a.indicador);
            this.charts.areas.data.datasets = [{
                label: 'Performance (%)',
                data: this.data.areas.map(a => parseFloat(a.promedio)),
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }];
            
            // Update chart options for bar chart
            this.charts.areas.options = {
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
                            maxTicksLimit: 29
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            };
            
            this.charts.areas.update();
            console.log('✅ Areas bar chart updated with dynamic colors');
            
        } catch (error) {
            console.error('❌ Error updating areas bar chart:', error);
        }
    }

    // =====================================================
    // TENDENCIAS v2.0 - CARDS INFORMATIVOS (NO TOCA GRÁFICA)
    // =====================================================
    updateTrendsCards() {
        try {
            // Solo actualizar cards, NO tocar la gráfica existente
            console.log('📊 Actualizando cards de tendencias...');
            
            // Usar datos existentes del overview para no hacer calls adicionales
            if (this.data.overview && this.data.overview.promedio_general) {
                // Performance actual
                const currentPerf = document.getElementById('currentPerformance');
                if (currentPerf) {
                    currentPerf.textContent = `${this.data.overview.promedio_general}%`;
                }
                
                // Meta gap
                const metaGap = document.getElementById('metaGap');
                if (metaGap) {
                    const gap = parseFloat(this.data.overview.promedio_general) - 90;
                    const gapText = gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`;
                    const gapColor = gap >= 0 ? 'var(--excellent)' : 'var(--critical)';
                    metaGap.textContent = `Diferencia: ${gapText}`;
                    metaGap.style.color = gapColor;
                }
                
                // Compliance rate (usando datos de locations)
                const complianceRate = document.getElementById('complianceRate');
                if (complianceRate && this.data.locations && this.data.locations.length > 0) {
                    const sucursalesEnMeta = this.data.locations.filter(loc => 
                        parseFloat(loc.performance) >= 90
                    ).length;
                    const totalSucursales = this.data.locations.length;
                    const compliance = totalSucursales > 0 ? 
                        ((sucursalesEnMeta / totalSucursales) * 100).toFixed(1) : '0';
                    complianceRate.textContent = `${compliance}%`;
                }
                
                // Período actual (adaptativo a filtros)
                const currentPeriod = document.getElementById('currentPeriod');
                const periodDetail = document.getElementById('periodDetail');
                if (currentPeriod && periodDetail) {
                    if (this.currentFilters.periodoCas) {
                        // Mostrar período CAS específico
                        const periodMap = {
                            'nl_t1': 'T1 NL',
                            'nl_t2': 'T2 NL', 
                            'nl_t3': 'T3 NL',
                            'for_s1': 'S1 Foráneas',
                            'for_s2': 'S2 Foráneas'
                        };
                        currentPeriod.textContent = periodMap[this.currentFilters.periodoCas] || this.currentFilters.periodoCas;
                        periodDetail.textContent = 'Período CAS';
                    } else {
                        // Vista general
                        currentPeriod.textContent = '2025';
                        periodDetail.textContent = 'Q1-Q3';
                    }
                }
            }
            
            console.log('✅ Cards de tendencias actualizados');
            
        } catch (error) {
            console.error('❌ Error actualizando cards de tendencias:', error);
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
        
        // Special handling for tendencias (histórico) tab
        if (tabName === 'tendencias') {
            console.log('🎯 Activando tab Histórico - cargando datos CAS...');
            // Llamar a la nueva función de histórico
            setTimeout(() => {
                loadHistoricoData();
            }, 100); // Pequeño delay para asegurar que el tab esté visible
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
            this.loadKPIData(),           // Load filtered KPIs
            this.loadGroupData(),         // Load filtered groups - FIXED!
            this.loadLocationData(),      // Load filtered locations
            this.loadAreaData(),          // Load filtered areas
            this.loadTrendData(),         // Load filtered trends
            this.loadSucursalesRanking()  // NEW: Load filtered sucursales ranking
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
            this.loadGroupData(),         // Load groups without filters - FIXED!
            this.loadLocationData(),
            this.loadAreaData(),
            this.loadTrendData(),
            this.loadSucursalesRanking()  // NEW: Load sucursales ranking without filters
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
// NUEVAS FUNCIONES PARA TAB HISTÓRICO
// =====================================================

// Variable global para el chart histórico
let historicoChart = null;

// Función para cargar datos históricos
async function loadHistoricoData() {
    console.log('📊 === INICIANDO CARGA DE DATOS HISTÓRICOS ===');
    
    // Verificar que el dashboard existe
    if (!dashboard) {
        console.error('❌ Dashboard no está inicializado');
        return;
    }
    
    dashboard.showLoading();
    
    try {
        // Verificar conectividad básica
        console.log('🔗 Verificando conectividad API...');
        
        // Obtener datos reales de trimestres
        console.log('📅 Obteniendo datos de trimestres...');
        const trimestreResponse = await fetch('/api/trimestres');
        if (!trimestreResponse.ok) {
            throw new Error(`API trimestres falló: ${trimestreResponse.status}`);
        }
        const trimestreData = await trimestreResponse.json();
        console.log('✅ Trimestres obtenidos:', trimestreData);
        
        // Obtener lista de grupos reales
        console.log('👥 Obteniendo lista de grupos...');
        const gruposResponse = await fetch('/api/grupos');
        if (!gruposResponse.ok) {
            throw new Error(`API grupos falló: ${gruposResponse.status}`);
        }
        const grupos = await gruposResponse.json();
        console.log('✅ Grupos obtenidos:', grupos);
        
        if (!grupos || grupos.length === 0) {
            console.warn('⚠️ No se encontraron grupos - usando fallback');
            const gruposFallback = [
                { name: 'OGAS' }, { name: 'TEPEYAC' }, { name: 'RAP' }, { name: 'CRR' }, { name: 'EXPO' }
            ];
            createGruposCheckboxes(gruposFallback);
            updateHistoricoChart({ _periodos: [] }, gruposFallback);
            return;
        }
        
        // Normalizar nombres de grupos (usar "grupo_operativo" del API)
        const gruposNormalizados = grupos.map(g => ({
            name: g.grupo_operativo || g.name || g.grupo || 'Sin nombre'
        }));
        console.log('📝 Grupos normalizados:', gruposNormalizados);
        
        // Crear checkboxes de grupos reales
        console.log('☑️ Creando checkboxes de grupos...');
        createGruposCheckboxes(gruposNormalizados);
        
        // Obtener datos históricos por período CAS para cada grupo
        console.log('📈 Obteniendo datos históricos por período CAS...');
        const historicoData = await fetchHistoricoByTrimestre(gruposNormalizados, trimestreData);
        console.log('✅ Datos históricos obtenidos:', historicoData);
        
        // Verificar que tenemos datos para graficar
        const hasData = Object.keys(historicoData).some(key => 
            key !== '_periodos' && historicoData[key] && 
            historicoData[key].some(value => value !== null)
        );
        
        if (!hasData) {
            console.warn('⚠️ No hay datos válidos para graficar');
        }
        
        // Actualizar gráfica con datos reales
        console.log('📊 Actualizando gráfica histórica...');
        updateHistoricoChart(historicoData, gruposNormalizados);
        
        // Actualizar cards existentes si el dashboard lo soporta
        if (dashboard.updateTrendCards) {
            console.log('📋 Actualizando cards de tendencias...');
            dashboard.updateTrendCards();
        }
        
        console.log('✅ === DATOS HISTÓRICOS CARGADOS EXITOSAMENTE ===');
        
    } catch (error) {
        console.error('❌ === ERROR CARGANDO HISTÓRICO ===');
        console.error('Error details:', error);
        console.error('Stack:', error.stack);
        
        // Mostrar en UI si es posible
        const chartContainer = document.getElementById('tendenciasChart');
        if (chartContainer && chartContainer.parentElement) {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error cargando datos históricos</h4>
                    <p>Revisa la consola para más detalles</p>
                    <button onclick="window.debugFunctions.forceLoadHistorico()" 
                            style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reintentar
                    </button>
                </div>
            `;
            chartContainer.parentElement.appendChild(errorDiv);
        }
        
    } finally {
        dashboard.hideLoading();
    }
}

// Crear checkboxes dinámicamente
function createGruposCheckboxes(grupos) {
    const container = document.getElementById('gruposCheckboxes');
    if (!container) return;
    
    container.innerHTML = grupos.map(grupo => `
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" 
                   class="grupo-checkbox" 
                   value="${grupo.name}" 
                   checked
                   style="margin-right: 5px;">
            <span>${grupo.name}</span>
        </label>
    `).join('');
    
    // Event listeners
    document.querySelectorAll('.grupo-checkbox').forEach(cb => {
        cb.addEventListener('change', () => updateHistoricoFromCheckboxes());
    });
}

// Obtener datos históricos por períodos CAS para cada grupo
async function fetchHistoricoByTrimestre(grupos, trimestreData) {
    try {
        const historicoData = {};
        
        // Períodos CAS reales en orden cronológico
        const periodosCAS = [
            { id: 'nl_t1', label: 'NL-T1', nombre: 'NL-T1 (Mar-Abr)', fecha: '2025-03-12' },
            { id: 'for_s1', label: 'FOR-S1', nombre: 'FOR-S1 (Abr-Jun)', fecha: '2025-04-10' },
            { id: 'nl_t2', label: 'NL-T2', nombre: 'NL-T2 (Jun-Ago)', fecha: '2025-06-11' },
            { id: 'for_s2', label: 'FOR-S2', nombre: 'FOR-S2 (Jul-Ago)', fecha: '2025-07-30' },
            { id: 'nl_t3', label: 'NL-T3', nombre: 'NL-T3 (Ago-Act)', fecha: '2025-08-19' }
        ];
        
        let totalEPL = 0;
        let countEPL = 0;
        
        console.log('📊 Obteniendo datos históricos por períodos CAS...');
        
        // Para cada grupo, obtener su performance por período CAS
        for (const grupo of grupos) {
            const grupoData = [];
            
            console.log(`📈 Procesando grupo: ${grupo.name}`);
            
            for (const periodo of periodosCAS) {
                try {
                    // Usar el endpoint /api/grupos con filtro de periodoCas
                    const url = `/api/grupos?grupo=${encodeURIComponent(grupo.name)}&periodoCas=${periodo.id}`;
                    console.log(`🔗 Fetching: ${url}`);
                    
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log(`📦 Response for ${grupo.name} ${periodo.id}:`, data);
                    
                    if (data && data.length > 0 && data[0].promedio !== null) {
                        const performance = parseFloat(data[0].promedio);
                        grupoData.push(performance);
                        totalEPL += performance;
                        countEPL++;
                        console.log(`✅ ${grupo.name} ${periodo.label}: ${performance}%`);
                    } else {
                        grupoData.push(null); // Sin datos para este período
                        console.log(`⚪ ${grupo.name} ${periodo.label}: Sin datos`);
                    }
                } catch (error) {
                    console.error(`❌ Error fetching data for ${grupo.name} ${periodo.id}:`, error);
                    grupoData.push(null);
                }
            }
            
            historicoData[grupo.name] = grupoData;
        }
        
        // Calcular promedio EPL real de todos los datos disponibles
        const promedioEPLReal = countEPL > 0 ? parseFloat((totalEPL / countEPL).toFixed(1)) : 85.7;
        historicoData['Promedio EPL'] = Array(periodosCAS.length).fill(promedioEPLReal);
        
        console.log(`📊 Promedio EPL calculado: ${promedioEPLReal}% (basado en ${countEPL} datos)`);
        
        // Guardar períodos para uso en el chart
        historicoData._periodos = periodosCAS;
        
        return historicoData;
        
    } catch (error) {
        console.error('❌ Error in fetchHistoricoByTrimestre:', error);
        // Fallback con datos vacíos
        const fallback = {};
        const periodosFallback = [
            { id: 'nl_t1', label: 'NL-T1', nombre: 'NL-T1 (Mar-Abr)' },
            { id: 'for_s1', label: 'FOR-S1', nombre: 'FOR-S1 (Abr-Jun)' },
            { id: 'nl_t2', label: 'NL-T2', nombre: 'NL-T2 (Jun-Ago)' },
            { id: 'for_s2', label: 'FOR-S2', nombre: 'FOR-S2 (Jul-Ago)' },
            { id: 'nl_t3', label: 'NL-T3', nombre: 'NL-T3 (Ago-Act)' }
        ];
        
        grupos.forEach(grupo => {
            fallback[grupo.name] = Array(periodosFallback.length).fill(null);
        });
        fallback['Promedio EPL'] = Array(periodosFallback.length).fill(85.7);
        fallback._periodos = periodosFallback;
        return fallback;
    }
}

// Toggle todos los grupos
function toggleAllGroups(checked) {
    document.querySelectorAll('.grupo-checkbox').forEach(cb => {
        cb.checked = checked;
    });
    updateHistoricoFromCheckboxes();
}

// Actualizar gráfica basada en checkboxes
function updateHistoricoFromCheckboxes() {
    const selectedGroups = Array.from(document.querySelectorAll('.grupo-checkbox:checked'))
        .map(cb => cb.value);
    
    // Filtrar datasets basado en grupos seleccionados
    if (window.trendsChart) {
        window.trendsChart.data.datasets.forEach(dataset => {
            if (dataset.label === 'Promedio EPL') {
                dataset.hidden = false; // Siempre mostrar promedio
            } else {
                dataset.hidden = !selectedGroups.includes(dataset.label);
            }
        });
        window.trendsChart.update();
    }
}

// Actualizar gráfica de líneas
function updateHistoricoChart(trendsData, grupos) {
    const ctx = document.getElementById('tendenciasChart');
    if (!ctx) return;
    
    // Destruir chart anterior si existe
    if (window.trendsChart) {
        window.trendsChart.destroy();
        window.trendsChart = null;
    }
    
    // También destruir el chart del dashboard si existe
    if (dashboard && dashboard.charts && dashboard.charts.tendencias) {
        dashboard.charts.tendencias.destroy();
        dashboard.charts.tendencias = null;
    }
    
    // Colores para cada grupo
    const colors = [
        '#27AE60', // Verde
        '#3498DB', // Azul
        '#E74C3C', // Rojo
        '#F39C12', // Naranja
        '#9B59B6', // Morado
        '#1ABC9C', // Turquesa
        '#34495E', // Gris oscuro
        '#E67E22', // Naranja oscuro
        '#2ECC71', // Verde claro
        '#95A5A6'  // Gris
    ];
    
    // Obtener períodos de los datos o usar fallback
    const periodos = trendsData._periodos || [
        { label: 'NL-T1', nombre: 'NL-T1 (Mar-Abr)' },
        { label: 'FOR-S1', nombre: 'FOR-S1 (Abr-Jun)' },
        { label: 'NL-T2', nombre: 'NL-T2 (Jun-Ago)' },
        { label: 'FOR-S2', nombre: 'FOR-S2 (Jul-Ago)' },
        { label: 'NL-T3', nombre: 'NL-T3 (Ago-Act)' }
    ];
    
    const labels = periodos.map(p => p.label);
    
    // Crear datasets con datos reales
    const datasets = [];
    let colorIndex = 0;
    const allValues = []; // Para calcular escala dinámica
    
    // Agregar cada grupo operativo real
    grupos.forEach(grupo => {
        if (trendsData[grupo.name]) {
            const data = trendsData[grupo.name];
            datasets.push({
                label: grupo.name,
                data: data,
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '20',
                tension: 0.3,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                spanGaps: false
            });
            
            // Recopilar valores no nulos para escala
            data.forEach(value => {
                if (value !== null && value !== undefined) {
                    allValues.push(parseFloat(value));
                }
            });
            
            colorIndex++;
        }
    });
    
    // Agregar línea de promedio EPL real
    if (trendsData['Promedio EPL']) {
        const promedioEPLData = trendsData['Promedio EPL'];
        datasets.push({
            label: 'Promedio EPL',
            data: promedioEPLData,
            borderColor: '#E74C3C',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0
        });
        
        // Agregar promedio a valores para escala
        if (promedioEPLData[0] !== null) {
            allValues.push(parseFloat(promedioEPLData[0]));
        }
    }
    
    // Calcular escala dinámica
    const minValue = allValues.length > 0 ? Math.min(...allValues) : 75;
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 95;
    const padding = 5;
    const suggestedMin = Math.max(0, Math.floor(minValue - padding));
    const suggestedMax = Math.ceil(maxValue + padding);
    
    console.log(`📊 Escala dinámica: ${suggestedMin}% - ${suggestedMax}% (datos: ${minValue.toFixed(1)}% - ${maxValue.toFixed(1)}%)`);
    
    try {
        window.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución Histórica por Período CAS - Performance',
                    font: { 
                        size: window.innerWidth < 768 ? 14 : 16, 
                        weight: 'bold' 
                    },
                    padding: window.innerWidth < 768 ? 10 : 20
                },
                legend: {
                    display: true,
                    position: window.innerWidth < 768 ? 'top' : 'bottom',
                    labels: {
                        padding: window.innerWidth < 768 ? 10 : 20,
                        usePointStyle: true,
                        font: { size: window.innerWidth < 768 ? 10 : 12 },
                        boxWidth: window.innerWidth < 768 ? 15 : 20
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const periodo = periodos[context[0].dataIndex];
                            return periodo ? periodo.nombre : context[0].label;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + '%';
                            } else {
                                label += 'Sin datos';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: suggestedMin,
                    suggestedMax: suggestedMax,
                    ticks: {
                        stepSize: Math.max(1, Math.ceil((suggestedMax - suggestedMin) / 8)),
                        callback: function(value) {
                            return value + '%';
                        },
                        font: { size: window.innerWidth < 768 ? 10 : 12 }
                    },
                    grid: {
                        color: '#e0e0e0'
                    },
                    title: {
                        display: window.innerWidth >= 768,
                        text: 'Performance (%)',
                        font: { size: window.innerWidth < 768 ? 12 : 14 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: window.innerWidth < 768 ? 10 : 12 },
                        maxRotation: window.innerWidth < 768 ? 45 : 0
                    },
                    title: {
                        display: window.innerWidth >= 768,
                        text: 'Período CAS 2025',
                        font: { size: window.innerWidth < 768 ? 12 : 14 }
                    }
                }
            }
        }
    });
        
        console.log('✅ Gráfica histórica creada exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando gráfica histórica:', error);
        // Intentar limpiar cualquier chart residual
        const chartStatus = Chart.getChart('tendenciasChart');
        if (chartStatus) {
            chartStatus.destroy();
        }
        throw error; // Re-lanzar para que lo maneje el caller
    }
}

// =====================================================
// INITIALIZATION
// =====================================================
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing dashboard...');
    dashboard = new ElPolloLocoDashboard();
    window.dashboard = dashboard; // Make globally available for tooltips
});

// Telegram WebApp integration
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    console.log('📱 Telegram WebApp initialized');
}

// =====================================================
// FUNCIONES DE DEBUG Y TESTING
// =====================================================

// Función para probar endpoints de API
async function testApiEndpoints() {
    console.log('🧪 Iniciando test de endpoints API...');
    
    const endpoints = [
        '/api/grupos',
        '/api/trimestres',
        '/api/kpis'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            console.log(`✅ ${endpoint}:`, data);
        } catch (error) {
            console.error(`❌ ${endpoint}:`, error);
        }
    }
}

// Función para probar datos específicos de períodos CAS
async function testPeriodosCAS() {
    console.log('🧪 Probando períodos CAS específicos...');
    
    const periodos = ['nl_t1', 'for_s1', 'nl_t2', 'for_s2', 'nl_t3'];
    const grupos = ['OGAS', 'TEPEYAC', 'RAP', 'CRR', 'EXPO'];
    
    for (const periodo of periodos) {
        for (const grupo of grupos) {
            try {
                const response = await fetch(`/api/grupos?grupo=${encodeURIComponent(grupo)}&periodoCas=${periodo}`);
                const data = await response.json();
                if (data && data.length > 0 && data[0].promedio !== null) {
                    console.log(`✅ ${grupo} ${periodo}: ${data[0].promedio}%`);
                } else {
                    console.log(`⚪ ${grupo} ${periodo}: Sin datos`);
                }
            } catch (error) {
                console.error(`❌ ${grupo} ${periodo}:`, error);
            }
        }
    }
}

// Función para forzar carga del histórico (debugging)
async function forceLoadHistorico() {
    console.log('🔄 Forzando carga del histórico para debugging...');
    
    try {
        await loadHistoricoData();
        console.log('✅ Histórico cargado exitosamente');
    } catch (error) {
        console.error('❌ Error cargando histórico:', error);
    }
}

// Exponer funciones al objeto window para debugging
window.debugFunctions = {
    testApiEndpoints,
    testPeriodosCAS,
    forceLoadHistorico
};

console.log('🛠️ Funciones de debug disponibles en window.debugFunctions');
console.log('💡 Ejemplo: window.debugFunctions.testApiEndpoints()');
console.log('💡 Ejemplo: window.debugFunctions.testPeriodosCAS()');
console.log('💡 Ejemplo: window.debugFunctions.forceLoadHistorico()');

// Auto-test al cargar la página (opcional)
if (window.location.search.includes('debug=true')) {
    setTimeout(() => {
        console.log('🚀 Auto-ejecutando tests por parámetro debug=true...');
        testApiEndpoints();
    }, 2000);
}

// =====================================================
// FUNCIÓN PARA GENERAR REPORTE
// =====================================================
function generateReport() {
    try {
        // Get current filter values from the dashboard
        const grupo = document.getElementById('grupoFilter')?.value || 'all';
        const estado = document.getElementById('estadoFilter')?.value || 'all';
        const trimestre = document.getElementById('trimestreFilter')?.value || 'all';
        const periodoCas = document.getElementById('periodoCasFilter')?.value || 'all';
        
        // Create download URL with all current filters
        const params = new URLSearchParams({
            estado: estado,
            trimestre: trimestre,
            periodoCas: periodoCas,
            format: 'html'
        });
        
        const reportUrl = `${window.location.origin}/api/generate-report/${grupo}?${params}`;
        
        console.log('📊 Generating report with URL:', reportUrl);
        
        // Open report in new window
        window.open(reportUrl, '_blank');
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error al generar el reporte');
    }
}