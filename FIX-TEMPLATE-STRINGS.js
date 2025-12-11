// Arreglar template strings en bot.js
const fs = require('fs');
const path = require('path');

const botPath = path.join(__dirname, 'telegram-bot', 'bot.js');
let content = fs.readFileSync(botPath, 'utf8');

// Arreglar SQL template strings
content = content.replace(/\\\$/g, '$');

// Arreglar mensajes de template strings
content = content.replace(/\\\{/g, '{');
content = content.replace(/\\\}/g, '}');

// Arreglar regex que se rompió
content = content.replace('/^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/', '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/');

// Arreglar newlines en mensajes
content = content.replace(/\\\\n/g, '\\n');

fs.writeFileSync(botPath, content);
console.log('✅ Fixed template strings in bot.js');