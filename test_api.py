import asyncio
import aiohttp
import time
import logging
import sys
import json # Import json module
from pathlib import Path
import colorama # Import colorama

# --- Configuration ---
API_KEYS_FILE = Path('api.keys')
API_BASE_URL = 'https://api.lzt.market'
RATE_LIMIT_DELAY_SECONDS = 3.0  # 3 seconds per key
TARGET_PAGE = 1
REQUEST_TIMEOUT = 15  # seconds
MAX_RETRIES = 2 # Retries for 5xx errors or timeouts
RETRY_DELAY = 1 # seconds
# New output file for full item details
OUTPUT_JSON_FILE = Path('item_details.json')

# --- Initialize Colorama ---
colorama.init(autoreset=True)

# --- Custom Colored Formatter ---
class ColoredFormatter(logging.Formatter):
    COLORS = {
        'DEBUG': colorama.Fore.CYAN,
        'INFO': colorama.Fore.GREEN,
        'WARNING': colorama.Fore.YELLOW,
        'ERROR': colorama.Fore.RED,
        'CRITICAL': colorama.Fore.MAGENTA
    }

    def format(self, record):
        log_level_color = self.COLORS.get(record.levelname, colorama.Fore.WHITE)
        record.msg = f"{log_level_color}{record.msg}{colorama.Style.RESET_ALL}"
        # Make the levelname itself bold and colored
        record.levelname = f"{log_level_color}{colorama.Style.BRIGHT}{record.levelname}{colorama.Style.RESET_ALL}"
        # Optionally color the whole line - choose one method
        # formatted_message = super().format(record)
        # return f"{log_level_color}{formatted_message}{colorama.Style.RESET_ALL}"
        return super().format(record)

# --- Logging Setup ---
log = logging.getLogger(__name__)
log.setLevel(logging.INFO) # Keep overall level at INFO, or DEBUG for more detail
handler = logging.StreamHandler()
# Use the custom formatter
formatter = ColoredFormatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
# Remove existing handlers if any to avoid duplicate logs
if log.hasHandlers():
    log.handlers.clear()
log.addHandler(handler)
log.propagate = False # Prevent root logger from handling messages again

class AsyncApiKeyManager:
    """Manages API keys and enforces per-key rate limits asynchronously."""

    def __init__(self, keys):
        self._keys = keys
        # Store last used timestamp for each key (Unix timestamp)
        self._key_last_used = {key: 0.0 for key in keys}
        # Use asyncio Locks to prevent race conditions when acquiring keys
        self._locks = {key: asyncio.Lock() for key in keys}
        log.info(f"[ApiKeyManager] Initialized with {len(keys)} keys.")

    async def get_available_key(self):
        """Finds and acquires the lock for the next available key."""
        while True:
            earliest_next_available_time = float('inf')
            ready_key = None

            # Check keys for availability
            for key in self._keys:
                if not self._locks[key].locked():
                    last_used = self._key_last_used[key]
                    time_since_last_use = time.monotonic() - last_used

                    if time_since_last_use >= RATE_LIMIT_DELAY_SECONDS:
                        ready_key = key
                        break  # Found a ready key
                    else:
                        # Calculate when this key will be available
                        key_available_at = last_used + RATE_LIMIT_DELAY_SECONDS
                        earliest_next_available_time = min(earliest_next_available_time, key_available_at)
                else:
                     # If key is locked, consider its cooldown for earliest time
                     last_used = self._key_last_used[key]
                     key_available_at = last_used + RATE_LIMIT_DELAY_SECONDS
                     earliest_next_available_time = min(earliest_next_available_time, key_available_at)


            # If a key is ready, try to acquire its lock
            if ready_key:
                lock = self._locks[ready_key]
                try:
                    # Acquire the lock immediately without blocking if possible
                    await asyncio.wait_for(lock.acquire(), timeout=0.01)
                    # log.debug(f"[ApiKeyManager] Acquired key ...{ready_key[-6:]}")
                    return ready_key
                except asyncio.TimeoutError:
                    # Lock was acquired by another task just now, continue loop to find another
                    continue
                except Exception as e:
                    log.error(f"[ApiKeyManager] Unexpected error acquiring lock for key ...{ready_key[-6:]}: {e}")
                    continue # Try finding another key


            # If no key is ready, calculate wait time and sleep
            current_time = time.monotonic()
            wait_time = max(0.05, earliest_next_available_time - current_time) # Minimum 50ms wait
            # log.info(f"[ApiKeyManager] No keys immediately available. Waiting approx {wait_time:.2f}s...")
            await asyncio.sleep(wait_time)

    def release_key(self, key):
        """Releases the lock for a key and updates its last used time."""
        if key in self._locks:
            self._key_last_used[key] = time.monotonic() # Update time on release
            if self._locks[key].locked():
                self._locks[key].release()
                # log.debug(f"[ApiKeyManager] Released key ...{key[-6:]}")
            else:
                 log.warning(f"[ApiKeyManager] Attempted to release an already unlocked key: ...{key[-6:]}")
        else:
            log.warning(f"[ApiKeyManager] Attempted to release unknown key: ...{key[-6:]}")


async def send_request_with_managed_key(session: aiohttp.ClientSession, url: str, api_key_manager: AsyncApiKeyManager, semaphore: asyncio.Semaphore, retries=MAX_RETRIES):
    """Sends a request using a managed key, handling acquisition/release, retries, and global semaphore."""
    key = None
    start_time = None
    last_exception = None

    # Acquire the global semaphore before proceeding
    async with semaphore:
        for attempt in range(retries + 1):
            try:
                key = await api_key_manager.get_available_key()
                headers = {'Authorization': f'Bearer {key}'}
                start_time = time.monotonic()
                log.debug(f"[Request] Attempt {attempt+1}: Sending request to {url.split('?')[0]} with key ...{key[-6:]}")

                async with session.get(url, headers=headers, timeout=REQUEST_TIMEOUT) as response:
                    end_time = time.monotonic()
                    duration = end_time - start_time
                    log.debug(f"[Request] Raw response status {response.status} for {url.split('?')[0]} key ...{key[-6:]} ({duration:.2f}s)")

                    if response.status == 200:
                        log.info(f"[Request] Success for {url.split('?')[0]} key ...{key[-6:]} (Status: {response.status}, Time: {duration:.2f}s)")
                        return await response.json()
                    elif response.status == 404:
                        log.error(f"[Request] Received 404 Not Found for {url.split('?')[0]} key ...{key[-6:]}. Not retrying.")
                        response.raise_for_status()
                    elif response.status == 429:
                        log.warning(f"[Request] Received 429 for {url.split('?')[0]} key ...{key[-6:]}. Per-key delay should handle this.")
                        await asyncio.sleep(0.5) # Small extra wait on 429
                        last_exception = aiohttp.ClientResponseError(response.request_info, response.history, status=response.status, message="Rate Limited (429)", headers=response.headers)
                        break # Exit retry loop for 429
                    elif 500 <= response.status < 600:
                        log.warning(f"[Request] Received server error {response.status} for {url.split('?')[0]} key ...{key[-6:]}. Retrying if possible ({attempt+1}/{retries+1}).")
                        last_exception = aiohttp.ClientResponseError(response.request_info, response.history, status=response.status, message=f"Server Error ({response.status})", headers=response.headers)
                    else:
                         log.error(f"[Request] Unexpected status {response.status} for {url.split('?')[0]} key ...{key[-6:]} ({duration:.2f}s)")
                         response.raise_for_status()

            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                end_time = time.monotonic()
                duration = (end_time - start_time) if start_time else -1
                log.error(f"[Request] Network/Timeout Error for {url.split('?')[0]} key ...{key[-6:] if key else 'N/A'} (Time: {duration:.2f}s, Attempt: {attempt+1}/{retries+1}): {e}")
                last_exception = e
            finally:
                if key:
                    api_key_manager.release_key(key) # Ensure key is released

            # Retry logic for 5xx or timeouts (will not be reached for 404 now)
            if attempt < retries and last_exception is not None:
                should_retry = False
                if isinstance(last_exception, aiohttp.ClientResponseError):
                    # Retry only on 5xx server errors
                    if 500 <= last_exception.status < 600:
                        should_retry = True
                elif isinstance(last_exception, asyncio.TimeoutError):
                    # Retry on timeout
                    should_retry = True
                # Add other ClientErrors you might want to retry here

                if should_retry:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                    continue # Continue to next attempt

            # If no retry condition met or last attempt failed
            break # Exit retry loop

    # If loop finished without success
    log.error(f"[Request] Final failure for {url.split('?')[0]} after {attempt + 1} attempt(s).") # Corrected log message
    raise last_exception if last_exception else Exception(f"Unknown error after retries for {url}")


async def fetch_item_ids_for_page(session: aiohttp.ClientSession, api_key_manager: AsyncApiKeyManager, semaphore: asyncio.Semaphore, page: int):
    """Fetches item IDs for a specific page."""
    url = f'{API_BASE_URL}/steam?game%5B%5D=252490&no_vac=true&page={page}'
    try:
        # Use the semaphore for this request too
        data = await send_request_with_managed_key(session, url, api_key_manager, semaphore, retries=1)
        item_ids = [item['item_id'] for item in data.get('items', []) if 'item_id' in item]
        return item_ids
    except Exception as e:
        log.error(f"[Main] Failed to fetch item IDs for page {page}: {e}")
        return []


async def fetch_item_data(session: aiohttp.ClientSession, api_key_manager: AsyncApiKeyManager, semaphore: asyncio.Semaphore, item_id: int):
    """Fetches details for a single item ID.
       Returns the successful details data, or raises Exception on failure.
    """
    details_url = f'{API_BASE_URL}/{item_id}'

    try:
        # Only fetch the details URL
        details_data = await send_request_with_managed_key(session, details_url, api_key_manager, semaphore)
        # Return the successful data directly
        return details_data
    except Exception as e:
        # Log the specific item failure and re-raise to be caught by asyncio.gather
        log.error(f"[Item {item_id}] Failed to fetch details: {e}")
        raise # Re-raise the exception

async def main():
    """Main test execution function."""
    log.info("Starting Python API test (fetching item details only)...")
    overall_start_time = time.monotonic()

    # --- Load API Keys ---
    api_keys = []
    if not API_KEYS_FILE.exists():
        log.error(f"\nError: API keys file not found at '{API_KEYS_FILE}'.")
        log.error("Please create this file and add your API keys, one per line. Exiting.")
        sys.exit(1)
    try:
        with open(API_KEYS_FILE, 'r') as f:
            api_keys = [line.strip() for line in f if line.strip() and len(line.strip()) > 10]
        if not api_keys:
            log.error(f"\nError: No valid API keys found in {API_KEYS_FILE}.")
            log.error("Please add keys, one per line. Exiting.")
            sys.exit(1)
        log.info(f"Loaded {len(api_keys)} API key(s).")
    except Exception as e:
        log.error(f"\nError reading API keys file ({API_KEYS_FILE}): {e}")
        sys.exit(1)

    api_key_manager = AsyncApiKeyManager(api_keys)
    semaphore = asyncio.Semaphore(len(api_keys))
    log.info(f"Global concurrency limit set to: {len(api_keys)}")

    async with aiohttp.ClientSession() as session:
        # --- Fetch Item IDs ---
        log.info(f"\nFetching item IDs for page {TARGET_PAGE}...")
        fetch_ids_start_time = time.monotonic()
        item_ids = await fetch_item_ids_for_page(session, api_key_manager, semaphore, TARGET_PAGE)
        fetch_ids_end_time = time.monotonic()

        if not item_ids:
            log.error(f"\nNo item IDs retrieved for page {TARGET_PAGE}. Cannot proceed.")
            overall_end_time = time.monotonic()
            log.info(f"Total execution time: {overall_end_time - overall_start_time:.2f} seconds")
            return

        log.info(f"Found {len(item_ids)} items on page {TARGET_PAGE} (Fetch time: {(fetch_ids_end_time - fetch_ids_start_time):.2f}s).")
        log.info(f"Starting concurrent processing for {len(item_ids)} items (fetching details only)...")

        # --- Process Items Concurrently --- (now fetching details only)
        processing_start_time = time.monotonic()
        tasks = [fetch_item_data(session, api_key_manager, semaphore, item_id) for item_id in item_ids]
        # Use return_exceptions=True to prevent one failure stopping others
        results = await asyncio.gather(*tasks, return_exceptions=True)
        processing_end_time = time.monotonic()

    # --- Process Results & Save Successful Details ---
    successful_details = []
    failed_count = 0

    for result in results:
        if isinstance(result, Exception):
            failed_count += 1
            # Error already logged in fetch_item_data or send_request
        elif result is not None: # Should be the JSON dict on success
            successful_details.append(result)
        else:
            # Should not happen if exceptions are raised correctly
            log.warning("Encountered unexpected None result from gather.")
            failed_count += 1

    log.info(f"Successfully fetched details for {len(successful_details)} out of {len(item_ids)} items.")

    # Save the successful details to JSON
    try:
        with open(OUTPUT_JSON_FILE, 'w') as f:
            json.dump(successful_details, f, indent=4)
        log.info(f"Saved {len(successful_details)} item details results to {OUTPUT_JSON_FILE}")
    except Exception as e:
        log.error(f"Failed to save item details to {OUTPUT_JSON_FILE}: {e}")

    # --- Report Final Summary ---
    overall_end_time = time.monotonic()
    total_duration_seconds = overall_end_time - overall_start_time
    processing_duration_seconds = processing_end_time - processing_start_time

    log.info("\n--- Python Test Results (Details Focus) ---")
    log.info(f"Target Page: {TARGET_PAGE}")
    log.info(f"API Keys Used: {len(api_keys)}")
    log.info(f"Total Items Found on Page: {len(item_ids)}")
    log.info(f"Item Details Successfully Fetched & Saved: {len(successful_details)}")
    log.info(f"Items Where Detail Fetch Failed: {failed_count}")
    log.info("---")
    log.info(f"Time to Fetch Item IDs: {(fetch_ids_end_time - fetch_ids_start_time):.2f} s")
    log.info(f"Time for Concurrent Item Processing: {processing_duration_seconds:.2f} seconds")
    log.info(f"Total Test Duration: {total_duration_seconds:.2f} seconds")
    log.info("---")
    # Now only 1 main call per item + 1 page call
    total_requests = 1 + len(item_ids)
    log.info(f"Estimated Total API Calls Made (ignoring retries): {total_requests}")
    if total_duration_seconds > 0:
        log.info(f"Overall Average Requests Per Second: {(total_requests / total_duration_seconds):.2f}")
    if item_ids and processing_duration_seconds > 0:
        log.info(f"Average Item Processing Time (incl. failures): {(processing_duration_seconds / len(item_ids) * 1000):.0f} ms/item")
    # Theoretical time based on 1 call per item
    theoretical_min_time = (len(item_ids) * RATE_LIMIT_DELAY_SECONDS) / len(api_keys)
    log.info(f"Theoretical Minimum Processing Time (ideal conditions): {theoretical_min_time:.2f} seconds")
    log.info("--------------------------------------------\n")

if __name__ == "__main__":
    # Ensure Python 3.7+ for asyncio features used
    if sys.version_info < (3, 7):
        print("Python 3.7 or higher is required to run this script.")
        sys.exit(1)

    # Check for aiohttp
    try:
        import aiohttp
    except ImportError:
         print("\nError: 'aiohttp' package is not installed.")
         print("Please run 'pip install aiohttp' or 'pip3 install aiohttp' and try again.")
         sys.exit(1)

    asyncio.run(main()) 