/**
 * Herb Panel - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  initializeTooltips();
  handleResponsiveLayout();
  
  // Add event listeners for the sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // Add event listeners for the mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Load the saved theme
  loadSavedTheme();
  
  // Apply active class to the correct theme option in settings page
  const savedTheme = localStorage.getItem('selectedPalette') || 'blue-dark';
  const paletteOptions = document.querySelectorAll('.palette-option');
  paletteOptions.forEach(option => {
    option.classList.remove('active');
    if (option.getAttribute('data-palette') === savedTheme) {
      option.classList.add('active');
    }
  });
  
  // Update any UI elements that depend on the theme color
  updateThemeColoredElements();
});

// Theme palettes
const palettes = {
  'blue-dark': {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#334155'
  },
  'purple-dark': {
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#334155'
  },
  'green-dark': {
    primary: '#10b981',
    primaryDark: '#059669',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#334155'
  },
  'orange-dark': {
    primary: '#f97316',
    primaryDark: '#ea580c',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#334155'
  },
  'blue-light': {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#cbd5e1',
    hover: '#e2e8f0'
  },
  'purple-light': {
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#cbd5e1',
    hover: '#e2e8f0'
  }
};

// Apply theme function
function applyTheme(paletteName) {
  const palette = palettes[paletteName];
  if (!palette) return;
  
  // Apply the palette CSS variables
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--primary-dark', palette.primaryDark);
  document.documentElement.style.setProperty('--background', palette.background);
  document.documentElement.style.setProperty('--surface', palette.surface);
  document.documentElement.style.setProperty('--text', palette.text);
  document.documentElement.style.setProperty('--text-secondary', palette.textSecondary);
  document.documentElement.style.setProperty('--border', palette.border);
  document.documentElement.style.setProperty('--hover', palette.hover);
  
  // Save the selected palette to localStorage
  localStorage.setItem('selectedPalette', paletteName);
  
  // Update active theme in the theme selector
  updateActiveThemeInSelector(paletteName);
}

// Load saved theme
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('selectedPalette') || 'blue-dark';
  applyTheme(savedTheme);
}

// Update active theme in the theme selector
function updateActiveThemeInSelector(paletteName) {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.classList.remove('active');
    if (option.dataset.theme === paletteName) {
      option.classList.add('active');
    }
  });
}

// Toggle theme selector visibility
function toggleThemeSelector() {
  const selector = document.getElementById('themeSelector');
  selector.classList.toggle('active');
  
  // Close selector when clicking outside
  if (selector.classList.contains('active')) {
    document.addEventListener('click', closeThemeSelectorOnClickOutside);
  } else {
    document.removeEventListener('click', closeThemeSelectorOnClickOutside);
  }
}

// Close theme selector when clicking outside
function closeThemeSelectorOnClickOutside(event) {
  const selector = document.getElementById('themeSelector');
  const toggle = document.querySelector('.theme-toggle');
  
  if (!selector.contains(event.target) && !toggle.contains(event.target)) {
    selector.classList.remove('active');
    document.removeEventListener('click', closeThemeSelectorOnClickOutside);
  }
}

// Get animation duration from CSS variables
function getAnimationDuration() {
  const duration = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration') || '300ms';
  return parseInt(duration) || 300;
}

// Debounce function to prevent rapid firing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Toggle sidebar visibility with animation
const toggleSidebar = debounce(() => {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const animationDuration = getAnimationDuration();
  
  if (sidebar && mainContent) {
    // Add animation class if not already present
    sidebar.classList.add('sidebar-animating');
    
    // Toggle collapsed state
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    // Track sidebar state in localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    // Force repaint/reflow to ensure transitions run smoothly
    void mainContent.offsetWidth;
    
    // Remove animation class after transition completes
    setTimeout(() => {
      sidebar.classList.remove('sidebar-animating');
    }, animationDuration + 50);
  }
}, 50); // Smaller debounce to improve responsiveness

// Toggle mobile menu for responsive design
const toggleMobileMenu = debounce(() => {
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-overlay');
  const animationDuration = getAnimationDuration();
  
  if (mobileMenu && overlay) {
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent scrolling when menu is open
    document.body.classList.toggle('no-scroll', mobileMenu.classList.contains('active'));
  }
}, getAnimationDuration() + 50);

// Toggle dark mode functionality
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode');
  const isDarkMode = document.documentElement.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
}

// Initialize tooltips
function initializeTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', showTooltip);
    tooltip.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(e) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = e.target.getAttribute('data-tooltip');
  document.body.appendChild(tooltip);
  
  const rect = e.target.getBoundingClientRect();
  tooltip.style.top = `${rect.bottom + 10}px`;
  tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
  
  setTimeout(() => tooltip.classList.add('visible'), 10);
}

function hideTooltip() {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
    setTimeout(() => tooltip.remove(), 200);
  }
}

// Handle responsive layout changes
function handleResponsiveLayout() {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  adjustLayoutForScreenSize(mediaQuery);
  mediaQuery.addEventListener('change', adjustLayoutForScreenSize);
  
  // Load saved sidebar state
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !mediaQuery.matches) {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.classList.add('expanded');
    }
  }
  
  // Load saved dark mode preference
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.documentElement.classList.add('dark-mode');
  }
}

function adjustLayoutForScreenSize(mediaQuery) {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (sidebar && mainContent) {
    if (mediaQuery.matches) {
      // Mobile view
      sidebar.classList.add('collapsed');
      mainContent.classList.add('expanded');
    } else {
      // Desktop view - restore from localStorage if available
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === null) {
        // Default state if nothing saved
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
      }
    }
  }
}

// Update UI elements that need to match the theme color
function updateThemeColoredElements() {
  // Check if we're on a page with sort controls
  const sortControls = document.querySelector('.sort-controls');
  if (sortControls) {
    // Sort controls already use CSS variables, so they will update automatically
    // But we can add any additional styling adjustments here if needed
  }
}

/* ========================= */
/* Filter Modal Logic        */
/* ========================= */

function openFilterModal() {
    console.log('openFilterModal called'); // DEBUG
    const modal = document.getElementById('filterModal');
    if (modal) {
        console.log('Modal element found:', modal); // DEBUG
        // Don't change display - use visibility and opacity as defined in CSS
        modal.classList.add('active');
        console.log('Active class added to modal'); // DEBUG
        
        // Focus first input element inside the modal
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, button:not(.close-btn)');
            if (firstInput) {
                console.log('Focusing element:', firstInput); // DEBUG
                firstInput.focus();
            } else {
                console.log('No focusable element found in modal'); // DEBUG
            }
        }, 300); // Wait for transition to complete
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Filter modal element not found!'); // DEBUG
    }
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Restore body scrolling
        document.body.style.overflow = '';
    }
}

function applyFilters(event) {
    event.preventDefault(); // Prevent default form submission
    const form = document.getElementById('filterForm');
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    // Process checkboxes (selected_items can have multiple values)
    const selectedItems = formData.getAll('selected_items');
    selectedItems.forEach(item => params.append('selected_items', item));

    // Process other form fields
    formData.forEach((value, key) => {
        if (key !== 'selected_items' && value) {
            params.set(key, value);
        }
    });

    // Always reset page to 1 when applying filters
    params.set('page', '1');

    // Redirect to the current page with the new query parameters
    window.location.search = params.toString();
    
    // Close the modal after applying
    closeFilterModal();
}

function clearFilters() {
    const form = document.getElementById('filterForm');
    if (form) {
        form.reset(); // Reset all form fields
        // Manually uncheck checkboxes if reset doesn't handle them properly
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }
    // Apply empty filters to reset the view (redirects to base page)
    window.location.search = '';
    
    // Close the modal
    closeFilterModal();
}

// Add event listener to open the modal when the filter button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const filterButton = document.getElementById('openFilterButton'); // Assuming the button has this ID
    if (filterButton) {
        filterButton.addEventListener('click', openFilterModal);
    }

    // Add listener to close modal if clicking outside the content area
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            // Check if the click is on the modal backdrop itself
            if (event.target === modal) {
                closeFilterModal();
            }
        });
    }
});

/* ========================= */
/* Sort Controls Logic       */
/* ========================= */

function applySort() {
    // Get current URL and its search params
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Get values from the sort controls
    const sortBy = document.getElementById('sort_by').value;
    const sortOrder = document.getElementById('sort_order').value;
    
    // Clear the existing sort parameters
    params.delete('sort_by');
    params.delete('sort_order');
    
    // Only add parameters if they have values (non-empty)
    if (sortBy) {
        params.set('sort_by', sortBy);
    }
    if (sortOrder) {
        params.set('sort_order', sortOrder);
    }
    
    // Keep page number if it exists
    if (!params.has('page')) {
        params.set('page', '1'); // Reset to page 1 when sorting
    }
    
    // Update the URL and reload the page
    window.location.search = params.toString();
}

function clearSort() {
    // Get current URL and its search params
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Remove sort parameters
    params.delete('sort_by');
    params.delete('sort_order');
    
    // Keep other filters (if any)
    window.location.search = params.toString();
} 