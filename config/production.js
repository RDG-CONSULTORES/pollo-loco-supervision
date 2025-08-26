// Production configuration
module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:1hLdOZPLDwii@ep-crimson-pond-a5l7mzwx.us-east-2.aws.neon.tech/neondb?sslmode=require',
  NODE_ENV: 'production',
  START_BOT: true,
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision.onrender.com'
};