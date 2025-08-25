#!/bin/bash

echo "🍗 El Pollo Loco CAS - Deployment Script"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar Node.js
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi
print_success "Node.js $(node --version) detectado"

# Verificar npm
print_status "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está disponible"
    exit 1
fi
print_success "npm $(npm --version) detectado"

# Backend
print_status "Configurando Backend API..."
cd backend
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado en backend"
    print_status "Creando .env desde template..."
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql://user:pass@host:port/db" > .env
fi

print_status "Instalando dependencias del backend..."
npm install --silent

print_success "Backend configurado correctamente"
cd ..

# Frontend
print_status "Configurando Frontend Dashboard..."
cd frontend
if [ ! -f ".env" ]; then
    print_status "Creando .env para frontend..."
    echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
    echo "GENERATE_SOURCEMAP=false" >> .env
fi

print_status "Instalando dependencias del frontend..."
npm install --silent

print_success "Frontend configurado correctamente"
cd ..

# Telegram Bot
print_status "Configurando Telegram Bot..."
cd telegram-bot
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado en telegram-bot"
    print_status "Creando .env desde template..."
    echo "BOT_TOKEN=YOUR_BOT_TOKEN_HERE" > .env
    echo "API_BASE_URL=http://localhost:3001/api" >> .env
    echo "WEBAPP_URL=http://localhost:3000" >> .env
fi

print_status "Instalando dependencias del bot..."
npm install --silent

print_success "Telegram Bot configurado correctamente"
cd ..

# Scripts de inicio
print_status "Creando scripts de inicio..."

# Script para backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Backend API..."
cd backend
npm start
EOF

# Script para frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🌐 Iniciando Frontend Dashboard..."
cd frontend
npm start
EOF

# Script para bot
cat > start-bot.sh << 'EOF'
#!/bin/bash
echo "🤖 Iniciando Telegram Bot..."
cd telegram-bot
npm start
EOF

# Script para todo
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🍗 Iniciando El Pollo Loco CAS Dashboard..."
echo "========================================="

# Función para cleanup en exit
cleanup() {
    echo "🛑 Deteniendo servicios..."
    jobs -p | xargs -r kill
    exit 0
}
trap cleanup INT TERM

# Iniciar servicios en paralelo
echo "🚀 Iniciando Backend API..."
cd backend && npm start &
BACKEND_PID=$!

echo "🌐 Iniciando Frontend Dashboard..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo "🤖 Iniciando Telegram Bot..."
cd ../telegram-bot && npm start &
BOT_PID=$!

echo "✅ Todos los servicios iniciados"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "🤖 Bot: Activo (requiere BOT_TOKEN)"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar por cualquier proceso
wait
EOF

chmod +x start-*.sh

print_success "Scripts de inicio creados"

# Verificación de configuración
print_status "Verificando configuración..."

# Verificar backend
if [ -f "backend/.env" ] && grep -q "DATABASE_URL" backend/.env; then
    print_success "Backend .env configurado"
else
    print_warning "Backend .env necesita configuración manual"
fi

# Verificar frontend
if [ -f "frontend/.env" ]; then
    print_success "Frontend .env configurado"
else
    print_warning "Frontend .env no encontrado"
fi

# Verificar bot
if [ -f "telegram-bot/.env" ] && grep -q "BOT_TOKEN" telegram-bot/.env; then
    if grep -q "YOUR_BOT_TOKEN_HERE" telegram-bot/.env; then
        print_warning "Telegram Bot necesita BOT_TOKEN real"
    else
        print_success "Telegram Bot configurado"
    fi
else
    print_warning "Telegram Bot .env necesita configuración"
fi

echo ""
print_success "🎉 ¡Deployment completado!"
echo "=================================="
echo ""
echo "📋 Pasos siguientes:"
echo "1. Configurar DATABASE_URL en backend/.env"
echo "2. Configurar BOT_TOKEN en telegram-bot/.env"
echo "3. Ejecutar: ./start-all.sh"
echo ""
echo "🔗 URLs:"
echo "• Dashboard: http://localhost:3000"
echo "• API: http://localhost:3001"
echo "• Health Check: http://localhost:3001/health"
echo ""
echo "🤖 Comandos del Bot:"
echo "/start /kpis /grupos /criticas /top10 /dashboard"
echo ""