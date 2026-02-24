const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLog = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  });
};

const writeToFile = (filename, log) => {
  const filePath = path.join(logsDir, filename);
  fs.appendFileSync(filePath, log + '\n');
};

const logger = {
  info: (message, meta = {}) => {
    const log = formatLog('INFO', message, meta);
    console.log(`ℹ️  ${message}`, meta);
    writeToFile('combined.log', log);
  },

  error: (message, meta = {}) => {
    const log = formatLog('ERROR', message, meta);
    console.error(`❌ ${message}`, meta);
    writeToFile('error.log', log);
    writeToFile('combined.log', log);
  },

  warn: (message, meta = {}) => {
    const log = formatLog('WARN', message, meta);
    console.warn(`⚠️  ${message}`, meta);
    writeToFile('combined.log', log);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('DEBUG', message, meta);
      console.log(`🐛 ${message}`, meta);
      writeToFile('combined.log', log);
    }
  }
};

module.exports = logger;