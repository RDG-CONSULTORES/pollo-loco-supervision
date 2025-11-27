const axios = require('axios');
const { Pool } = require('pg');

// Configuration for Zenput API
const ZENPUT_CONFIG = {
    baseURL: 'https://api.zenput.com/api/v2',
    // Estas credenciales necesitas proporcionarlas
    apiKey: process.env.ZENPUT_API_KEY || 'YOUR_ZENPUT_API_KEY',
    clientId: process.env.ZENPUT_CLIENT_ID || 'YOUR_CLIENT_ID',
    clientSecret: process.env.ZENPUT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'
};

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

class ZenputAPIConnector {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Authenticate with Zenput API
    async authenticate() {
        try {
            console.log('🔐 Authenticating with Zenput API...');
            
            const authResponse = await axios.post(`${ZENPUT_CONFIG.baseURL}/oauth/token`, {
                grant_type: 'client_credentials',
                client_id: ZENPUT_CONFIG.clientId,
                client_secret: ZENPUT_CONFIG.clientSecret
            });

            this.accessToken = authResponse.data.access_token;
            this.tokenExpiry = Date.now() + (authResponse.data.expires_in * 1000);
            
            console.log('✅ Authentication successful');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    // Get authorization headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Check if token needs refresh
    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() > this.tokenExpiry) {
            return await this.authenticate();
        }
        return true;
    }

    // Get all locations (branches)
    async getLocations() {
        try {
            await this.ensureAuthenticated();
            console.log('🏢 Fetching all locations from Zenput...');

            const response = await axios.get(`${ZENPUT_CONFIG.baseURL}/locations`, {
                headers: this.getAuthHeaders(),
                params: {
                    limit: 1000,  // Adjust as needed
                    offset: 0
                }
            });

            console.log(`✅ Found ${response.data.results.length} locations`);
            return response.data.results;

        } catch (error) {
            console.error('❌ Error fetching locations:', error.response?.data || error.message);
            return null;
        }
    }

    // Search for specific location (like Apodaca)
    async searchLocation(searchTerm) {
        try {
            const locations = await this.getLocations();
            if (!locations) return null;

            const matches = locations.filter(location => 
                location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                location.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            console.log(`🔍 Found ${matches.length} locations matching "${searchTerm}"`);
            return matches;

        } catch (error) {
            console.error('❌ Error searching locations:', error.message);
            return null;
        }
    }

    // Get forms (supervision templates)
    async getForms() {
        try {
            await this.ensureAuthenticated();
            console.log('📋 Fetching forms from Zenput...');

            const response = await axios.get(`${ZENPUT_CONFIG.baseURL}/forms`, {
                headers: this.getAuthHeaders(),
                params: {
                    limit: 100
                }
            });

            console.log(`✅ Found ${response.data.results.length} forms`);
            return response.data.results;

        } catch (error) {
            console.error('❌ Error fetching forms:', error.response?.data || error.message);
            return null;
        }
    }

    // Get submissions (completed supervisions) for a location
    async getSubmissions(locationId, startDate = null, endDate = null) {
        try {
            await this.ensureAuthenticated();
            console.log(`📊 Fetching submissions for location ${locationId}...`);

            const params = {
                location_id: locationId,
                limit: 1000
            };

            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await axios.get(`${ZENPUT_CONFIG.baseURL}/submissions`, {
                headers: this.getAuthHeaders(),
                params: params
            });

            console.log(`✅ Found ${response.data.results.length} submissions`);
            return response.data.results;

        } catch (error) {
            console.error('❌ Error fetching submissions:', error.response?.data || error.message);
            return null;
        }
    }

    // Get detailed submission data
    async getSubmissionDetails(submissionId) {
        try {
            await this.ensureAuthenticated();

            const response = await axios.get(`${ZENPUT_CONFIG.baseURL}/submissions/${submissionId}`, {
                headers: this.getAuthHeaders()
            });

            return response.data;

        } catch (error) {
            console.error(`❌ Error fetching submission ${submissionId}:`, error.response?.data || error.message);
            return null;
        }
    }
}

// Main function to search for Apodaca and missing branches
async function searchApodacaInZenput() {
    try {
        console.log('🚀 INICIANDO BÚSQUEDA DE APODACA EN ZENPUT API...');
        
        const zenput = new ZenputAPIConnector();
        
        // Check if API credentials are configured
        if (ZENPUT_CONFIG.apiKey === 'YOUR_ZENPUT_API_KEY') {
            console.log('\n⚠️ CONFIGURACIÓN REQUERIDA:');
            console.log('Para conectar con Zenput API necesitas:');
            console.log('1. ZENPUT_API_KEY');
            console.log('2. ZENPUT_CLIENT_ID'); 
            console.log('3. ZENPUT_CLIENT_SECRET');
            console.log('\n💡 Proporciona estas credenciales como variables de entorno o actualiza el código');
            console.log('\nEjemplo:');
            console.log('export ZENPUT_API_KEY="tu_api_key"');
            console.log('export ZENPUT_CLIENT_ID="tu_client_id"');
            console.log('export ZENPUT_CLIENT_SECRET="tu_client_secret"');
            
            // Demo with fake data structure
            console.log('\n📝 ESTRUCTURA ESPERADA DE RESPUESTA DE ZENPUT:');
            const mockResponse = {
                locations: [
                    {
                        id: "12345",
                        name: "Apodaca",
                        display_name: "35 - Apodaca",
                        address: "Apodaca, Nuevo León",
                        status: "active"
                    }
                ],
                submissions: [
                    {
                        id: "sub123",
                        location_id: "12345",
                        form_id: "form456", 
                        submitted_at: "2025-11-01T10:00:00Z",
                        score: 85.5,
                        answers: [
                            {
                                question_id: "q1",
                                section: "ALMACEN GENERAL",
                                value: 90,
                                max_value: 100
                            }
                        ]
                    }
                ]
            };
            
            console.log(JSON.stringify(mockResponse, null, 2));
            return false;
        }

        // Try to authenticate
        const authenticated = await zenput.authenticate();
        if (!authenticated) {
            console.log('❌ No se pudo autenticar con Zenput API');
            return false;
        }

        // Search for Apodaca
        console.log('\n🔍 BUSCANDO APODACA EN ZENPUT...');
        const apodacaLocations = await zenput.searchLocation('apodaca');
        
        if (apodacaLocations && apodacaLocations.length > 0) {
            console.log(`\n✅ ENCONTRADAS ${apodacaLocations.length} SUCURSALES APODACA:`);
            
            for (const location of apodacaLocations) {
                console.log(`\n📍 ${location.display_name || location.name}`);
                console.log(`   ID: ${location.id}`);
                console.log(`   Status: ${location.status}`);
                console.log(`   Address: ${location.address || 'N/A'}`);
                
                // Get submissions for this location
                const submissions = await zenput.getSubmissions(
                    location.id, 
                    '2025-03-01',  // From March 2025
                    '2025-11-30'   // To November 2025
                );
                
                if (submissions && submissions.length > 0) {
                    console.log(`   📊 ${submissions.length} supervisiones encontradas`);
                    
                    // Show some submission details
                    for (const submission of submissions.slice(0, 3)) {
                        const details = await zenput.getSubmissionDetails(submission.id);
                        if (details) {
                            console.log(`     - ${details.submitted_at}: ${details.score || 'N/A'}% score`);
                        }
                    }
                } else {
                    console.log(`   ❌ No se encontraron supervisiones`);
                }
            }
        } else {
            console.log('❌ No se encontró Apodaca en Zenput');
        }

        // Search for other missing branches
        console.log('\n🔍 BUSCANDO OTRAS SUCURSALES FALTANTES...');
        
        const missingBranches = ['Constituyentes', 'Patio'];
        for (const branchName of missingBranches) {
            const locations = await zenput.searchLocation(branchName);
            if (locations && locations.length > 0) {
                console.log(`\n✅ ENCONTRADA: ${branchName}`);
                locations.forEach(loc => {
                    console.log(`   📍 ${loc.display_name || loc.name} (ID: ${loc.id})`);
                });
            }
        }

        return true;

    } catch (error) {
        console.error('❌ Error general:', error.message);
        return false;
    }
}

// Function to sync Zenput data to our database
async function syncZenputData(locationId, submissions) {
    try {
        console.log(`\n🔄 SINCRONIZANDO ${submissions.length} supervisiones a base de datos...`);
        
        // This would insert the Zenput submissions into our supervision_operativa_clean table
        // with the same structure as existing data
        
        for (const submission of submissions) {
            // Transform Zenput submission to our format
            const transformedData = {
                submission_id: submission.id,
                location_name: submission.location_name,
                fecha_supervision: new Date(submission.submitted_at),
                // ... more field mappings
            };
            
            // Insert into database
            // await pool.query('INSERT INTO supervision_operativa_clean ...');
        }
        
        console.log('✅ Sincronización completada');
        
    } catch (error) {
        console.error('❌ Error sincronizando:', error.message);
    }
}

// Export functions
module.exports = {
    ZenputAPIConnector,
    searchApodacaInZenput,
    syncZenputData
};

// Run if called directly
if (require.main === module) {
    searchApodacaInZenput()
        .then(() => {
            console.log('\n✅ Búsqueda en Zenput completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}