const express = require('express');
const axios = require('axios');
const winston = require('winston');
const NodeCache = require('node-cache');
const SSE = require('express-sse');
const fs = require('fs-extra');
const path = require('path');
const { Worker } = require('worker_threads');
const WebSocket = require('ws');
const { Sema } = require('async-sema');
const https = require('https');

// Initialize Express app
const app = express();
app.use(express.json());
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add middleware to set global variables for all views
app.use((req, res, next) => {
    // Set application version
    res.locals.version = '1.0.0';
    next();
});

// Configure logging
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    success: 4
};

const logColors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m', // Gray
    success: '\x1b[32m' // Green
};

const logger = winston.createLogger({
    levels: logLevels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            const color = logColors[level] || '\x1b[0m';
            const reset = '\x1b[0m';
            const prefix = level.toUpperCase().padEnd(7);
            return `${color}[${prefix}]${reset} ${timestamp} - ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'app.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        new winston.transports.Console()
    ]
});

// Add success level to winston
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'gray',
    success: 'green'
});

// Initialize SSE for notifications and logs (can be kept or removed if WS replaces logs)
// const notificationsSSE = new SSE(); // Commented out/Removed
// const logsSSE = new SSE(); // Commented out/Removed

// Cache configuration
const CACHE_UPDATES_LOG = 'cache_updates.log';
const CACHE_FILE = 'cache.json'; // Used for final save/initial load fallback
const cache = new NodeCache(); // In-memory cache
const STATS_FILE = 'stats.json';

// Counters for statistics
let counters = {
    pages_checked: 0,
    searches: 0,
    items_added: 0,
    items_removed: 0
};
let stats = {
    last_run_start_time: null,
    last_run_end_time: null,
    last_run_duration: 0,
    total_runs: 0,
    average_run_time: 0,
    total_items_found_all_time: 0,
};

// Load persistent stats
function loadStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            stats = fs.readJsonSync(STATS_FILE);
            logger.info('Loaded persistent statistics from stats.json');
        } else {
            logger.info('No stats.json found, starting with fresh statistics.');
        }
    } catch (error) {
        logger.error(`Error loading stats: ${error.message}`);
    }
}

// Save persistent stats
function saveStats() {
    try {
        fs.writeJsonSync(STATS_FILE, stats, { spaces: 4 });
        logger.debug('Saved statistics to stats.json');
    } catch (error) {
        logger.error(`Error saving stats: ${error.message}`);
    }
}
loadStats(); // Load stats on startup

// API Manager class - Updated
class APIManager {
    constructor(keysFile, rateLimit = 20) {
        this.keys = [];
        this.rateLimit = rateLimit; // General limit (requests per minute per key - maybe adjust?)
        this.keyLastRequestTime = new Map();
        this.keyCategorySearchCooldown = new Map(); // <<< NEW: Track last category search time per key
        this.keyToLineNumber = new Map();
        this.keyLocks = new Map();
        this.loadKeys(keysFile);
        // Initialize Semaphore - limit concurrency to number of keys
        if (this.keys.length > 0) {
            this.semaphore = new Sema(this.keys.length);
            this.keys.forEach(key => {
                this.keyLocks.set(key, false);
                this.keyLastRequestTime.set(key, 0);
                this.keyCategorySearchCooldown.set(key, 0); // <<< NEW: Initialize cooldown map
            });
            logger.info(`[APIManager] Initialized with ${this.keys.length} keys and concurrency limit of ${this.keys.length}`);
        } else {
            // Handle case with no keys to avoid semaphore error
            this.semaphore = new Sema(1);
            logger.warn('[APIManager] No keys loaded, setting concurrency limit to 1.');
        }
        this.requestTimeout = 30000; // <<< Increased to 30 seconds
        this.maxRetries = 2;
        this.retryDelay = 1000; // Start delay for retries
    }

    loadKeys(keysFile) {
        try {
            const lines = fs.readFileSync(keysFile, 'utf8').split('\n');
            let loadedKeys = 0;
            lines.forEach((line, index) => {
                const key = line.trim();
                if (key) {
                    this.keys.push(key);
                    this.keyLastRequestTime.set(key, 0);
                    this.keyCategorySearchCooldown.set(key, 0); // <<< NEW: Initialize cooldown map
                    this.keyToLineNumber.set(key, index + 1);
                    this.keyLocks.set(key, false);
                    loadedKeys++;
                }
            });
            if (loadedKeys === 0) throw new Error('No valid API keys found');
            logger.debug(`Loaded ${loadedKeys} API keys`);
        } catch (error) {
            logger.error(`Error loading API keys: ${error.message}`);
            // Don't throw here, let constructor handle logging the warning
        }
    }

    // Main function to send requests, handles semaphore, per-key delay, and retries
    async sendRequest(url, method = 'GET', options = {}, itemId = null, isCategorySearch = false) {
        if (this.keys.length === 0) {
            logger.error('[APIManager] No API keys available to send request.');
            throw new Error('No API keys loaded');
        }

        await this.semaphore.acquire();
        logger.debug(`[APIManager] Semaphore acquired for ${url.split('?')[0]}. Remaining permits: ${this.semaphore.nrWaiting()} waiting.`);
        
        let attempt = 0;
        let lastError = null;
        let key = null; // Define key here for outer finally scope

        try {
            // === Start Retry Loop ===
            while (attempt <= this.maxRetries) {
                key = null; // Reset key for each attempt
                let keyAcquired = false;
                
                try {
                    key = await this._getAvailableKey(isCategorySearch); // <<< Acquire and lock key INSIDE loop
                    keyAcquired = true;
                    const keyLineNum = this.keyToLineNumber.get(key) || 'Unknown';
                    const logItemId = itemId ? ` (Item: ${itemId})` : '';
                    const attemptLog = ` (Attempt ${attempt + 1}/${this.maxRetries + 1})`; // Always show attempt
                    const categoryLog = isCategorySearch ? ' [Category Search]' : '';

                    logger.debug(`[Request] Key line ${keyLineNum} sending request${categoryLog}${logItemId}${attemptLog} to ${url}`);
                    const startTime = Date.now();

                    // --- Axios Call --- 
                    const response = await axios({
                        method,
                        url,
                        headers: {
                            accept: 'application/json',
                            authorization: `Bearer ${key}`
                        },
                        timeout: this.requestTimeout,
                        ...options
                    });

                    this._updateKeyTimestamp(key, isCategorySearch); // Update timestamp on success
                    const duration = Date.now() - startTime;
                    logger.info(`[Request] Success for ${url.split('?')[0]} key line ${keyLineNum}${categoryLog}${logItemId} (Status: ${response.status}, Time: ${duration}ms)`);
                    return response; // <<< Success: Return and exit

                } catch (error) {
                    // --- Error Handling for Attempt --- 
                    if (key) { 
                        this._updateKeyTimestamp(key, isCategorySearch);
                    }
                    // --- SAFELY Calculate Duration --- 
                    let duration = -1; // Default duration
                    const keyLineNum = key ? (this.keyToLineNumber.get(key) || 'Unknown') : 'N/A';
                    const logItemId = itemId ? ` (Item: ${itemId})` : '';
                    const attemptLog = ` (Attempt ${attempt + 1}/${this.maxRetries + 1})`;
                    
                    // Check if startTime was defined before using it
                    if (key && typeof startTime !== 'undefined') { 
                        duration = Date.now() - startTime;
                    } else if (key) {
                        // Log if key exists but startTime doesn't (indicates error before timestamp)
                        logger.warn(`[Request] Error likely occurred before startTime was set for key ${keyLineNum}${logItemId}${attemptLog}. Duration cannot be calculated.`);
                    }
                    // --- End Safe Duration Calc ---

                    lastError = error; // Store error for potential final throw

                    if (error.response) {
                        const status = error.response.status;
                        logger.warn(`[Request] Failed for ${url.split('?')[0]} key line ${keyLineNum}${logItemId}${attemptLog} (Status: ${status}, Time: ${duration}ms)`);

                        if (status === 404) {
                            logger.error(`[Request] Received 404 Not Found. Not retrying.`);
                            throw error; // Rethrow 404 immediately
                        }
                        if (status === 429) {
                            const delay429 = 1500 + Math.random() * 1000; // Increased delay for 429
                            logger.warn(`[Request] Rate limit (429) hit. Applying extra delay (${delay429.toFixed(0)}ms) before next attempt.`);
                            await new Promise(resolve => setTimeout(resolve, delay429));
                             // Loop will continue to next attempt after delay
                        }
                        // Check if retryable (5xx)
                        else if (status >= 500 && status < 600) {
                             if (attempt < this.maxRetries) {
                                const delay = this.retryDelay * Math.pow(2, attempt);
                                logger.warn(`[Request] Server error ${status}. Retrying in ${delay}ms...`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                // Loop will continue after delay
                             } else {
                                 logger.error(`[Request] Final attempt failed with server error ${status}.`);
                                 throw error; // Max retries reached for 5xx
                             }
                        } else {
                            // Non-retryable status other than 404/429/5xx
                            logger.error(`[Request] Non-retryable status ${status}.`);
                            throw error;
                        }

                    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                        logger.warn(`[Request] Timeout for ${url.split('?')[0]} key line ${keyLineNum}${logItemId}${attemptLog} (Time: ${duration}ms)`);
                        if (attempt < this.maxRetries) {
                            const delay = this.retryDelay * Math.pow(2, attempt);
                            logger.warn(`[Request] Retrying timeout in ${delay}ms...`);
                             await new Promise(resolve => setTimeout(resolve, delay));
                             // Loop will continue after delay
                        } else {
                             logger.error(`[Request] Final attempt failed due to timeout.`);
                             throw error; // Max retries reached for timeout
                        }
                    } else {
                        // Other network errors (DNS, connection refused, etc.)
                        logger.error(`[Request] Network Error for ${url.split('?')[0]} key line ${keyLineNum}${logItemId}${attemptLog}: ${error.message}`);
                         throw error; // Don't retry unknown network errors by default
                    }
                } finally {
                     // <<< ADDED: Release the key lock INSIDE loop's finally >>>
                     if (key && keyAcquired) { // Only release if a key was successfully acquired for this attempt
                         if (this.keyLocks.has(key)) {
                             this.keyLocks.set(key, false);
                             logger.debug(`[APIManager] Released lock for key line ${this.keyToLineNumber.get(key)} after attempt ${attempt + 1}.`);
                         }
                     }
                }

                // Increment attempt counter before next iteration
                attempt++;
            } // === End Retry Loop ===
            
            // If the loop finishes without returning, it means all retries failed.
            logger.error(`[Request] Max retries (${this.maxRetries + 1}) reached for ${url.split('?')[0]}. Last error: ${lastError?.message}`);
            throw lastError || new Error('Max retries reached or unknown error');

        } finally {
            logger.debug(`[APIManager] Releasing semaphore for ${url.split('?')[0]}.`);
            this.semaphore.release(); // Always release the semaphore slot
            // Key lock release is now handled INSIDE the loop's finally
        }
    }

    // Internal helper to get a key ensuring per-key delay
    async _getAvailableKey(isCategorySearch = false) {
        // const BUFFER_MS = 20; // <<< REMOVED safety buffer
        while (true) {
            let availableKey = null;
            let earliestNextAvailableTime = Infinity;
            const now = Date.now();

            for (const key of this.keys) {
                if (this.keyLocks.get(key)) {
                     continue; // Skip locked keys
                }

                // Calculate time needed for general rate limit (if applicable)
                const lastTimeGeneral = this.keyLastRequestTime.get(key) || 0;
                const minIntervalGeneral = (60 * 1000) / this.rateLimit; // Using the constructor's rateLimit
                const nextAvailableGeneral = lastTimeGeneral + minIntervalGeneral;

                // Calculate time needed for category search cooldown (if applicable)
                let nextAvailableCategory = 0;
                if (isCategorySearch) {
                    const lastTimeCategory = this.keyCategorySearchCooldown.get(key) || 0;
                    const minIntervalCategory = 3100; // 3.1 seconds enforced
                    nextAvailableCategory = lastTimeCategory + minIntervalCategory;
                }

                // Determine the actual time this key will be ready
                const nextReadyTime = Math.max(nextAvailableGeneral, nextAvailableCategory);

                // <<< MODIFIED: Removed buffer check >>>
                if (now >= nextReadyTime) {
                    availableKey = key; // Found one ready now
                    break;
                }
                
                // If not ready, track the earliest time *any* key might be ready
                // <<< MODIFIED: Use original time for wait calculation >>>
                earliestNextAvailableTime = Math.min(earliestNextAvailableTime, nextReadyTime);
            }

            if (availableKey) {
                this.keyLocks.set(availableKey, true);
                logger.debug(`[APIManager] Acquired lock for key line ${this.keyToLineNumber.get(availableKey)}.`);
                return availableKey;
            }

            // If no key is ready, wait until the earliest possible time
            // <<< MODIFIED: Use original earliest time for wait calculation >>>
            const waitTime = Math.max(50, earliestNextAvailableTime - now); // Min 50ms wait
            logger.debug(`[APIManager] All keys cooling down or locked. Waiting approx ${waitTime.toFixed(0)}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    // Internal helper to update timestamp safely
    _updateKeyTimestamp(key, isCategorySearch = false) {
        if (key && this.keyLastRequestTime.has(key)) {
            const now = Date.now();
            this.keyLastRequestTime.set(key, now);
            if (isCategorySearch) {
                this.keyCategorySearchCooldown.set(key, now);
                // logger.debug(`[APIManager] Updated GENERAL and CATEGORY timestamps for key line ${this.keyToLineNumber.get(key)}.`);
            } else {
                // logger.debug(`[APIManager] Updated GENERAL timestamp for key line ${this.keyToLineNumber.get(key)}.`);
            }
        }
    }
}

// Re-initialize API Manager
const apiManager = new APIManager('api.keys');

// Cache management - Modified loading strategy
class CacheManager {
    constructor(logFile, finalCacheFile) {
        this.logFile = logFile;
        this.finalCacheFile = finalCacheFile;
        this.writeStream = null;
        this._initializeWriteStream();
        this._loadCache(); // Call the primary loader
    }

    _initializeWriteStream() {
        try {
            this.writeStream = fs.createWriteStream(this.logFile, { flags: 'a' });
            this.writeStream.on('error', (err) => {
                logger.error(`Error writing to cache update log: ${err.message}`);
                 this.writeStream = null; 
                 setTimeout(() => this._initializeWriteStream(), 5000); 
            });
            logger.info(`Initialized cache update log stream: ${this.logFile}`);
        } catch (error) {
             logger.error(`Failed to initialize cache update log stream: ${error.message}`);
             this.writeStream = null;
        }
    }

    _logUpdate(logEntry) {
        if (!this.writeStream) {
             logger.error('Cache update log stream is not available. Update lost.', logEntry);
             this._initializeWriteStream(); 
             return;
        }
        try {
             this.writeStream.write(JSON.stringify(logEntry) + '\n');
        } catch (error) {
             logger.error(`Failed to write entry to cache log stream: ${error.message}`, logEntry);
        }
    }

    // Primary loading function: Tries final cache first, then log file.
    _loadCache() {
        logger.info('[CacheManager] Starting cache load process...');
        const loadStartTime = Date.now();
        let loadedFromSnapshot = false;

        logger.info(`[CacheManager] Attempting to load cache from snapshot file: ${this.finalCacheFile}`);
        try {
            if (fs.existsSync(this.finalCacheFile)) {
                const snapshotStartTime = Date.now();
                const data = fs.readJsonSync(this.finalCacheFile, { throws: false }) || {};
                const snapshotReadTime = Date.now() - snapshotStartTime;
                logger.info(`[CacheManager] Snapshot file read in ${snapshotReadTime}ms.`);

                if (Object.keys(data).length > 0) {
                    const populateStartTime = Date.now();
                    Object.entries(data).forEach(([key, value]) => {
                        cache.set(key, value);
                    });
                    const populateTime = Date.now() - populateStartTime;
                    logger.success(`[CacheManager] Successfully loaded ${cache.keys().length} items from cache snapshot ${this.finalCacheFile} (Populate time: ${populateTime}ms).`);
                    loadedFromSnapshot = true;
                } else {
                    logger.warn(`[CacheManager] Cache snapshot file ${this.finalCacheFile} was empty or invalid JSON.`);
                }
            } else {
                 logger.warn(`[CacheManager] Cache snapshot file ${this.finalCacheFile} not found.`);
            }
        } catch (error) {
            logger.error(`[CacheManager] Error loading cache snapshot from ${this.finalCacheFile}: ${error.message}`);
        }

        // If snapshot loading failed or file was empty/missing, attempt to load from log
        if (!loadedFromSnapshot) {
            logger.info('[CacheManager] Snapshot load failed or cache empty, attempting reconstruction from log file...');
            this.loadCacheFromLog();
        }

        const totalLoadTime = Date.now() - loadStartTime;
        logger.info(`[CacheManager] Cache load process finished in ${totalLoadTime}ms. Final cache size: ${cache.keys().length} items.`);
    }

    // Renamed - Loads ONLY from log file (called as fallback by _loadCache)
    loadCacheFromLog() {
        logger.info(`[CacheManager] Reconstructing cache from log file: ${this.logFile}`);
        const logLoadStartTime = Date.now();
        try {
            if (!fs.existsSync(this.logFile)) {
                 logger.warn(`[CacheManager] Cache log file ${this.logFile} not found. Starting with empty cache.`);
                 return;
            }

            const logReadStartTime = Date.now();
            const logContent = fs.readFileSync(this.logFile, 'utf8');
            const logReadTime = Date.now() - logReadStartTime;
            logger.info(`[CacheManager] Log file read in ${logReadTime}ms.`);

            const lines = logContent.split('\n').filter(line => line.trim() !== '');
            let loadedCount = 0;
            let removedCount = 0;
            const tempCache = {}; 

            const processingStartTime = Date.now();
            lines.forEach((line, index) => {
                try {
                    const entry = JSON.parse(line);
                    if (entry.action === 'add' || entry.action === 'update') {
                        if (entry.itemId && entry.data) {
                             tempCache[entry.itemId] = entry.data; 
                        } else { logger.warn(`[CacheManager] Invalid add/update entry at line ${index + 1} in log.`); }
                    } else if (entry.action === 'remove') {
                        if (entry.itemId) {
                            if (tempCache[entry.itemId]) { 
                                delete tempCache[entry.itemId]; 
                                removedCount++;
                            }
                        } else { logger.warn(`[CacheManager] Invalid remove entry at line ${index + 1} in log.`); }
                    } else { logger.warn(`[CacheManager] Unknown action '${entry.action}' at line ${index + 1} in log.`); }
                } catch (parseError) {
                    logger.error(`[CacheManager] Error parsing line ${index + 1} from cache log: ${parseError.message}`);
                }
            });
            const processingTime = Date.now() - processingStartTime;
            logger.info(`[CacheManager] Log processing complete in ${processingTime}ms (${lines.length} lines processed).`);
            
            // Populate the actual NodeCache from the reconstructed temp object
            const finalItemIds = Object.keys(tempCache);
            const populateStartTime = Date.now();
            finalItemIds.forEach(itemId => {
                cache.set(itemId, tempCache[itemId]);
                loadedCount++;
            });
            const populateTime = Date.now() - populateStartTime;

            logger.success(`[CacheManager] Cache reconstructed from log: ${loadedCount} items loaded (${removedCount} remove ops processed). Populate time: ${populateTime}ms.`);

        } catch (error) {
            logger.error(`[CacheManager] FATAL: Error loading cache from log file ${this.logFile}: ${error.message}. Cache may be empty.`);
        }
        const totalLogLoadTime = Date.now() - logLoadStartTime;
        logger.info(`[CacheManager] Log reconstruction finished in ${totalLogLoadTime}ms.`);
    }
    
    // REMOVED _loadFromFinalCacheFallback - logic is now in _loadCache

    // Called when adding/updating an item
    addOrUpdateItem(itemId, itemData) {
        cache.set(itemId, itemData); 
        logger.debug(`Item ${itemId} updated in memory cache. Logging update.`);
        this._logUpdate({ action: 'update', itemId: itemId, data: itemData });
    }

    // Called when removing an item
    removeItem(itemId) {
        if (cache.has(itemId)) {
            cache.del(itemId); 
            logger.debug(`Item ${itemId} removed from memory cache. Logging removal.`);
            this._logUpdate({ action: 'remove', itemId: itemId });
            return true;
        }
        logger.warning(`Item ${itemId} not found in cache for removal`);
        return false;
    }

    // Get current in-memory cache state
    getCache() {
        return cache.mget(cache.keys());
    }

    // Method to save the *entire* current in-memory cache synchronously to cache.json
    saveFullCacheSync() {
        logger.info(`Attempting to save full cache snapshot to ${this.finalCacheFile}...`);
         try {
            const data = this.getCache(); 
            fs.writeJsonSync(this.finalCacheFile, data, { spaces: 4 });
            logger.success(`Full cache snapshot saved successfully to ${this.finalCacheFile}.`);
        } catch (error) {
            logger.error(`Error saving full cache snapshot to ${this.finalCacheFile}: ${error.message}`);
        }
    }
    
    // Close the log stream gracefully
    closeLogStream() {
        if (this.writeStream) {
             this.writeStream.end(() => {
                 logger.info(`Cache update log stream closed: ${this.logFile}`);
             });
             this.writeStream = null;
        } 
    }
}

// Initialize Cache Manager (remains the same)
const cacheManager = new CacheManager(CACHE_UPDATES_LOG, CACHE_FILE);

// Auto-refresh state
let autoRefreshEnabled = false;
let autoRefreshInterval = null;
let isAutoRefreshRunning = false;
let forceStopCycle = false;
let isPausedByUser = false; // Track if stop was user-initiated pause
let pausedCycleState = null; // Holds state for phase-based resume { phase: string, data: object }

// WebSocket Server Setup
const wss = new WebSocket.Server({ noServer: true });
let connectedClients = new Set();

wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');
    connectedClients.add(ws);

    // Send current status immediately upon connection
    ws.send(JSON.stringify({
        type: 'status',
        isRunning: isAutoRefreshRunning,
        isEnabled: autoRefreshEnabled,
        lastStats: stats
    }));

    ws.on('message', (message) => {
        logger.debug(`Received WebSocket message: ${message}`);
        try {
            const data = JSON.parse(message);
            if (data.action === 'triggerRefresh' && !isAutoRefreshRunning) {
                logger.info('Manual refresh triggered via WebSocket');
                autoRefresh(); // Start a cycle manually
            } else if (data.action === 'requestStatus') {
                // Client is requesting the current status again
                logger.debug('Client requested status update.');
                ws.send(JSON.stringify({
                    type: 'status',
                    isRunning: isAutoRefreshRunning,
                    isEnabled: autoRefreshEnabled,
                    lastStats: stats
                }));
            }
        } catch (e) {
            logger.warn('Invalid WebSocket message format');
        }
    });

    ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`);
        connectedClients.delete(ws); // Clean up on error
    });
});

// Function to broadcast messages to all connected WebSocket clients
function broadcast(data) {
    const messageData = {
        ...data,
        lastStats: stats,
        currentCounters: counters,
        isRunning: isAutoRefreshRunning,
        isEnabled: autoRefreshEnabled,
        isPaused: isPausedByUser // Include paused state
    };
    const message = JSON.stringify(messageData);
    connectedClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Auto-refresh function - Modified for progress reporting
async function autoRefresh(resumeState = null) {
    if (isAutoRefreshRunning && !resumeState) {
        logger.warn('Auto-refresh cycle already running. Skipping new start.');
        return;
    }

    isAutoRefreshRunning = true;
    forceStopCycle = false;
    const runStartTime = Date.now();
    stats.last_run_start_time = new Date(runStartTime).toISOString();
    let currentProgress = 0; // Track overall progress

    // Initialize/restore state...
    let allItemsInfo = []; // Renamed for clarity
    let addedItems = [];
    let removedItems = [];
    let startPhase = 'pagination';
    let startPage = 1;
    let startRemovedIndex = 0;
    let startAddedIndex = 0;

    if (resumeState) {
        logger.info(`Resuming auto-refresh from phase: ${resumeState.phase}`);
        startPhase = resumeState.phase;
        if (resumeState.data) {
             allItemsInfo = resumeState.data.allItemsInfo || []; // Only used if resuming after pagination
             addedItems = resumeState.data.addedItems || [];
             removedItems = resumeState.data.removedItems || [];
             startPage = resumeState.data.currentPage || 1;
             startRemovedIndex = resumeState.data.currentRemovedIndex || 0;
             startAddedIndex = resumeState.data.currentAddedIndex || 0;
        }
         broadcast({ type: 'status', message: `Resuming from ${startPhase.replace('_',' ')} phase...` });
    } else {
        counters = { pages_checked: 0, searches: 0, items_added: 0, items_removed: 0 };
        logger.info('Starting auto-refresh cycle...');
        currentProgress = 5; // Initial progress
        broadcast({ type: 'status', isRunning: true, isEnabled: autoRefreshEnabled, message: 'Starting refresh cycle...', progress: currentProgress, eta: null });
    }

    try {
        // === Phase: Pagination ===
        if (startPhase === 'pagination') {
            if (forceStopCycle) {
                 if (isPausedByUser) pausedCycleState = { phase: 'pagination', data: { currentPage: startPage } };
                 throw new Error('Cycle interrupted during pagination start.');
            }
            // Progress updated inside getAllItemIds now, using estimate
            allItemsInfo = await getAllItemIds(startPage); // Fetches IDs AND basic data
            currentProgress = 25; // Set progress after pagination finishes
            broadcast({ type: 'progress', phase: 'compare_cache', message: `Comparing ${allItemsInfo.length} items with cache...`, progress: currentProgress });

            if (forceStopCycle) {
                 if (isPausedByUser) pausedCycleState = { phase: 'process_removed', data: { allItemsInfo: allItemsInfo, addedItems: [], removedItems: [], currentRemovedIndex: 0 } };
                 throw new Error('Cycle interrupted after pagination.');
            }
            
            // Comparison logic
            const newItemIds = new Set(allItemsInfo.map(item => item.item_id));
            const previousItemIds = new Set(Object.keys(cacheManager.getCache()));
            addedItems = allItemsInfo.filter(item => !previousItemIds.has(item.item_id));
            removedItems = [...previousItemIds].filter(id => !newItemIds.has(id));
            logger.info(`Comparison: ${newItemIds.size - addedItems.length} unchanged, ${addedItems.length} new, ${removedItems.length} removed items`);
            currentProgress = 30; // Progress after comparison
            broadcast({ type: 'progress', phase: 'compare_cache', message: 'Comparison complete.', progress: currentProgress });
        }

        // === Phase: Process Removed ===
        if (removedItems.length > 0 && (startPhase === 'pagination' || startPhase === 'process_removed')) {
            const totalToRemove = removedItems.length;
            logger.info(`Processing ${totalToRemove} removed items...`);
            broadcast({ type: 'progress', phase: 'process_removed', message: `Processing ${totalToRemove - startRemovedIndex} removed items...`, progress: currentProgress });
            for (let i = startRemovedIndex; i < totalToRemove; i++) {
                const itemId = removedItems[i];
                if (forceStopCycle) {
                     if (isPausedByUser) pausedCycleState = { phase: 'process_removed', data: { addedItems, removedItems, currentRemovedIndex: i, allItemsInfo } }; // Pass allItemsInfo if needed later
                     throw new Error('Cycle interrupted during removed processing.');
                }
                if (cacheManager.removeItem(itemId)) {
                    counters.items_removed++;
                    // Maybe limit broadcasts here too if it becomes spammy
                    broadcast({ type: 'update', item_id: itemId, status: 'removed' }); 
                }
                // Update progress within loop if needed (might be fast)
                // currentProgress = 30 + Math.round(((i + 1) / totalToRemove) * 5); // Allocate 5% to this phase
                // broadcast({ type: 'progress', phase: 'process_removed', message: `Processed ${i + 1}/${totalToRemove} removed...`, progress: currentProgress });
            }
            logger.info(`Finished processing removed items.`);
            currentProgress = 35; // Progress after removal
            broadcast({ type: 'progress', phase: 'process_removed', message: 'Finished processing removed items.', progress: currentProgress });
        }

        // === Phase: Process Added (Updated Progress Reporting) ===
        if (addedItems.length > 0 && (startPhase === 'pagination' || startPhase === 'process_removed' || startPhase === 'process_added')) {
            const totalAddedToProcess = addedItems.length;
            logger.info(`Processing ${totalAddedToProcess} added items using APIManager...`);

            const processing_start_time = Date.now(); 
            const PROGRESS_UPDATE_INTERVAL = Math.max(1, Math.floor(totalAddedToProcess / 20)); // Update progress roughly 20 times, minimum 1
            let itemsProcessedSinceLastUpdate = 0;
            let estimatedTotalTime = null; // Calculate later

            broadcast({ type: 'progress', phase: 'process_added', message: `Fetching details for ${totalAddedToProcess - startAddedIndex} new items...`, progress: currentProgress, eta: null });

            const processingPromises = [];
            for (let i = startAddedIndex; i < totalAddedToProcess; i++) {
                 const item = addedItems[i];
                if (forceStopCycle) {
                    if (isPausedByUser) {
                        pausedCycleState = { phase: 'process_added', data: { addedItems, removedItems, currentAddedIndex: i, allItemsInfo } }; 
                        logger.info(`Saving state before processing added item index ${i} and pausing.`);
                    }
                    throw new Error(`Cycle interrupted during added processing at index ${i}.`);
                }
                
                processingPromises.push(
                    // Call BOTH endpoints concurrently
                    Promise.all([
                        getSteamInventoryDetails(item.item_id), // Gets { items, totalValue, itemCount, ...? }
                        getAccountDetails(item.item_id)       // Gets { account_last_activity, steam_country, steam_full_games, steamTransactions, ... }
                    ]).then(([inventoryDetails, accountDetails]) => {
                        
                        // <<< Log the details received from BOTH endpoints >>>
                        logger.debug(`DEBUG (Inventory): Details received for item ${item.item_id}: ${JSON.stringify(inventoryDetails, null, 2)}`);
                        logger.debug(`DEBUG (Account): Details received for item ${item.item_id}: ${JSON.stringify(accountDetails, null, 2)}`);
                        // <<< End Log >>>
                        
                        // Check if *both* calls were successful enough to proceed
                        // We definitely need inventoryDetails to get items/value.
                        // Account details might be partially okay if null.
                        if (inventoryDetails) { 
                            // --- Combine data from both responses --- 
                            const combinedData = {
                                // From pagination
                                price: item.price, 
                                query: item.query, 
                                // From getSteamInventoryDetails (inventoryDetails) - Access via inventoryDetails.data
                                total_value: inventoryDetails?.data?.totalValue || 0, 
                                item_count: inventoryDetails?.data?.itemCount || 0, 
                                items: inventoryDetails?.data?.items || [], // The actual inventory items/skins
                                // From getAccountDetails (accountDetails) - add null checks
                                steam_last_activity: accountDetails?.account_last_activity || item.steam_last_activity || null,
                                steam_country: accountDetails?.steam_country || null,
                                rust_playtime_forever: accountDetails?.steam_full_games?.list?.['252490']?.playtime_forever || 0,
                                steam_transactions: (accountDetails?.steamTransactions || []).map(t => t.product).filter(p => p),
                                // Add any other fields from accountDetails if needed
                            };
                            // --- End Combination ---

                            cacheManager.addOrUpdateItem(item.item_id, combinedData);
                            counters.items_added++; 
                            return { itemId: item.item_id, status: 'added' };
                        } else {
                             // Log which part failed if inventoryDetails is missing
                             logger.warn(`Failed to get essential Steam INVENTORY details for added item ${item.item_id}. Account details: ${accountDetails ? 'OK' : 'Failed/Null'}. Cannot add to cache.`);
                             return { itemId: item.item_id, status: 'failed' };
                        }
                    }).catch(error => {
                         logger.error(`Unhandled error processing item ${item.item_id} (Promise.all): ${error.message}`);
                         return { itemId: item.item_id, status: 'failed' };
                    }).finally(() => {
                        // --- Update progress after each promise resolves or rejects ---
                        itemsProcessedSinceLastUpdate++;
                        const totalItemsProcessed = i + 1; // Use loop index + 1 for total processed so far
                        
                        if (itemsProcessedSinceLastUpdate >= PROGRESS_UPDATE_INTERVAL || totalItemsProcessed === totalAddedToProcess) {
                            currentProgress = 35 + Math.round((totalItemsProcessed / totalAddedToProcess) * 60); // Allocate 60% to this phase
                            const timeElapsed = Date.now() - processing_start_time;
                            estimatedTotalTime = (timeElapsed / totalItemsProcessed) * totalAddedToProcess; // Recalculate total ETA
                            const estimatedRemaining = estimatedTotalTime - timeElapsed;
                            
                            broadcast({
                                type: 'progress',
                                phase: 'process_added',
                                message: `Processed ${totalItemsProcessed}/${totalAddedToProcess} added items...`,
                                progress: Math.min(95, currentProgress), // Cap progress at 95 until finalization
                                eta: estimatedRemaining > 0 ? (estimatedRemaining / 1000).toFixed(0) : 0
                             });
                             itemsProcessedSinceLastUpdate = 0; // Reset counter
                        }
                        // -----------------------------------------------------------
                    })
                );
            }
            
            // Wait for all item processing promises to settle
            const chunkResults = await Promise.allSettled(processingPromises);
            
            const successes = chunkResults.filter(r => r.status === 'fulfilled' && r.value.status === 'added').length;
            const failures = chunkResults.length - successes;
            logger.info(`Finished processing added items. Successes: ${successes}, Failures: ${failures}.`);
            currentProgress = 95; // Progress after adding is done
            broadcast({ type: 'progress', phase: 'process_added', message: 'Finished processing added items.', progress: currentProgress, eta: 0 });
        }

        // Finalize stats...
        const runEndTime = Date.now();
        stats.last_run_end_time = new Date(runEndTime).toISOString();
        const timeTaken = (runEndTime - runStartTime) / 1000;
        stats.last_run_duration = timeTaken;
        stats.total_runs++;
        stats.total_items_found_all_time += counters.items_added; 
        stats.average_run_time = ((stats.average_run_time * (stats.total_runs - 1)) + timeTaken) / stats.total_runs;
        saveStats();

        const summaryMessage = `Auto-refresh cycle completed in ${timeTaken.toFixed(2)}s (Added: ${counters.items_added}, Removed: ${counters.items_removed})`;
        logger.success(summaryMessage);
        currentProgress = 100; // Final progress
        broadcast({ type: 'complete', message: summaryMessage, progress: currentProgress });

    } catch (error) {
        if (error.message.includes('interrupted')) {
            logger.warn(`Auto-refresh cycle interrupted: ${error.message}`);
        } else {
            logger.error(`Auto-refresh failed: ${error.message}`);
            broadcast({ type: 'error', message: `Auto-refresh failed: ${error.message}` });
        }
    } finally {
        const wasPaused = isPausedByUser;
        isAutoRefreshRunning = false;
        forceStopCycle = false;
        broadcast({ type: 'status', isRunning: false, isPaused: wasPaused }); 
        if (wasPaused) {
            logger.info('Auto-refresh cycle paused by user.');
        } else {
            isPausedByUser = false;
            pausedCycleState = null;
            logger.info(`Auto-refresh cycle finished or stopped (not by pause). State cleared.`);
            
            // If auto-refresh is still enabled, schedule the next run shortly
            if (autoRefreshEnabled) {
                logger.info('Scheduling next auto-refresh cycle in 1 second...');
                setTimeout(() => {
                    if (autoRefreshEnabled && !isAutoRefreshRunning) { // Double-check state before running
                        autoRefresh();
                    }
                }, 1000); // 1-second delay before restarting
            }
        }
    }
}

// <<< Replace the BATCHED getAllItemIds function with this CONCURRENT version using APIManager >>>
async function getAllItemIds(resumePage = 1) {
    logger.info(`Starting CONCURRENT pagination process (APIManager Controlled). Resuming from page: ${resumePage}`);
    const allItems = [];
    let currentPage = resumePage;
    const MAX_CONSECUTIVE_EMPTY_PAGES = 3;
    let consecutiveEmptyPages = 0;
    let isDone = false;
    const fetchPromises = [];
    const maxConcurrency = Math.max(1, apiManager.keys.length); // Concurrency = number of keys
    // APIManager's internal semaphore handles concurrency based on numKeys
    let totalItemsFound = 0;
    let highestPageProcessed = resumePage - 1; // Track processed pages to detect end

    if (resumePage === 1) counters.pages_checked = 0;
    broadcast({ type: 'progress', phase: 'fetch_items', sub_phase: 'pagination_start', message: `Starting API pagination concurrently (limit: ${maxConcurrency}) from page ${resumePage}...` });

    // Inner function to fetch a single page using APIManager
    async function fetchPage(pageToFetch) {
        if (isDone) return null;

        // APIManager.sendRequest handles semaphore acquisition/release internally
        // logger.debug(`[fetchPage ${pageToFetch}] Attempting to acquire key via APIManager...`); 

        try {
            if (forceStopCycle || isDone) {
                 // logger.debug(`[fetchPage ${pageToFetch}] Cycle stopped or already done, skipping fetch.`);
                 return null;
            }

            const url = `https://api.lzt.market/steam?game[]=252490&no_vac=true&page=${pageToFetch}`;
            
            // <<< Use APIManager.sendRequest with isCategorySearch = true >>>
            // It handles key selection, cooldowns, retries, and semaphore
            const response = await apiManager.sendRequest(url, 'GET', {}, null, true); 
            
            // If sendRequest succeeded, process the response
            if (!response?.data) {
                logger.warn(`[fetchPage ${pageToFetch}] No data received after successful sendRequest, assuming empty.`);
                return { page: pageToFetch, items: [], error: false }; // Not a fetch error per se
            }

            const items = response.data.items || [];
            if (items.length > 0) {
                const processed = items.map(item => ({
                    item_id: String(item.item_id),
                    price: item.price,
                    steam_last_activity: item.account_last_activity,
                    query: item.query
                }));
                return { page: pageToFetch, items: processed, error: false };
            } else {
                // logger.info(`Page ${pageToFetch} was empty.`); // Reduce log spam
                return { page: pageToFetch, items: [], error: false };
            }

        } catch (error) {
            // Errors here are those that persisted after APIManager retries
            logger.error(`APIManager failed to fetch page ${pageToFetch} after retries: ${error.message}.`);
             return { page: pageToFetch, items: [], error: true }; // Mark as error for processing
        } 
        // No finally block needed here as APIManager handles semaphore release
    }

    // --- Main Loop: Spawn Fetchers & Process Results --- 
    let headPointer = 0; // Pointer to the next promise in the array to process
    const estimatedTotalPages = 50; // <<< Placeholder: Estimate or dynamically calculate a rough total? Needs adjustment.
    
    while (!isDone) {
        // Spawn new fetchers up to a certain limit ahead of the processor
        while (fetchPromises.length < headPointer + maxConcurrency * 2 && !isDone) {
            if (forceStopCycle) {
                if (isPausedByUser) pausedCycleState = { phase: 'pagination', data: { currentPage: currentPage } };
                throw new Error('Pagination interrupted by user during fetcher spawning.');
            }
            
            if (!isDone) {
                 fetchPromises.push(fetchPage(currentPage));
                 currentPage++;
                 if (currentPage > 10000) { 
                    logger.error('Reached page 10000, assuming error or infinite loop. Stopping pagination.');
                    isDone = true; 
                 }
            }
        }

        // Process the next available result
        if (headPointer < fetchPromises.length) {
            const result = await fetchPromises[headPointer]; 
            headPointer++;

            if (result) { 
                const { page, items, error } = result;
                highestPageProcessed = Math.max(highestPageProcessed, page);
                counters.pages_checked++;
                
                // <<< Calculate estimated pagination progress >>>
                // This is a rough estimate, as the actual total pages are unknown
                const paginationProgress = Math.min(95, Math.round((counters.pages_checked / (estimatedTotalPages * 1.2)) * 20)); // Allocate 20% of overall progress to pagination estimate
                const currentOverallProgress = 5 + paginationProgress; // Starts after initial 5%

                if (items.length > 0) {
                    allItems.push(...items);
                    totalItemsFound += items.length;
                    consecutiveEmptyPages = 0; // Reset counter
                    // Limit broadcast frequency
                    if (counters.pages_checked % 5 === 0 || items.length > 5) { 
                        broadcast({ 
                            type: 'progress', 
                            phase: 'fetch_items', 
                            sub_phase: 'pagination_page', 
                            message: `Checked page ${page}. Found ${items.length}. Total: ${totalItemsFound}.`, 
                            progress: currentOverallProgress // <<< Send estimated overall progress
                        });
                    }
                } else {
                    if (!error) {
                        consecutiveEmptyPages++;
                    } else {
                        consecutiveEmptyPages++; 
                        logger.warn(`Page ${page} processed with persistent fetch error after retries. Consecutive empty/error: ${consecutiveEmptyPages}.`);
                    }
                    // Broadcast progress even for empty/error pages
                    broadcast({ 
                        type: 'progress', 
                        phase: 'fetch_items', 
                        sub_phase: 'pagination_page', 
                        message: `Checked page ${page}. Found 0 items. Total: ${totalItemsFound}.`,
                        progress: currentOverallProgress // <<< Send estimated overall progress
                    });

                    if (consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY_PAGES) {
                        logger.info(`Stopping pagination spawning after ${consecutiveEmptyPages} consecutive empty/error pages processed.`);
                        isDone = true; // Stop spawning new requests
                    }
                }
            } else {
                 // logger.debug('Processed a null result, likely due to early exit.');
            }
        } else if (isDone) {
             break; // Exit main loop
        } else {
             logger.warn('Pagination loop in unexpected state, waiting...');
             await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Final cleanup
    logger.info(`Waiting for ${fetchPromises.length - headPointer} remaining fetch promises to complete...`);
    await Promise.allSettled(fetchPromises.slice(headPointer)); 
    logger.info('All fetch promises settled.');

    logger.info(`Pagination complete. Total pages checked: ${counters.pages_checked}. Total items found: ${totalItemsFound}`);
    // Final broadcast for this phase uses overall progress from the main function
    // broadcast({ type: 'progress', phase: 'fetch_items', sub_phase: 'pagination_end', message: `Finished fetching items. Found ${totalItemsFound}.` });
    return allItems;
}

// NEW Function to get Steam Inventory Details using the /steam-value endpoint
async function getSteamInventoryDetails(itemId) {
    const link = `https://lzt.market/${itemId}/`; // Construct the link parameter
    const appId = 252490; // Rust App ID
    const url = `https://prod-api.lzt.market/steam-value?link=${encodeURIComponent(link)}&app_id=${appId}`;

    logger.debug(`[getSteamInventoryDetails ${itemId}] Requesting URL: ${url}`);

    try {
        // Using apiManager.sendRequest which handles keys, rate limits, retries
        const response = await apiManager.sendRequest(url, 'GET', {}, itemId); 

        // Log the entire raw response data for inspection
        logger.debug(`[getSteamInventoryDetails ${itemId}] Raw API Response Data: ${JSON.stringify(response?.data, null, 2)}`);

        if (response?.data) { // Check if we got any data
            // We expect the data structure to be something like: { items: [], totalValue: X, itemCount: Y ... }
            // We will return the whole data object for now to be processed in autoRefresh
            logger.debug(`Successfully fetched Steam inventory details for item ${itemId}`);
            return response.data; 
        } else {
            logger.warn(`Steam inventory details structure unexpected or missing for ${itemId}. Response: ${JSON.stringify(response?.data)}`);
            return null;
        }
    } catch (error) {
        // Error logging is handled within sendRequest
        logger.error(`getSteamInventoryDetails failed for ${itemId} after retries: ${error.message}`);
        return null;
    }
}

// RENAMED/RESTORED: Function to get general Account Details using the /{itemId} endpoint
async function getAccountDetails(itemId) {
    const url = `https://api.lzt.market/${itemId}`;
    logger.debug(`[getAccountDetails ${itemId}] Requesting URL: ${url}`);
    try {
        // Use apiManager for rate limiting, retries, etc.
        const response = await apiManager.sendRequest(url, 'GET', {}, itemId);
        
        // Log the raw response data for inspection
        logger.debug(`[getAccountDetails ${itemId}] Raw API Response Data: ${JSON.stringify(response?.data, null, 2)}`); 
        
        if (response?.data?.item) {
            logger.debug(`Successfully fetched account details for item ${itemId}`);
            return response.data.item; // Return the nested item data
        } else {
             logger.warn(`Account details structure unexpected or missing for ${itemId}. Response: ${JSON.stringify(response?.data)}`);
             return null;
        }
    } catch (error) {
        logger.error(`getAccountDetails failed for ${itemId} after retries: ${error.message}`);
        return null;
    }
}

// Helper function for filtering inventory
function filterInventory(inventoryList, query) {
    const {
        last_active_min,
        last_active_max,
        item_amount_min,
        item_amount_max,
        hour_amount_min,
        hour_amount_max,
        // category // No longer used for single category
    } = query;

    // Get selected item keywords (can be multiple with the same name)
    let selectedItems = query.selected_items || [];
    // Ensure it's always an array, even if only one item is selected
    if (!Array.isArray(selectedItems)) {
        selectedItems = [selectedItems];
    }
    // Convert to lowercase for case-insensitive matching
    selectedItems = selectedItems.map(item => item.toLowerCase());

    return inventoryList.filter(item => {
        const itemData = item.item_data; 

        // --- Selected Items Filter (NEW) ---
        // If specific items are selected, the account MUST contain at least one of them
        if (selectedItems.length > 0) {
            const hasSelectedItem = itemData.items.some(subItem => {
                const titleLower = subItem.title?.toLowerCase() || '';
                // Check if the subItem title includes any of the selected keywords
                return selectedItems.some(selectedKeyword => titleLower.includes(selectedKeyword));
            });
            if (!hasSelectedItem) {
                return false; // Account doesn't have any of the selected items
            }
        }
        // --- End Selected Items Filter ---

        // Category Filter (REMOVED - replaced by selectedItems filter)
        /* if (category && category !== 'all' && itemData.category !== category) {
            return false;
        } */

        // Last Active Filter
        if (last_active_min || last_active_max) {
            if (!itemData.steam_last_activity) return false; 
            const daysSinceLastActive = (Date.now() - itemData.steam_last_activity * 1000) / (1000 * 60 * 60 * 24);
            const minDays = parseInt(last_active_min) || 0;
            const maxDays = parseInt(last_active_max) || Infinity;
            if (!(minDays <= daysSinceLastActive && daysSinceLastActive <= maxDays)) return false;
        }

        // Item Amount Filter
        if (item_amount_min || item_amount_max) {
            const currentItems = itemData.item_count || 0;
            const minItems = parseInt(item_amount_min) || 0;
            const maxItems = parseInt(item_amount_max) || Infinity;
            if (!(minItems <= currentItems && currentItems <= maxItems)) return false;
        }
        
        // Hour Amount Filter (Added)
        if (hour_amount_min || hour_amount_max) {
            const currentHours = itemData.rust_playtime_forever || 0; // Treat null/undefined as 0
            const minHours = parseFloat(hour_amount_min) || 0;
            const maxHours = parseFloat(hour_amount_max) || Infinity;
             if (!(minHours <= currentHours && currentHours <= maxHours)) return false;
        }

        return true; // Item passes all filters
    });
}

// Helper function for sorting inventory
function sortInventory(inventoryList, sortBy, sortOrder) {
    const reverse = sortOrder === 'desc';

    // Clone list to avoid modifying the original in place
    const sortedList = [...inventoryList]; 

    sortedList.sort((a, b) => {
        let valA, valB;

        switch (sortBy) {
            case 'cheapest_price':
                valA = parseFloat(a.item_data.price) || (reverse ? -Infinity : Infinity); // Handle nulls based on order
                valB = parseFloat(b.item_data.price) || (reverse ? -Infinity : Infinity);
                break;
            case 'most_items':
                valA = a.item_data.item_count || 0;
                valB = b.item_data.item_count || 0;
                break;
            case 'hours': // Added hours sorting
                valA = a.item_data.rust_playtime_forever || 0; // Treat null/undefined as 0
                valB = b.item_data.rust_playtime_forever || 0;
                break;
            case 'cheapest_most_value': // Ratio: value / price
                const priceA = parseFloat(a.item_data.price);
                const priceB = parseFloat(b.item_data.price);
                valA = (priceA && priceA > 0) ? (a.item_data.total_value / priceA) : 0;
                valB = (priceB && priceB > 0) ? (b.item_data.total_value / priceB) : 0;
                // Note: For ratio, higher is better, so reverse logic applies differently
                return reverse ? valB - valA : valA - valB;
            default: // Default to sorting by item_id (string comparison)
                valA = a.item_id;
                valB = b.item_id;
                return reverse ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }

        // Default numeric comparison for cases not handled above
        if (typeof valA === 'number' && typeof valB === 'number') {
            return reverse ? valB - valA : valA - valB;
        }
        // Fallback for non-numeric or default case already handled
        return 0; 
    });

    return sortedList;
}

app.get('/', (req, res) => {
    const inventoryCache = cacheManager.getCache();
    let inventoryList = Object.entries(inventoryCache).map(([itemId, itemData]) => {
        // Map initial data
        const mappedData = {
            item_id: itemId,
            item_data: {
                price: itemData.price,
                steam_last_activity: itemData.steam_last_activity,
                steam_country: itemData.steam_country,
                rust_playtime_forever: itemData.rust_playtime_forever,
                steam_transactions: itemData.steam_transactions || [],
                total_value: itemData.total_value || 0,
                item_count: itemData.item_count || 0,
                items: itemData.items || [],
                query: itemData.query,
                category: 'none' // Keep account-level category (first found)
            }
        };

        // --- Add Sub-Item Categorization ---
        const categories = {
            building: ["Legacy Wood", "Adobe", "Shipping Container", "Brick", "Brutalist", "Adobe Gate and Wall Pack"],
            hazmat: ["Frontiersman Pack", "Abyss Pack", "Nomad Pack", "Arctic Pack", "Lumberjack Pack"],
            emote: ["Gesture Pack"],
            misc: ["Ice King Pack", "Medieval Pack", "Wallpaper Starter Pack", "Weapon Racks"],
            custom: ["Ninja Suit", "Frontier Decor Pack"] // Added Custom category
        };

        let accountCategoryAssigned = false;
        if (mappedData.item_data.items && Array.isArray(mappedData.item_data.items)) {
            mappedData.item_data.items.forEach(subItem => {
                const title = subItem.title?.toLowerCase() || '';
                subItem.category = 'none'; // Initialize sub-item category
                
                for (const [cat, keywords] of Object.entries(categories)) {
                    if (keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
                        subItem.category = cat;
                        // Assign first found category to the account level as well
                        if (!accountCategoryAssigned) {
                            mappedData.item_data.category = cat;
                            accountCategoryAssigned = true;
                        }
                        break; // Stop checking categories for this sub-item
                    }
                }
            });
        }
        // --- End Sub-Item Categorization ---
        return mappedData;
    });

    // Apply Filters based on req.query
    const filteredList = filterInventory(inventoryList, req.query);

    // Apply Sorting based on req.query
    const sortBy = req.query.sort_by;
    const sortOrder = req.query.sort_order || 'asc'; // Default to asc
    const sortedList = sortInventory(filteredList, sortBy, sortOrder);

    // Pagination (applied AFTER filtering and sorting)
    const itemsPerPage = 75; // Increased items per page
    const currentPage = parseInt(req.query.page || '1');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInventory = sortedList.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sortedList.length / itemsPerPage);

    res.render('index', { 
        inventory: sortedList, // Pass the full sorted/filtered list for accurate total count
        paginatedInventory: paginatedInventory, // Pass the paginated list for display
        totalPages: totalPages,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage, // Pass itemsPerPage for summary text
        path: '/',
        query: req.query // Pass query params for initializing filters
    });
});

app.get('/settings', (req, res) => {
    const currentSettings = {
        api_keys_count: apiManager.keys.length,
        auto_refresh_enabled: autoRefreshEnabled,
        refresh_interval: autoRefreshInterval ? (autoRefreshInterval._repeat / (60 * 1000)) : 5
    };

    res.render('settings', {
        path: '/settings',
        settings: currentSettings
    });
});

app.get('/statistics', (req, res) => {
    res.render('statistics', {
        path: '/statistics',
        initialStats: stats
    });
});

app.post('/api/toggle_auto_refresh', (req, res) => {
    const { action, isPause } = req.body;
    const refreshIntervalMinutes = 5;
    const intervalMs = refreshIntervalMinutes * 60 * 1000;

    if (action === 'start') {
        if (!autoRefreshEnabled) {
            autoRefreshEnabled = true;
            isPausedByUser = false; // Starting clears pause state
            pausedCycleState = null; // Starting clears saved state
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(async () => {
                if (autoRefreshEnabled && !isAutoRefreshRunning) await autoRefresh(); // Only run if enabled and not already running
                else if (!autoRefreshEnabled) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
            }, intervalMs);
            logger.info(`Auto-refresh enabled & interval set for ${refreshIntervalMinutes} minutes.`);
            if (!isAutoRefreshRunning) autoRefresh(); // Start cycle immediately if not running
            broadcast({ type: 'status' });
            res.json({ status: 'auto_refresh_started' });
        } else {
            res.json({ status: 'already_enabled' });
        }
    } else if (action === 'stop') {
        const wasEnabled = autoRefreshEnabled;
        autoRefreshEnabled = false; // Disable future auto runs

        if (isAutoRefreshRunning) {
            logger.info('Stop requested while cycle running. Setting interruption flag.');
            forceStopCycle = true; // Signal cycle to stop (it will save state if isPause is true)
            if (isPause) {
                 isPausedByUser = true;
                 logger.info('Stop request is a PAUSE action. Cycle will attempt to save state.');
            } else {
                 isPausedByUser = false; // Regular stop/disable, cycle will not save state
                 pausedCycleState = null; // Clear any previous pause state
            }
        } else {
            logger.info('Stop requested while idle. Auto-refresh disabled.');
            isPausedByUser = false; // Cannot be paused if idle
            pausedCycleState = null; // Clear any previous pause state
        }
        
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
            logger.info('Auto-refresh interval cleared.');
        }
        
        // Broadcast status change (isEnabled, isPaused intent)
        broadcast({ type: 'status' }); 
        res.json({ status: wasEnabled ? 'auto_refresh_stopped' : 'already_disabled', paused: isPausedByUser });
    } else {
        res.status(400).json({ status: 'invalid_action' });
    }
});

// API: Resume Refresh - Updated to handle pagination state
app.post('/api/resume_refresh', (req, res) => {
    if (isPausedByUser && pausedCycleState) { // Check if paused and state exists
        logger.info(`Resume requested. Resuming from phase: ${pausedCycleState.phase}`);
        const stateToResume = pausedCycleState;
        isPausedByUser = false; // Clear pause flag
        pausedCycleState = null; // Clear saved state *before* starting async operation
        broadcast({ type: 'status', isPaused: false });

        if (!isAutoRefreshRunning) {
            autoRefresh(stateToResume); // Call autoRefresh with the saved state (could be pagination or other phase)
            res.json({ status: 'resume_triggered' });
        } else {
            logger.warn('Resume requested, but a cycle is already running somehow. Resetting pause state.');
            broadcast({ type: 'status', isPaused: false }); // Still clear pause visuals
            res.json({ status: 'cycle_already_running_cannot_resume' });
        }
    } else if (isPausedByUser) {
         // Paused, but no state saved (shouldn't happen with new logic, but handle defensively) -> Restart
         logger.warn('Resume requested while paused, but no specific state was saved. Restarting cycle.');
         isPausedByUser = false;
         pausedCycleState = null; // Ensure state is clear
         broadcast({ type: 'status', isPaused: false });
         if (!isAutoRefreshRunning) {
             autoRefresh(); // Start fresh
             res.json({ status: 'resume_triggered_restart' });
         } else {
             logger.warn('Resume requested restart, but a cycle is already running somehow.');
             broadcast({ type: 'status', isPaused: false }); // Still clear pause visuals
             res.json({ status: 'cycle_already_running_cannot_restart' });
         }
    } else {
        logger.warn('Resume requested, but not currently paused.');
        res.status(400).json({ status: 'not_paused' });
    }
});

// API: End Task (Clears pause and saved state)
app.post('/api/end_task', (req, res) => {
    if (isPausedByUser) {
        logger.info('End Task requested. Clearing paused state and any saved state.');
        isPausedByUser = false;
        pausedCycleState = null; // Clear saved state
        if (isAutoRefreshRunning) {
            logger.info('End task signaling running cycle to stop completely.');
            forceStopCycle = true; // Ensure it stops if somehow still running
        }
        // AutoRefreshEnabled is already false from the initial pause/stop call
        broadcast({ type: 'status', isPaused: false, isRunning: isAutoRefreshRunning }); // Inform clients of cleared pause state
        res.json({ status: 'task_ended_pause_cleared' });
    } else {
        logger.warn('End Task requested, but not currently paused.');
        res.status(400).json({ status: 'not_paused' });
    }
});

// SSE routes (can be removed or kept)
/* // Commented out/Removed
app.get('/api/notifications', (req, res) => {
    notificationsSSE.init(req, res);
});
app.get('/api/logs', (req, res) => {
    logsSSE.init(req, res);
});
*/

app.post('/api/add_item', async (req, res) => {
    const { item_id } = req.body;
    if (!item_id) {
        return res.status(400).json({ status: 'error', message: 'No item_id provided' });
    }

    const value = await getInventoryValue(item_id);
    if (value) {
        value.price = null;
        value.steam_last_activity = null;
        value.query = null;
        cacheManager.addOrUpdateItem(item_id, value);
        logger.info(`Item ${item_id} added manually.`);
        res.json({ status: 'added', item_id });
    } else {
        res.status(500).json({ status: 'error', message: 'Failed to retrieve inventory value' });
    }
});

app.post('/api/remove_item', (req, res) => {
    const { item_id } = req.body;
    if (!item_id) {
        return res.status(400).json({ status: 'error', message: 'No item_id provided' });
    }

    if (cacheManager.removeItem(item_id)) {
        logger.info(`Item ${item_id} removed manually.`);
        res.json({ status: 'removed', item_id });
    } else {
        res.status(404).json({ status: 'error', message: 'Item_id not found in cache' });
    }
});

app.get('/api/check_cache', (req, res) => {
    res.json({ cache_exists: fs.existsSync(CACHE_FILE) });
});

app.get('/api/check_auto_refresh_status', (req, res) => {
    res.json({ auto_refresh_enabled: autoRefreshEnabled, is_running: isAutoRefreshRunning });
});

app.post('/api/settings', (req, res) => {
    const { auto_refresh_enabled: enableRefresh, refresh_interval } = req.body;

    try {
        if (enableRefresh !== undefined && refresh_interval !== undefined) {
             const newIntervalMinutes = parseInt(refresh_interval);
             const newIntervalMs = newIntervalMinutes * 60 * 1000;

            if (enableRefresh && !autoRefreshEnabled) {
                autoRefreshEnabled = true;
                if (autoRefreshInterval) clearInterval(autoRefreshInterval);
                autoRefreshInterval = setInterval(async () => {
                     if(autoRefreshEnabled) await autoRefresh();
                     else { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
                }, newIntervalMs);
                logger.info(`Auto-refresh enabled with interval: ${newIntervalMinutes} minutes`);
                autoRefresh();
                broadcast({ type: 'status', isEnabled: true });
            } else if (!enableRefresh && autoRefreshEnabled) {
                autoRefreshEnabled = false;
                if (autoRefreshInterval) {
                     clearInterval(autoRefreshInterval);
                     autoRefreshInterval = null;
                }
                logger.info(`Auto-refresh disabled`);
                broadcast({ type: 'status', isEnabled: false });
            } else if (enableRefresh && autoRefreshEnabled) {
                if (autoRefreshInterval && autoRefreshInterval._repeat !== newIntervalMs) {
                     clearInterval(autoRefreshInterval);
                     autoRefreshInterval = setInterval(async () => {
                         if(autoRefreshEnabled) await autoRefresh();
                         else { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
                     }, newIntervalMs);
                     logger.info(`Auto-refresh interval updated to: ${newIntervalMinutes} minutes`);
                }
            }
            autoRefreshEnabled = enableRefresh;
        }

        res.json({ status: 'success', message: 'Settings updated successfully' });
    } catch (error) {
        logger.error(`Error updating settings: ${error.message}`);
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
});

app.get('/api/keys', (req, res) => {
    try {
        const keys = apiManager.keys || [];
        res.json({ status: 'success', keys });
    } catch (error) {
        logger.error(`Error fetching API keys: ${error.message}`);
        res.status(500).json({ status: 'error', message: 'Failed to fetch API keys' });
    }
});

app.post('/api/keys', (req, res) => {
    try {
        const { keys } = req.body;
        
        if (!Array.isArray(keys)) {
            return res.status(400).json({ status: 'error', message: 'Invalid keys format' });
        }
        
        const validKeys = keys.filter(key => key.trim() !== '');
        
        fs.writeFileSync('api.keys', validKeys.join('\n'));
        
        apiManager.keys = validKeys;
        validKeys.forEach(key => {
            if (!apiManager.keyLastRequestTime.has(key)) {
                apiManager.keyLastRequestTime.set(key, 0);
            }
        });
        
        const validKeySet = new Set(validKeys);
        for (const key of apiManager.keyLastRequestTime.keys()) {
             if (!validKeySet.has(key)) {
                 apiManager.keyLastRequestTime.delete(key);
             }
        }
        
        logger.info(`API keys updated: ${validKeys.length} keys saved`);
        res.json({ status: 'success', message: 'API keys updated successfully', count: validKeys.length });
    } catch (error) {
        logger.error(`Error saving API keys: ${error.message}`);
        res.status(500).json({ status: 'error', message: 'Failed to save API keys' });
    }
});

// --- HTTPS Configuration --- 
const httpsPort = 443; // Standard HTTPS port
let httpsOptions = null;
const certPath = path.join(__dirname, 'certs'); // Assuming certs folder is in the same directory

try {
    // Use the exact filenames found in the certs directory
    const privateKeyPath = path.join(certPath, 'panel.auth0ai.fun-key.pem');
    const certificatePath = path.join(certPath, 'panel.auth0ai.fun-chain.pem'); // Use the full chain file

    if (fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath)) {
        httpsOptions = {
            key: fs.readFileSync(privateKeyPath),
            cert: fs.readFileSync(certificatePath)
        };
        logger.info(`SSL Certificates loaded successfully from ${certPath}`);
    } else {
        logger.warn(`SSL Certificate files (panel.auth0ai.fun-key.pem, panel.auth0ai.fun-chain.pem) not found in ${certPath}. Starting in HTTP mode only.`);
    }
} catch (error) {
    logger.error(`Error reading SSL certificates: ${error.message}. Starting in HTTP mode only.`);
    httpsOptions = null; // Ensure it's null on error
}
// --- End HTTPS Configuration ---


// --- Server Startup --- 
const PORT = process.env.PORT || 3000; // Keep original HTTP port for potential fallback/other uses

let server;
let httpServerForRedirect = null; // Keep track of the HTTP server for graceful shutdown

if (httpsOptions) {
    // Start HTTPS Server
    server = https.createServer(httpsOptions, app).listen(httpsPort, () => {
        logger.info(`HTTPS Server is running on port ${httpsPort} for panel.auth0ai.fun`);
    });

    // Optional: Start a simple HTTP server on PORT to redirect to HTTPS
    const http = require('http'); // Require http here
    httpServerForRedirect = http.createServer((req, res) => {
        const host = req.headers['host']; // Get the host header
        if (host) {
            // Redirect to the same path on HTTPS
            res.writeHead(301, { "Location": `https://${host}${req.url}` });
            logger.debug(`Redirecting HTTP request from ${req.url} to HTTPS`);
        } else {
            // Fallback if host header is missing
            res.writeHead(400);
            res.end("Host header is required for redirect.");
        }
        res.end();
    }).listen(PORT, () => {
         logger.info(`HTTP server listening on port ${PORT} for redirection to HTTPS.`);
    });

} else {
    // Fallback to HTTP if certificates are not loaded
    server = app.listen(PORT, () => {
        logger.warn(`Starting server in HTTP mode only on port ${PORT}. HTTPS certificates not found or failed to load.`);
    });
}

// Attach WebSocket Server to the main server (HTTPS or HTTP)
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful Shutdown logic needs to handle closing both servers if HTTPS is enabled
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: Closing connections and saving state...');
    
    // 1. Save final cache state SYNC
    cacheManager.saveFullCacheSync(); 
    
    // 2. Save stats SYNC
    saveStats(); 

    // 3. Close WebSocket connections
    logger.info(`Closing ${connectedClients.size} WebSocket connections...`);
    connectedClients.forEach(ws => {
        ws.terminate(); // Force close connections
    });
    
    wss.close(() => {
         logger.info('WebSocket server closed.');
         
         // Function to close the main server (HTTPS or HTTP)
         const closeMainServer = (callback) => {
             server.close((err) => {
                 if (err) {
                     logger.error('Error closing main server:', err);
                     callback(err); // Pass error to final exit logic
                 } else {
                     logger.info('Main server closed successfully.');
                     callback();
                 }
             });
         };

         // Function to close the HTTP redirect server if it exists
         const closeHttpRedirectServer = (callback) => {
            if (httpServerForRedirect) {
                httpServerForRedirect.close((err) => {
                    if (err) {
                        logger.error('Error closing HTTP redirect server:', err);
                    } else {
                        logger.info('HTTP redirect server closed successfully.');
                    }
                    callback(); // Always call callback, even on error here
                });
            } else {
                callback(); // No HTTP server to close
            }
         };

         // Close servers sequentially
         closeMainServer((mainServerError) => {
             closeHttpRedirectServer(() => {
                 // Final exit logic
                 cacheManager.closeLogStream();
                 if (mainServerError) {
                     logger.error('Exiting process with error during main server shutdown.');
                     process.exit(1);
                 } else {
                     logger.info('Exiting process gracefully.');
                     process.exit(0);
                 }
             });
         });
    });

    // Set a timeout in case closing hangs
    setTimeout(() => {
        logger.warn('Forcing exit after timeout during shutdown.');
        cacheManager.closeLogStream(); // Attempt to close stream before force exit
        process.exit(1);
    }, 5000); // Force exit after 5 seconds
}); 