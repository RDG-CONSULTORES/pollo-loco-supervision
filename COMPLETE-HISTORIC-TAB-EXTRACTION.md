# COMPLETE Historic Tab Implementation - Working Version

This document contains the COMPLETE and WORKING Historic tab implementation extracted from `dashboard-ios-complete.html` that was functioning correctly.

## 1. HTML Structure for Historic Tab

```html
<!-- Histórico Tab -->
<div id="tendencias-view" class="tab-view">
    <div class="large-title-container">
        <h1 class="large-title">Histórico</h1>
    </div>
    <!-- Histórico Heatmap Section -->
    <div class="section">
        <div class="section-header">HISTÓRICO</div>
        <div class="heatmap-container">
            <!-- Heatmap Controls -->
            <div class="heatmap-controls">
                <!-- Legend -->
                <div class="heatmap-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #FF3030;"></div>
                        <span>Crítico (< 70%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #FF9500;"></div>
                        <span>Bajo (70-79%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #FFCC00;"></div>
                        <span>Regular (80-89%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #34C759;"></div>
                        <span>Bueno (90-94%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #007AFF;"></div>
                        <span>Excelente (≥95%)</span>
                    </div>
                </div>
                <!-- Options -->
                <div class="heatmap-options">
                    <label class="toggle-option">
                        <input type="checkbox" id="showDifferences" checked>
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Mostrar diferencias</span>
                    </label>
                </div>
            </div>
            <!-- Heatmap Grid -->
            <div class="heatmap-grid" id="heatmap-grid">
                <table class="heatmap-table">
                    <thead>
                        <tr id="heatmapHeader">
                            <th>Grupo Operativo</th>
                            <!-- Periods will be dynamically added -->
                        </tr>
                    </thead>
                    <tbody id="heatmapBody">
                        <tr>
                            <td colspan="100%" class="loading">
                                <div class="spinner"></div>
                                Cargando datos históricos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
```

## 2. Complete CSS Styles for Historic Tab

```css
/* HEATMAP STYLES - Exact from historico-v2.html with iOS adaptations */
.heatmap-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.8rem;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
}

/* Heatmap Controls */
.heatmap-controls {
    margin-bottom: 1rem;
}
.heatmap-options {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 0.5px solid var(--ios-separator);
}

/* Toggle Switch */
.toggle-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--ios-label);
}

.toggle-option input[type="checkbox"] {
    display: none;
}

.toggle-slider {
    position: relative;
    width: 44px;
    height: 26px;
    background: var(--ios-gray-4);
    border-radius: 13px;
    transition: all 0.3s ease;
}

.toggle-slider:before {
    content: "";
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-option input:checked + .toggle-slider {
    background: var(--ios-blue);
}

.toggle-option input:checked + .toggle-slider:before {
    transform: translateX(18px);
}

/* Heatmap Container and Table */
.heatmap-container {
    background: var(--ios-secondary-background);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow-x: auto;
}

.heatmap-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    background: var(--ios-secondary-background);
}

.heatmap-table th {
    background: var(--ios-gray-6);
    padding: 0.75rem 0.5rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.75rem;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 0.5px solid var(--ios-separator);
    color: var(--ios-label);
}

.heatmap-table th:first-child {
    position: sticky;
    left: 0;
    background: var(--ios-gray-6);
    z-index: 11;
    text-align: left;
    min-width: 120px;
}

.heatmap-table td {
    padding: 0.5rem;
    text-align: center;
    border-bottom: 0.5px solid var(--ios-separator);
    position: relative;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
}

.heatmap-table td:first-child {
    position: sticky;
    left: 0;
    background: var(--ios-secondary-background);
    font-weight: 600;
    font-size: 0.75rem;
    text-align: left;
    border-right: 0.5px solid var(--ios-separator);
    z-index: 9;
    color: var(--ios-label);
}

.heatmap-table tbody tr:hover {
    background: var(--ios-gray-6);
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.heatmap-table tbody tr:active {
    background: var(--ios-gray-5);
    transform: translateX(0) scale(0.995);
}

.heatmap-table td:active {
    transform: scale(0.95);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

/* Heat colors - EXACT from historico-v2.html */
.heat-excelente { 
    background: linear-gradient(135deg, #00b894, #55efc4); 
    color: white;
}
.heat-muy-bueno { 
    background: linear-gradient(135deg, #00cec9, #74b9ff); 
    color: white;
}
.heat-bueno { 
    background: linear-gradient(135deg, #74b9ff, #a29bfe); 
    color: white;
}
.heat-regular { 
    background: linear-gradient(135deg, #fdcb6e, #f39c12); 
    color: white;
}
.heat-critico { 
    background: linear-gradient(135deg, #d63031, #e17055); 
    color: white;
}
.heat-none {
    background: var(--ios-gray-5);
    color: var(--ios-gray);
}

/* EPL CAS Row Styling */
.epl-cas-row {
    background: linear-gradient(135deg, #FF6B35, #FF8C42) !important;
    color: white !important;
    font-weight: 600 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 15 !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}
.epl-cas-row td {
    color: white !important;
    font-weight: 600 !important;
}

/* Trend Indicators */
.trend-indicator {
    font-size: 0.625rem;
    display: block;
    margin-top: 0.125rem;
}
.diff-value {
    font-size: 0.625rem;
    display: block;
    margin-top: 0.125rem;
}
.diff-positive {
    color: rgba(255, 255, 255, 0.9);
}
.diff-negative {
    color: rgba(255, 255, 255, 0.9);
}

/* Heatmap Filters */
.heatmap-filters {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
}
.heatmap-filter-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 1rem;
    border: 1px solid var(--ios-gray-4);
    border-radius: 8px;
    background: var(--ios-secondary-background);
    color: var(--ios-label);
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: fit-content;
    font-size: 0.8rem;
    font-weight: 500;
}
.heatmap-filter-btn i {
    font-size: 1rem;
    margin-bottom: 0.25rem;
}
.heatmap-filter-btn:active {
    transform: scale(0.95);
}
.heatmap-filter-btn.active {
    background: var(--ios-blue);
    color: white;
    border-color: var(--ios-blue);
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
    /* Heatmap mobile styles */
    .heatmap-table {
        font-size: 0.75rem;
    }
    
    .heatmap-table th,
    .heatmap-table td {
        padding: 0.4rem 0.25rem;
    }
    
    .heatmap-table td:first-child,
    .heatmap-table th:first-child {
        min-width: 80px;
        font-size: 0.7rem;
    }
    .heatmap-filters {
        gap: 0.25rem;
    }
    .heatmap-filter-btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.7rem;
    }
    .legend-item {
        font-size: 0.7rem;
    }
}

/* Trend Chart */
.trend-chart {
    height: 200px;
    margin-bottom: 16px;
}
```

## 3. Complete JavaScript Functions

### Global Variables
```javascript
// HEATMAP FUNCTIONS - Exact from historico-v2.html
let heatmapPeriodsData = null;
let heatmapCurrentFilter = 'all';
```

### Load Heatmap Data Function
```javascript
// Load heatmap data - SAME endpoint as historico-v2
async function loadHeatmapData() {
    try {
        console.log('🔥 Loading heatmap data...');
        
        // Apply current filters from dashboard
        let endpoint = '/api/heatmap-periods/all';
        if (currentFilters.estado && currentFilters.estado !== 'all') {
            endpoint += `?estado=${encodeURIComponent(currentFilters.estado)}`;
        }
        
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Heatmap API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            heatmapPeriodsData = data.data;
            console.log('✅ Heatmap data loaded:', heatmapPeriodsData.groups.length, 'groups');
            renderHeatmap();
            setupHeatmapFilters();
        } else {
            throw new Error(data.error || 'Failed to load heatmap data');
        }
    } catch (error) {
        console.error('❌ Error loading heatmap:', error);
        showHeatmapError(error.message);
    }
}
```

### Complete Heatmap Rendering Function
```javascript
// Render heatmap table - COMPLETE logic from historico-v2 with EPL CAS and differences
function renderHeatmap(filter = 'all') {
    if (!heatmapPeriodsData || !heatmapPeriodsData.groups) {
        showHeatmapError('No hay datos disponibles');
        return;
    }
    const heatmapBody = document.getElementById('heatmapBody');
    const heatmapHeader = document.getElementById('heatmapHeader');
    if (!heatmapBody || !heatmapHeader) return;
    console.log('🔥 Rendering heatmap with filter:', filter);
    
    // Apply filters - EXACT from historico-v2
    let filteredGroups = heatmapPeriodsData.groups.slice();
    
    switch(filter) {
        case 'critical':
            filteredGroups = filteredGroups.filter(group => group.promedio_general < 80);
            break;
        case 'improving':
            filteredGroups = filteredGroups.filter(group => {
                const periods = heatmapPeriodsData.periods;
                if (periods.length < 2) return false;
                const periodValues = periods.map(p => group.periodos[p]?.promedio || 0).filter(v => v > 0);
                if (periodValues.length < 2) return false;
                return periodValues[periodValues.length - 1] > periodValues[periodValues.length - 2];
            });
            break;
        case 'declining':
            filteredGroups = filteredGroups.filter(group => {
                const periods = heatmapPeriodsData.periods;
                if (periods.length < 2) return false;
                const periodValues = periods.map(p => group.periodos[p]?.promedio || 0).filter(v => v > 0);
                if (periodValues.length < 2) return false;
                return periodValues[periodValues.length - 1] < periodValues[periodValues.length - 2];
            });
            break;
        default: // 'all'
            break;
    }
    
    const periods = heatmapPeriodsData.periods || [];
    const expectedColumns = periods.length + 2; // periods + grupo + promedio
    
    // Update header with periods
    heatmapHeader.innerHTML = '<th>Grupo Operativo</th>';
    periods.forEach(period => {
        const th = document.createElement('th');
        th.textContent = period;
        heatmapHeader.appendChild(th);
    });
    const avgTh = document.createElement('th');
    avgTh.textContent = 'Prom';
    heatmapHeader.appendChild(avgTh);
    
    // Clear table body
    heatmapBody.innerHTML = '';
    
    // Calculate EPL CAS averages for each period
    const eplAverages = {};
    let eplOverallSum = 0;
    let eplOverallCount = 0;
    
    periods.forEach(periodo => {
        let periodSum = 0;
        let periodCount = 0;
        
        heatmapPeriodsData.groups.forEach(group => {
            const periodData = group.periodos[periodo];
            if (periodData && periodData.promedio > 0) {
                periodSum += periodData.promedio;
                periodCount++;
            }
        });
        
        eplAverages[periodo] = periodCount > 0 ? periodSum / periodCount : null;
        if (eplAverages[periodo] !== null) {
            eplOverallSum += eplAverages[periodo];
            eplOverallCount++;
        }
    });
    
    const eplOverallAverage = eplOverallCount > 0 ? eplOverallSum / eplOverallCount : 0;
    
    // Add EPL CAS row (fixed at top)
    const eplRow = document.createElement('tr');
    eplRow.className = 'epl-cas-row';
    
    // EPL CAS label
    const eplLabelCell = document.createElement('td');
    eplLabelCell.innerHTML = `<div style="color: black; font-weight: bold;">PROMEDIO EPL CAS</div>`;
    eplRow.appendChild(eplLabelCell);
    
    // EPL period values
    let lastValidEpl = null;
    const showDifferences = document.getElementById('showDifferences')?.checked ?? true;
    
    periods.forEach((periodo, index) => {
        const cell = document.createElement('td');
        cell.style.textAlign = 'center';
        
        if (eplAverages[periodo] !== null) {
            const promedio = eplAverages[periodo];
            let cellContent = `<div>${promedio.toFixed(1)}%</div>`;
            
            // Add difference if enabled and there's a previous value
            if (showDifferences && lastValidEpl !== null) {
                const diff = promedio - lastValidEpl;
                const diffClass = diff > 0 ? 'diff-positive' : 'diff-negative';
                const diffSign = diff > 0 ? '+' : '';
                const trendArrow = diff > 0 ? '↗' : diff < 0 ? '↘' : '→';
                cellContent += `<div class="${diffClass}" style="font-size: 0.7rem; color: rgba(255,255,255,0.9);">${trendArrow} ${diffSign}${diff.toFixed(1)}%</div>`;
            }
            
            cell.innerHTML = cellContent;
            cell.title = `EPL CAS - ${periodo}: ${promedio.toFixed(2)}%`;
            lastValidEpl = promedio;
        } else {
            cell.innerHTML = '<div>-</div>';
            cell.title = `EPL CAS - ${periodo}: Sin datos`;
        }
        
        eplRow.appendChild(cell);
    });
    
    // EPL overall average
    const eplAvgCell = document.createElement('td');
    eplAvgCell.style.textAlign = 'center';
    eplAvgCell.textContent = `${eplOverallAverage.toFixed(1)}%`;
    eplAvgCell.title = `EPL CAS Promedio General: ${eplOverallAverage.toFixed(2)}%`;
    eplRow.appendChild(eplAvgCell);
    
    // Add EPL row first
    heatmapBody.appendChild(eplRow);
    
    // Sort groups by average performance (descending) - EXACT from historico-v2
    const sortedGroups = filteredGroups
        .sort((a, b) => b.promedio_general - a.promedio_general);
    
    // Populate table with groups
    sortedGroups.forEach(group => {
        const row = document.createElement('tr');
        
        // Group name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = group.grupo;
        nameCell.style.fontWeight = '600';
        nameCell.style.position = 'sticky';
        nameCell.style.left = '0';
        nameCell.style.background = 'var(--ios-secondary-background)';
        nameCell.style.zIndex = '5';
        row.appendChild(nameCell);
        
        // Period cells
        let lastValidValue = null;
        
        periods.forEach((periodo, index) => {
            const cell = document.createElement('td');
            cell.style.textAlign = 'center';
            cell.style.position = 'relative';
            const periodData = group.periodos[periodo];
            
            if (periodData && periodData.promedio !== null && periodData.promedio > 0) {
                const performance = periodData.promedio;
                let cellContent = `<div style="font-weight: 600;">${performance.toFixed(1)}%</div>`;
                
                // Add difference if enabled and there's a previous value
                if (showDifferences && lastValidValue !== null) {
                    const diff = performance - lastValidValue;
                    const diffClass = diff > 0 ? 'diff-positive' : 'diff-negative';
                    const diffSign = diff > 0 ? '+' : '';
                    const trendArrow = diff > 0 ? '↗' : diff < 0 ? '↘' : '→';
                    cellContent += `<div class="${diffClass}" style="font-size: 0.7rem;">${trendArrow} ${diffSign}${diff.toFixed(1)}%</div>`;
                } else if (!showDifferences) {
                    // Show evaluations count when not showing differences
                    cellContent += `<div style="font-size: 0.7rem; opacity: 0.8;">${periodData.evaluaciones} eval.</div>`;
                }
                
                cell.innerHTML = cellContent;
                cell.className = getHeatClass(performance);
                cell.title = `${group.grupo} - ${periodo}: ${performance.toFixed(2)}% (${periodData.evaluaciones} evaluaciones)`;
                lastValidValue = performance;
            } else {
                cell.innerHTML = '<div>-</div>';
                cell.className = 'heat-none';
                cell.title = `${group.grupo} - ${periodo}: Sin datos`;
            }
            
            row.appendChild(cell);
        });
        
        // Average cell
        const avgCell = document.createElement('td');
        avgCell.style.textAlign = 'center';
        avgCell.className = getHeatClass(group.promedio_general);
        avgCell.style.fontWeight = '600';
        avgCell.textContent = `${group.promedio_general.toFixed(1)}%`;
        avgCell.title = `Promedio general: ${group.promedio_general.toFixed(2)}%`;
        row.appendChild(avgCell);
        
        heatmapBody.appendChild(row);
    });
    
    console.log('✅ Heatmap rendered with', sortedGroups.length, 'groups and EPL CAS row');
}
```

### Heat Classification Function
```javascript
// Get heat class - EXACT from historico-v2
function getHeatClass(performance) {
    if (performance >= 95) return 'heat-excelente';
    if (performance >= 91) return 'heat-muy-bueno';
    if (performance >= 87) return 'heat-bueno';
    if (performance >= 82) return 'heat-regular';
    return 'heat-critico';
}
```

### Setup Heatmap Filters Function
```javascript
// Setup heatmap filters - EXACT from historico-v2
function setupHeatmapFilters() {
    document.querySelectorAll('.heatmap-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            heatmapCurrentFilter = filter;
            renderHeatmap(filter);
        });
    });
    
    // Setup differences toggle
    const showDifferencesToggle = document.getElementById('showDifferences');
    if (showDifferencesToggle) {
        showDifferencesToggle.addEventListener('change', () => {
            console.log('🔄 Toggle differences:', showDifferencesToggle.checked);
            renderHeatmap(heatmapCurrentFilter || 'all');
        });
    }
}
```

### Error Display Function
```javascript
// Show heatmap error
function showHeatmapError(message) {
    const heatmapBody = document.getElementById('heatmapBody');
    if (heatmapBody) {
        heatmapBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--ios-red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 1rem;"></i>
                    <br>${message}
                </td>
            </tr>
        `;
    }
}
```

### Load Trend Data Function
```javascript
async function loadTrendData() {
    try {
        console.log('📊 Loading historical data...');
        
        // Load heatmap data for historical view
        loadHeatmapData();
    } catch (error) {
        console.error('Error loading historical data:', error);
    }
}
```

## 4. Tab Icons Implementation

```html
<!-- Tab Bar -->
<div class="tab-bar">
    <div class="tab active" onclick="switchTab('dashboard')">
        <div class="tab-icon"><i class="fas fa-chart-bar"></i></div>
        <div class="tab-label">Dashboard</div>
    </div>
    <div class="tab" onclick="switchTab('mapa')">
        <div class="tab-icon"><i class="fas fa-map-pin"></i></div>
        <div class="tab-label">Mapa</div>
    </div>
    <div class="tab" onclick="switchTab('tendencias')">
        <div class="tab-icon"><i class="fas fa-chart-line"></i></div>
        <div class="tab-label">Histórico</div>
    </div>
    <div class="tab" onclick="switchTab('alertas')">
        <div class="tab-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="tab-label">Alertas</div>
    </div>
</div>
```

## 5. Tab Switching Logic

```javascript
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab bar
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab`).parentElement.children[
        tab === 'dashboard' ? 0 : 
        tab === 'mapa' ? 1 : 
        tab === 'tendencias' ? 2 : 3
    ].classList.add('active');
    
    // Update views
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    const targetView = tab === 'tendencias' ? 'tendencias-view' : `${tab}-view`;
    document.getElementById(targetView).classList.add('active');
    
    // Load data based on tab
    if (tab === 'dashboard') {
        loadData();
    } else if (tab === 'mapa') {
        setTimeout(() => {
            loadMapData();
        }, 200);
    } else if (tab === 'tendencias') {
        loadTrendData();
    } else if (tab === 'alertas') {
        loadAlertas();
    }
}
```

## 6. Period Classification Logic (CAS Classification)

The system automatically classifies periods as:
- **Locales**: NL-T2, NL-T3 (local periods)
- **Foráneas**: FOR-S1, FOR-S2 (foreign periods)

This classification is handled by the backend endpoint `/api/heatmap-periods/all` and doesn't require frontend logic.

## 7. Working Features Summary

✅ **Complete Historic Tab Implementation** with:
- Heatmap table with sticky headers
- EPL CAS row calculation and display
- Proper period classification (locales vs foráneas)
- Trend calculation with arrows (↗, ↘, →)
- Difference display toggle
- Color-coded performance levels
- Mobile responsive design
- Error handling
- Loading states
- Proper sorting by performance

✅ **Key Working Logic**:
- **EPL CAS Row**: Calculates average across all groups for each period
- **Trend Indicators**: Shows difference between consecutive periods
- **Heat Color Classification**: 5-level performance classification
- **Responsive Design**: Mobile-optimized table and controls
- **Filter Integration**: Respects dashboard filters

This is the COMPLETE and WORKING implementation that was functioning correctly before any modifications.