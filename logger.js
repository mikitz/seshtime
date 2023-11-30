const fs = require('fs')
const { DateTime } = require('luxon');
const path = require('path');

function getStackTrace() {
  const obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
}

function extractCallerInfo() {
  const stackTrace = getStackTrace();
  const stackLines = stackTrace.split('\n');
  // Depending on the structure of your project, you might need to adjust
  // the index to find the correct line in the stack trace
  const callerLine = stackLines[3];
  
  // Extracting file name and line number from the stack trace
  const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i);
  if (match && match.length >= 4) {
    return {
      fileName: path.basename(match[2]),
      line: match[3]
    };
  }
  return { fileName: 'unknown', line: '?' };
}
function getConsoleType(message){
    if (message.includes("info")) return 'log'
    else if (message.includes("warn")) return 'warn'
    else if (message.includes("error")) return 'error'
}

function logToFile(message) {
    const { fileName, line } = extractCallerInfo();
    const now = DateTime.now()
    const fileInfo = `${fileName}:${line}`
    const timeStamp = `${now.toLocaleString(DateTime.DATE_SHORT)} ${now.toLocaleString(DateTime.TIME_24_WITH_SECONDS)}`
    const fileTimeStamp = timeStamp.replace(/[/:]/g, match => {
        if (match === '/') return '-';
        if (match === ':') return '.';
    });
    // const logStream = fs.createWriteStream(`logs/${fileTimeStamp}.txt`, { flags: 'a' });
    const logStream = fs.createWriteStream(`logs/logs.txt`, { flags: 'a' });
    logStream.write(`[Sesh Time] [${timeStamp}] [${fileInfo}] ${message}\n`)
    if (message.includes("INFO")) console.log('[Sesh Time]', timeStamp, fileInfo, message)
    else if (message.includes("WARN")) return console.warn('[Sesh Time]', timeStamp, fileInfo, message)
    else if (message.includes("ERROR")) return console.error('[Sesh Time]', timeStamp, fileInfo, message)
    logStream.end();
}
const logger = {
    log: (message) => logToFile(`[INFO] ${message}`),
    warn: (message) => logToFile(`[WARN] ${message}`),
    error: (message) => logToFile(`[ERROR] ${message}`),
};
module.exports = logger;