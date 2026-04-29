const axios = require('axios');
require('dotenv').config();

const LOG_COLLECTOR_URL = process.env.LOG_COLLECTOR_URL || 'http://localhost:5001/api/logs';

const services = ['api-gateway', 'auth-service', 'inventory-service', 'payment-service'];
const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const messages = {
  INFO: ['User logged in', 'Request processed', 'Database connection established', 'Cache cleared'],
  WARN: ['High memory usage', 'Slow query detected', 'Disk space reaching 80%', 'Deprecated API called'],
  ERROR: ['Connection refused', 'Invalid token', 'Transaction failed', 'Index out of bounds', 'Internal server error'],
  DEBUG: ['Fetching record #123', 'Header validation start', 'Payload parsed', 'Retry attempt #1']
};

async function sendLog() {
  const serviceId = services[Math.floor(Math.random() * services.length)];
  const logLevel = levels[Math.floor(Math.random() * levels.length)];
  
  // Biasing towards INFO but occasionally throwing ERRORs
  const rand = Math.random();
  const biasLevel = rand > 0.9 ? 'ERROR' : (rand > 0.8 ? 'WARN' : 'INFO');
  
  const levelMessages = messages[biasLevel];
  const message = levelMessages[Math.floor(Math.random() * levelMessages.length)];

  const log = {
    serviceId,
    logLevel: biasLevel,
    message,
    metadata: {
      requestId: Math.random().toString(36).substring(7),
      responseTime: Math.floor(Math.random() * 500)
    },
    timestamp: new Date().toISOString()
  };

  try {
    await axios.post(LOG_COLLECTOR_URL, log);
    console.log(`[${biasLevel}] Sent log from ${serviceId}`);
  } catch (error) {
    console.error('Failed to send log:', error.message);
  }
}

// Send logs every 2 seconds
setInterval(sendLog, 2000);

// Occasionally send a burst of errors to trigger alerts
setInterval(() => {
  console.log('Sending burst of errors...');
  for (let i = 0; i < 15; i++) {
    sendLog();
  }
}, 60000);

console.log('Mock Log Generator started...');
