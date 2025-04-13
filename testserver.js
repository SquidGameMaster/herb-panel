// testserver.js
const fs = require('fs').promises;
const axios = require('axios'); // Need to install axios: npm install axios
const { performance } = require('perf_hooks');

const API_KEYS_FILE = 'api.keys';
const API_BASE_URL = 'https://api.lzt.market';
const RATE_LIMIT_DELAY_MS = 3000; // 3 seconds per key (20 requests/minute)
const TARGET_PAGE = 1; // Only testing page 1

class ApiKeyManager {
    constructor(keys) {
        this.keys = keys;
        // Store last used timestamp for each key. Initialize to 0 to allow immediate use.
        this.keyLastUsed = new Map(keys.map(key => [key, 0]));
        // Track if a key is currently 'checked out' for a request.
        this.keyLocks = new Map(keys.map(key => [key, false]));
        console.log(`[ApiKeyManager] Initialized with ${keys.length} keys.`);
    }

    // Finds the next available key that has cooled down and is not locked.
    // Waits if necessary.
    async getAvailableKey() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let availableKey = null;
            let earliestNextAvailableTime = Infinity;
            let shouldLogWait = true; // Flag to log wait message only once per check cycle
            const now = Date.now();

            // Iterate through keys to find one ready and unlocked
            for (const key of this.keys) {
                if (!this.keyLocks.get(key)) { // Check if the key is locked
                    const lastUsed = this.keyLastUsed.get(key);
                    const timeSinceLastUse = now - lastUsed;

                    if (timeSinceLastUse >= RATE_LIMIT_DELAY_MS) {
                        availableKey = key; // Found an available key
                        break;
                    } else {
                        // Calculate when this key *will* be available next
                        earliestNextAvailableTime = Math.min(earliestNextAvailableTime, lastUsed + RATE_LIMIT_DELAY_MS);
                    }
                } else {
                     // If key is locked, consider its cooldown for earliest time
                     const lastUsed = this.keyLastUsed.get(key);
                     earliestNextAvailableTime = Math.min(earliestNextAvailableTime, lastUsed + RATE_LIMIT_DELAY_MS);
                }
            }

            // If we found an available key, lock it and return
            if (availableKey) {
                this.keyLocks.set(availableKey, true); // Lock the key before returning
                // console.log(`[ApiKeyManager] Acquired key ending in ...${availableKey.slice(-6)}`);
                return availableKey;
            }

            // If no key is available, calculate wait time and pause
            const currentTime = Date.now(); // Recalculate current time
            // Wait until the earliest available key is ready, or a minimum of 50ms
            const waitTime = earliestNextAvailableTime > currentTime
                           ? Math.max(50, earliestNextAvailableTime - currentTime)
                           : 50;
            // Log only once per check cycle if waiting is needed
            if (shouldLogWait) {
                console.log(`[ApiKeyManager] No keys immediately available. Waiting approx ${waitTime.toFixed(0)}ms... (Earliest key ready around: ${new Date(earliestNextAvailableTime).toISOString()})`);
                shouldLogWait = false; // Prevent logging again until next full check
            }
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Loop will continue and re-check availability
        }
    }

    // Releases the lock on a key and updates its last used time.
    releaseKey(key) {
        if (this.keyLocks.has(key)) {
            this.keyLastUsed.set(key, Date.now()); // Update last used time *upon release*
            this.keyLocks.set(key, false); // Unlock the key
            // console.log(`[ApiKeyManager] Released key ending in ...${key.slice(-6)}`);
        } else {
            console.warn(`[ApiKeyManager] Attempted to release unknown or already released key: ...${key.slice(-6)}`);
        }
    }

     // Helper to make requests, automatically handling key acquisition/release.
    async sendRequestWithManagedKey(url) {
        let key = null;
        let startTime = null; // Declare startTime outside the try block
        try {
            key = await this.getAvailableKey();
            const headers = { 'Authorization': `Bearer ${key}` };
            startTime = performance.now(); // Assign startTime *after* getting the key
            console.log(`[Request] Sending request to ${url.split('?')[0]} with key ...${key.slice(-6)}`);

            const response = await axios.get(url, {
                 headers,
                 timeout: 15000 // 15 second timeout for requests
             });

            const endTime = performance.now();
            console.log(`[Request] Success for ${url.split('?')[0]} with key ...${key.slice(-6)} (Status: ${response.status}, Time: ${(endTime - startTime).toFixed(0)}ms)`);
            return response.data;
        } catch (error) {
            const endTime = performance.now();
            // Check if startTime was assigned before calculating duration
            const duration = startTime ? (endTime - startTime).toFixed(0) : 'N/A';
             const keyIdentifier = key ? `...${key.slice(-6)}` : 'N/A';
            console.error(`[Request] Error for ${url.split('?')[0]} with key ${keyIdentifier} (Time: ${duration}ms): ${error.response ? `${error.response.status} ${error.response.statusText}` : error.message}`);

            if (error.response && error.response.status === 429) {
                console.warn(`[Request] Received 429 for key ${keyIdentifier}. Rate limit logic might need adjustment or API has stricter limits.`);
                // Optional: Implement exponential backoff for this specific key?
                // For now, the standard delay should handle it on the next attempt for this key.
            }
            throw error; // Re-throw to be handled by the calling function
        } finally {
            if (key) {
                this.releaseKey(key); // Ensure the key is always released
            }
        }
    }
}

// Fetches item IDs for a specific page using the ApiKeyManager.
async function fetchItemIdsForPage(apiKeyManager, page) {
    const url = `${API_BASE_URL}/steam?game%5B%5D=252490&no_vac=true&page=${page}`;
    try {
        const data = await apiKeyManager.sendRequestWithManagedKey(url);
        // Ensure data and items exist and map to item_id
        return data?.items?.map(item => item.item_id).filter(id => id != null) || [];
    } catch (error) {
        console.error(`[Main] Failed to fetch item IDs for page ${page}:`, error.message);
        return []; // Return empty array on failure to allow process continuation
    }
}

// Fetches details and inventory value for a single item ID.
async function fetchItemData(apiKeyManager, itemId) {
    const detailsUrl = `${API_BASE_URL}/market/${itemId}`;
    // Updated based on previous work: Use /api/lzt/market/{itemId} for details
    // Updated based on previous work: Use /api/lzt/market/{itemId}/inventory-value
    const inventoryUrl = `${API_BASE_URL}/market/${itemId}/inventory-value?app_id=252490`; // Ensure app_id if needed

    let details = null;
    let inventoryValue = null;
    let detailsError = null;
    let inventoryError = null;

    // Use Promise.allSettled to fetch both concurrently, managed by the ApiKeyManager
    const results = await Promise.allSettled([
        apiKeyManager.sendRequestWithManagedKey(inventoryUrl),
        apiKeyManager.sendRequestWithManagedKey(detailsUrl)
    ]);

    if (results[0].status === 'fulfilled') {
        inventoryValue = results[0].value;
    } else {
        inventoryError = results[0].reason.message || 'Inventory fetch failed';
        console.error(`[Item ${itemId}] Inventory fetch failed: ${inventoryError}`);
    }

    if (results[1].status === 'fulfilled') {
        details = results[1].value;
    } else {
        detailsError = results[1].reason.message || 'Details fetch failed';
         console.error(`[Item ${itemId}] Details fetch failed: ${detailsError}`);
    }

    // Return status based on whether we got *any* data
    if (details || inventoryValue) {
        // console.log(`[Item ${itemId}] Processed.`); // Reduce log noise
        return { itemId, details, inventoryValue, status: 'fulfilled' };
    } else {
        console.error(`[Item ${itemId}] Failed to fetch both details and inventory.`);
        return { itemId, status: 'rejected', reason: `Inventory: ${inventoryError}, Details: ${detailsError}` };
    }
}


// Main test execution function
async function runTest() {
    console.log("Starting test...");
    const overallStartTime = performance.now();

    let apiKeys = [];
    try {
        const keysContent = await fs.readFile(API_KEYS_FILE, 'utf-8');
        apiKeys = keysContent.trim().split('\n').filter(key => key && key.length > 10); // Basic validation
        if (apiKeys.length === 0) {
            console.error(`\nError: No valid API keys found in ${API_KEYS_FILE}.`);
            console.error("Please add keys, one per line. Exiting.");
            return;
        }
         console.log(`Loaded ${apiKeys.length} API key(s).`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`\nError: API keys file not found at '${API_KEYS_FILE}'.`);
            console.error("Please create this file and add your API keys, one per line. Exiting.");
        } else {
            console.error(`\nError reading API keys file (${API_KEYS_FILE}):`, err.message);
            console.error("Exiting.");
        }
        return;
    }

    // Check if axios is installed before proceeding
    try {
        require.resolve('axios');
    } catch (e) {
        console.error("\nError: 'axios' package is not installed.");
        console.error("Please run 'npm install axios' in your terminal and try again. Exiting.");
        process.exit(1); // Exit if axios is not found
    }


    const apiKeyManager = new ApiKeyManager(apiKeys);

    console.log(`\nFetching item IDs for page ${TARGET_PAGE}...`);
    const fetchIdsStartTime = performance.now();
    const itemIds = await fetchItemIdsForPage(apiKeyManager, TARGET_PAGE);
    const fetchIdsEndTime = performance.now();

    if (!itemIds || itemIds.length === 0) {
        console.error(`\nNo item IDs retrieved for page ${TARGET_PAGE}. Cannot proceed with item processing.`);
        const overallEndTime = performance.now();
        console.log(`Total execution time: ${(overallEndTime - overallStartTime) / 1000} seconds`);
        return;
    }

    console.log(`Found ${itemIds.length} items on page ${TARGET_PAGE} (Fetch time: ${(fetchIdsEndTime - fetchIdsStartTime).toFixed(0)}ms).`);
    console.log(`Starting concurrent processing for ${itemIds.length} items (2 requests per item)...`);

    const processingStartTime = performance.now();
    const processingPromises = itemIds.map(itemId => fetchItemData(apiKeyManager, itemId));
    const results = await Promise.allSettled(processingPromises);
    const processingEndTime = performance.now();


    const overallEndTime = performance.now();
    const totalDurationSeconds = (overallEndTime - overallStartTime) / 1000;
    const processingDurationSeconds = (processingEndTime - processingStartTime) / 1000;

    let fulfilledCount = 0;
    let rejectedCount = 0;
    results.forEach((result, index) => {
        const itemId = itemIds[index]; // Get corresponding itemId
        if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
            fulfilledCount++;
        } else {
            rejectedCount++;
            const reason = result.status === 'rejected' ? result.reason : result.value?.reason;
            console.error(`[Result] Failed item ${itemId}: ${reason || 'Unknown error'}`);
        }
    });

    console.log("\n--- Test Results ---");
    console.log(`Target Page: ${TARGET_PAGE}`);
    console.log(`API Keys Used: ${apiKeys.length}`);
    console.log(`Rate Limit Delay Per Key: ${RATE_LIMIT_DELAY_MS}ms`);
    console.log(`Total Items Found: ${itemIds.length}`);
    console.log(`Successfully Processed: ${fulfilledCount}`);
    console.log(`Failed: ${rejectedCount}`);
    console.log("---");
    console.log(`Time to Fetch Item IDs: ${(fetchIdsEndTime - fetchIdsStartTime).toFixed(0)} ms`);
    console.log(`Time for Concurrent Item Processing: ${processingDurationSeconds.toFixed(2)} seconds`);
    console.log(`Total Test Duration: ${totalDurationSeconds.toFixed(2)} seconds`);
    console.log("---");
    const totalRequests = 1 + (itemIds.length * 2); // 1 for page fetch, 2 per item
    console.log(`Estimated Total API Calls: ${totalRequests}`);
     if (totalDurationSeconds > 0) {
         console.log(`Overall Average Requests Per Second: ${(totalRequests / totalDurationSeconds).toFixed(2)}`);
     }
     if (itemIds.length > 0 && processingDurationSeconds > 0) {
        console.log(`Average Item Processing Time (incl. failures): ${(processingDurationSeconds / itemIds.length * 1000).toFixed(0)} ms/item`);
    }
    const theoreticalMinTime = (itemIds.length * 2 * RATE_LIMIT_DELAY_MS) / (apiKeys.length * 1000); // 2 calls per item, divided by num keys
    console.log(`Theoretical Minimum Processing Time (ideal conditions): ${theoreticalMinTime.toFixed(2)} seconds`);
    console.log("--------------------\n");
}


runTest().catch(error => {
    console.error("\n--- Unhandled Error during test execution ---");
    console.error(error);
    console.error("---------------------------------------------\n");
}); 