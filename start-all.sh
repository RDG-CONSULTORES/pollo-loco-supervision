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
