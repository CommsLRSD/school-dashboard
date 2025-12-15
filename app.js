document.addEventListener('DOMContentLoaded', function() {
    
    // --- Constants ---
    const MOBILE_BREAKPOINT = 992;
    const YEAR_DETECTION_MIN = 1800;
    const YEAR_DETECTION_MAX = 2100;
    const NUMBER_FORMAT_THRESHOLD = 1000;
    const CHART_Y_AXIS_ROUNDING = 50;
    const BANNER_AUTO_HIDE_DELAY = 3000; // Auto-hide banner after 3 seconds
    const BANNER_SCROLL_THRESHOLD = 100; // Show banner when scrolling more than 100px
    const BANNER_TOP_THRESHOLD = 200; // Keep banner visible when within 200px from top
    const SCHOOL_BUILDING_SPACE_STANDARDS_URL = 'https://media.lrsd.net/media/Default/medialib/school-building-space-standards_edited-may-2022.0ba97b51071.pdf';
    const DIALOG_FOCUS_DELAY = 100; // Delay before focusing dialog close button (ms)
    
    // Info dialog content constants
    const CAPACITY_INFO_TEXT = 'School\'s student capacity at 20 students per K-3 classroom & 25 per 4-12 classroom.';
    const ENROLMENT_INFO_TEXT = 'Data as of Sept. 30, 2025';
    
    // Schools requiring photo credit on header image
    const SCHOOLS_WITH_PHOTO_CREDIT = [
        'Archwood School',
        'Collège Béliveau',
        'Collège Jeanne-Sauvé',
        'Dakota Collegiate',
        'Darwin School',
        'École Guyot',
        'École Henri-Bergeron',
        'École Howden',
        'École Julie-Riel',
        'École St. Germain',
        'École Van Belleghem',
        'École Varennes',
        'General Vanier School',
        'Shamrock School',
        'St. George School',
        'Victor H.L. Wyatt School',
        'Victor Mager School',
        'Windsor Park Collegiate',
        'Windsor School'
    ];
    
    // --- Global Variables ---
    // Cache DOM elements for performance
    const cardGrid = document.getElementById('card-grid');
    const contentSubtitle = document.getElementById('content-subtitle');
    const footerTimestamp = document.getElementById('footer-timestamp');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const navViewSelector = document.querySelector('.nav-view-selector');
    const schoolListContainer = document.getElementById('school-list-container');
    const categoryListContainer = document.getElementById('category-list-container');
    const stickyBanner = document.getElementById('sticky-category-banner');
    const stickyBannerText = stickyBanner?.querySelector('.sticky-category-text');

    let schoolData = {};
    let lastUpdated = ''; // Global timestamp for data updates
    let chartInstances = {};
    let currentViewMode = 'school';
    let selectedSchoolId = '';
    let selectedCategoryId = '';
    let filterValue = 'all'; // Combined filter value
    
    // Sticky banner state management
    let bannerAutoHideTimer = null;
    let lastScrollPosition = 0;
    let bannerVisible = false;
    
    // Memoization cache for string normalization
    const normalizationCache = new Map();

    /**
     * Helper function to format numbers with commas
     * Optimized with early returns and clearer logic
     * @param {number|string} num - The number to format
     * @returns {string|number} Formatted number
     */
    const formatNumber = (num) => {
        // Handle null/undefined
        if (num == null) return num;
        
        // Handle number type first
        if (typeof num === 'number') {
            const numStr = num.toString();
            // Don't format years (4-digit numbers between configured range)
            if (num >= YEAR_DETECTION_MIN && num <= YEAR_DETECTION_MAX && numStr.length === 4) {
                return numStr;
            }
            // Format numbers >= threshold with commas
            if (num >= NUMBER_FORMAT_THRESHOLD) {
                return num.toLocaleString('en-US');
            }
            return num;
        }
        
        // Handle string type
        if (typeof num === 'string') {
            // Extract just the number part if it contains units like "ft²"
            const match = num.match(/^(\d+)\s*(.*)$/);
            if (match) {
                const number = parseInt(match[1], 10);
                const unit = match[2];
                // Don't format years in the string
                if (number >= YEAR_DETECTION_MIN && number <= YEAR_DETECTION_MAX && match[1].length === 4 && !unit) {
                    return num;
                }
                // Format numbers with units
                if (number >= NUMBER_FORMAT_THRESHOLD) {
                    return number.toLocaleString('en-US') + (unit ? ' ' + unit : '');
                }
                return num; // Return as-is if less than threshold
            }
            // Check if it's just a number string
            const parsedNum = Number(num);
            if (!isNaN(parsedNum)) {
                // Don't format years (4-digit numbers between configured range)
                if (parsedNum >= YEAR_DETECTION_MIN && parsedNum <= YEAR_DETECTION_MAX && num.length === 4) {
                    return num;
                }
                if (parsedNum >= NUMBER_FORMAT_THRESHOLD) {
                    return parsedNum.toLocaleString('en-US');
                }
            }
        }
        return num;
    };

    // Helper function to fix label text (e.g., add line breaks)
    const formatLabel = (label) => {
        // Replace "Automatic entrance door operators" with proper label
        if (label === 'Automatic entrance door operators') {
            return 'Accessible entrance door operators';
        }
        return label;
    };



    const categories = {
        "details": "Contact & Building Info",
        "enrolment_capacity": "Enrolment & Classroom Capacity",
        "history": "Historic Enrolment",
        "projection": "Projected Enrolment",
        "additions": "Building Additions",
        "building_systems": "Building Systems",
        "accessibility": "Accessibility",
        "playground": "Playground Features",
        "transportation": "Transportation",
        "childcare": "Childcare",
        "catchment_map": "Catchment Map",
        "projects_provincial": "Provincially Funded Capital Projects",
        "projects_local": "Locally Funded Capital Projects"
    };

    /**
     * Main Initialization Function
     * Loads data, sets up event listeners, and initializes the view
     */
    async function initializeApp() {
        try {
            // Check if Chart.js is available and register plugin
            if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }
            
            // Fetch school data with proper error handling
            const response = await fetch('data/schools.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse JSON data and extract global timestamp
            const data = await response.json();
            const { lastUpdated: timestamp, ...schools } = data;
            
            // Validate timestamp format (MM/DD/YYYY or M/D/YYYY)
            const timestampRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
            if (timestamp && !timestampRegex.test(timestamp)) {
                console.warn('Invalid timestamp format:', timestamp);
            }
            lastUpdated = timestamp || '';
            schoolData = schools;
            
            // Validate that we have data
            const schoolIds = Object.keys(schoolData);
            if (schoolIds.length === 0) {
                throw new Error('No school data available');
            }
            
            // Initialize selected IDs with first available values
            selectedSchoolId = schoolIds[0];
            selectedCategoryId = Object.keys(categories)[0];
            
            // Set footer timestamp
            if (lastUpdated) {
                footerTimestamp.textContent = `Data updated ${lastUpdated}`;
            }

            // Initialize UI components
            populateSidebarControls();
            setupEventListeners();
            updateView();
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            // Display user-friendly error message with proper escaping
            const errorMessage = error.message || 'Unknown error occurred';
            cardGrid.textContent = ''; // Clear existing content
            const errorElement = document.createElement('p');
            errorElement.style.color = 'red';
            errorElement.style.textAlign = 'center';
            errorElement.textContent = `Error: Could not load school data. ${errorMessage}`;
            cardGrid.appendChild(errorElement);
        }
    }

    // --- UI Population ---
    /**
     * Populates the school list in the sidebar with optional filtering
     * @param {string} searchTerm - Optional search term to filter schools
     */
    function populateSchoolList(searchTerm = '') {
        // Validate and sanitize search term
        const safeSearchTerm = typeof searchTerm === 'string' ? searchTerm.trim() : '';
        
        // Normalize search term for accent-insensitive and case-insensitive search
        const normalizedSearch = normalizeString(safeSearchTerm);
        
        // Filter and map school data to HTML with proper sanitization
        const schoolLinksHTML = Object.keys(schoolData)
            .filter(schoolId => {
                if (!safeSearchTerm) return true;
                const schoolName = schoolData[schoolId]?.schoolName || '';
                return normalizeString(schoolName).includes(normalizedSearch);
            })
            .map(schoolId => {
                const schoolName = sanitizeHTML(schoolData[schoolId]?.schoolName || '');
                const schoolIdSafe = sanitizeHTML(schoolId);
                return `<a href="#" class="nav-list-item" data-type="school" data-id="${schoolIdSafe}">${schoolName}</a>`;
            })
            .join('');
        
        // Find existing search controls or create placeholder
        const searchControls = schoolListContainer.querySelector('.search-controls');
        const searchSeparator = schoolListContainer.querySelector('.search-separator');
        
        if (searchControls && searchSeparator) {
            // Keep search controls, replace only school links
            const linksContainer = document.createElement('div');
            linksContainer.innerHTML = schoolLinksHTML;
            
            // Remove old school links
            const oldLinks = schoolListContainer.querySelectorAll('.nav-list-item');
            oldLinks.forEach(link => link.remove());
            
            // Append new links after separator
            schoolListContainer.appendChild(linksContainer);
            Array.from(linksContainer.children).forEach(child => {
                schoolListContainer.appendChild(child);
            });
            linksContainer.remove();
        } else {
            // Initial population - keep existing HTML structure from index.html
            schoolListContainer.innerHTML += schoolLinksHTML;
        }
    }
    
    function populateSidebarControls() {
        populateSchoolList();

        // Populate Family of Schools dropdown
        const fosSet = new Set();
        Object.values(schoolData).forEach(school => {
            if (school.familyOfSchools) {
                fosSet.add(school.familyOfSchools);
            }
        });
        
        // Convert to array, sort, and move "Other" to the end
        let fosArray = Array.from(fosSet).sort();
        const otherIndex = fosArray.indexOf('Other');
        if (otherIndex > -1) {
            fosArray.splice(otherIndex, 1);
            fosArray.push('Other');
        }
        
        // Convert from uppercase to proper case (e.g., "BÉLIVEAU FOS" -> "Béliveau FOS")
        const fosOptions = fosArray.map(fos => {
            // Convert to proper case while preserving "FOS" 
            const displayName = fos.split(' ').map((word, index, arr) => {
                if (word === 'FOS') return 'FOS';
                // Special handling for abbreviations like "J.H." and hyphenated names
                if (word.includes('.')) {
                    // Keep uppercase for abbreviations (e.g., "J.H.")
                    return word.toUpperCase();
                }
                if (word.includes('-')) {
                    // Handle hyphenated names (e.g., "JEANNE-SAUVÉ" -> "Jeanne-Sauvé")
                    return word.split('-').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                    ).join('-');
                }
                // Title case for other words
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
            return `<option value="fos:${fos}">${displayName}</option>`;
        }).join('');
        
        const combinedFilter = document.getElementById('combined-filter');
        if (combinedFilter) {
            // Find the last option (which should be the "— Family of Schools —" separator)
            const currentOptions = combinedFilter.innerHTML;
            // Insert FOS options after the separator
            combinedFilter.innerHTML = currentOptions + fosOptions;
        }

        // Add category links after the existing filter buttons
        const categoryLinks = Object.entries(categories).map(([key, name]) => 
            `<a href="#" class="nav-list-item" data-type="category" data-id="${key}">${name}</a>`
        ).join('');
        categoryListContainer.innerHTML += categoryLinks;
    }
    
    /**
     * Helper function to normalize strings (case-insensitive, accent-insensitive)
     * Uses memoization for performance improvement
     * @param {string} str - String to normalize
     * @returns {string} Normalized string
     */
    function normalizeString(str) {
        if (!str) return '';
        
        // Check cache first for performance
        if (normalizationCache.has(str)) {
            return normalizationCache.get(str);
        }
        
        // Normalize and cache result
        const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        normalizationCache.set(str, normalized);
        
        // Limit cache size to prevent memory issues
        if (normalizationCache.size > 100) {
            const firstKey = normalizationCache.keys().next().value;
            normalizationCache.delete(firstKey);
        }
        
        return normalized;
    }

    // --- Card Creation Functions ---
    const getTileSizeClass = (cardType) => {
        // Cards that should be double-width
        if (['school_header', 'history', 'projection'].includes(cardType)) {
            return 'tile-double-width';
        }
        // Cards that should be double-height for more content
        if (['details', 'accessibility', 'projects_provincial', 'projects_local'].includes(cardType)) {
            return 'tile-double-height';
        }
        // Default: standard square tile
        return '';
    };

    /**
     * Sanitizes HTML to prevent XSS attacks
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    const sanitizeHTML = (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    /**
     * Creates a flippable card with front and back faces
     * @param {string} cardClasses - CSS classes for the card
     * @param {string} frontContent - HTML content for the front face
     * @param {string} backTitle - Title for the back face
     * @param {string} backIcon - Icon path for the back face
     * @param {string|Array} backContent - Content for the back face (string or array of paragraphs)
     * @param {string} infoType - Type of info (for data attribute)
     * @returns {string} HTML string for the flippable card
     */
    const createFlippableCard = (cardClasses, frontContent, backTitle, backIcon, backContent, infoType) => {
        const backContentHTML = Array.isArray(backContent) 
            ? backContent.map(p => `<p>${p}</p>`).join('') 
            : `<p>${backContent}</p>`;
        
        return `<div class="data-card ${cardClasses}" data-flippable="true" data-info-type="${infoType}">
            <div class="card-flip-container">
                <div class="card-face card-face-front">
                    ${frontContent}
                </div>
                <div class="card-face card-face-back">
                    <div class="card-back-header">
                        <div class="card-back-title-wrapper">
                            <img src="${backIcon}" alt="" class="card-back-icon">
                            <h3 class="card-back-title">${backTitle}</h3>
                        </div>
                        <button class="card-back-close" aria-label="Close information">
                            <img src="public/icon/lightbox-close.svg" alt="" class="card-back-close-icon">
                        </button>
                    </div>
                    <div class="card-back-content">
                        ${backContentHTML}
                    </div>
                </div>
            </div>
        </div>`;
    };

    /**
     * Creates a data card element based on school data and card type
     * @param {Object} school - School data object
     * @param {string} cardType - Type of card to create
     * @returns {string} HTML string for the card
     */
    const createCard = (school, cardType) => {
        // Validate input
        if (!school || !cardType) {
            console.warn('createCard: Invalid parameters', { school, cardType });
            return '';
        }
        
        // Calculate utilization safely with null checks
        const current = school.enrolment?.current || 0;
        const capacity = school.enrolment?.capacity || 1; // Avoid division by zero
        const utilization = current / capacity;
        const utilizationPercent = (utilization * 100).toFixed(1);
        const isOverCapacity = utilization >= 1;
        const isYellowZone = utilization >= 0.95 && utilization < 1;
        const capacityClass = isOverCapacity ? 'over-capacity' : (isYellowZone ? 'yellow-zone' : '');
        const sizeClass = getTileSizeClass(cardType);

        switch(cardType) {
            case 'school_header': 
                // Sanitize data to prevent XSS
                const headerImage = sanitizeHTML(school.headerImage || '');
                const schoolName = sanitizeHTML(school.schoolName || '');
                // Photo credit is a static string (not user input), so sanitization is not required
                const photoCredit = SCHOOLS_WITH_PHOTO_CREDIT.includes(schoolName) 
                    ? '<div class="photo-credit">Photo: Winnipeg Architecture Foundation Collection</div>' 
                    : '';
                return `<div class="data-card school-header-card ${sizeClass}"><div class="card-body"><img src="${headerImage}" alt="${schoolName}">${photoCredit}<h2 class="school-name-title">${schoolName}</h2></div></div>`;
            
            case 'details': {
                // Calculate age dynamically from Built year
                const currentYear = new Date().getFullYear();
                const builtYear = school.details.Built;
                const calculatedAge = builtYear ? `${currentYear - builtYear} years` : school.details.Age;
                
                // Use separate grades and program fields from school data
                const grades = school.grades || '';
                const program = school.program || '';
                
                // Create details object with calculated age, renamed Modular field, and separated Grades/Program
                const detailsData = {
                    "Address": school.address,
                    "Phone": school.phone,
                    "Grades": grades,
                    "Program": program,
                    "Built": school.details.Built,
                    "Age": calculatedAge,
                    "Size": school.details.Size,
                    "Modular Classrooms": school.details.Modular
                };
                
                return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><img src="public/icon/details.svg" alt="" class="card-header-icon"><h2 class="card-title">Details</h2></div><div class="card-body"><ul class="detail-list">${Object.entries(detailsData).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${formatNumber(val)}</span></li>`).join('')}</ul></div></div>`;
            }
            
            case 'additions': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><img src="public/icon/additions.svg" alt="" class="card-header-icon"><h2 class="card-title">Additions</h2></div><div class="card-body"><ul class="detail-list">${school.additions.map(a => `<li class="detail-item"><span class="detail-label">${a.year}</span><span class="detail-value">${a.size}</span></li>`).join('') || '<li class="detail-item">No additions on record.</li>'}</ul></div></div>`;

            case 'capacity': {
                const frontContent = `<div class="card-header"><img src="public/icon/capacity.svg" alt="" class="card-header-icon"><h2 class="card-title">Capacity</h2></div><div class="card-body"><div class="stat-value">${formatNumber(school.enrolment.capacity)}</div><div class="stat-label">Classroom Capacity</div><button class="info-icon-btn" data-info-type="capacity" aria-label="Show capacity information"><img src="public/icon/info.svg" alt=""></button></div>`;
                return createFlippableCard(
                    `stat-card ${sizeClass}`,
                    frontContent,
                    'Capacity Information',
                    'public/icon/capacity.svg',
                    CAPACITY_INFO_TEXT,
                    'capacity'
                );
            }
            
            case 'enrolment': {
                // Enrolment card does not flip - shows info text as a footnote
                return `<div class="data-card stat-card ${sizeClass}">
                    <div class="card-header"><img src="public/icon/enrolment.svg" alt="" class="card-header-icon"><h2 class="card-title">Enrolment</h2></div>
                    <div class="card-body">
                        <div class="stat-value">${formatNumber(school.enrolment.current)}</div>
                        <div class="stat-label">Current Enrolment</div>
                        <div class="enrolment-footnote">${ENROLMENT_INFO_TEXT}</div>
                    </div>
                </div>`;
            }
            
            case 'utilization': {
                let warningIcon = '';
                if (isOverCapacity) {
                    warningIcon = '<img src="public/icon/red-warning.svg" alt="" class="warning-icon warning-icon-red">';
                } else if (isYellowZone) {
                    warningIcon = '<img src="public/icon/yellow-warning.svg" alt="" class="warning-icon warning-icon-yellow">';
                }
                return `<div class="data-card utilization-card ${capacityClass} ${sizeClass}"><div class="card-header"><img src="public/icon/utilization.svg" alt="" class="card-header-icon"><h2 class="card-title">Utilization${warningIcon}</h2></div><div class="card-body"><div class="stat-value">${utilizationPercent}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></div></div>`;
            }

            case 'stats': return `<div class="data-card stats-combined-card ${sizeClass}"><div class="card-header"><img src="public/icon/enrolment.svg" alt="" class="card-header-icon"><h2 class="card-title">Statistics</h2></div><div class="card-body"><div class="stats-rows"><div class="stat-row"><div class="stat-row-label">Enrolment</div><div class="stat-row-value">${formatNumber(school.enrolment.current)}</div></div><div class="stat-row"><div class="stat-row-label">Capacity</div><div class="stat-row-value">${formatNumber(school.enrolment.capacity)}</div></div><div class="stat-row ${capacityClass}"><div class="stat-row-label">Utilization</div><div class="stat-row-value">${utilizationPercent}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></div></div></div></div>`;

            case 'enrolment_capacity': {
                const frontContent = `<div class="card-header"><img src="public/icon/capacity.svg" alt="" class="card-header-icon"><h2 class="card-title">Enrolment & Classroom Capacity</h2></div><div class="card-body"><ul class="detail-list"><li class="detail-item"><span class="detail-label">Enrolment</span><span class="detail-value enrolment-value">${formatNumber(school.enrolment.current)}</span></li><li class="detail-item"><span class="detail-label">Capacity</span><span class="detail-value capacity-value">${formatNumber(school.enrolment.capacity)}</span></li><li class="detail-item ${capacityClass}"><span class="detail-label">Utilization</span><span class="detail-value utilization-value">${utilizationPercent}%</span></li><li class="detail-item progress-item"><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></li></ul><button class="info-icon-btn" data-info-type="enrolment-capacity" aria-label="Show enrolment and capacity information"><img src="public/icon/info.svg" alt=""></button></div>`;
                return createFlippableCard(
                    `list-card ${sizeClass}`,
                    frontContent,
                    'Enrolment & Capacity Information',
                    'public/icon/capacity.svg',
                    [CAPACITY_INFO_TEXT, ENROLMENT_INFO_TEXT],
                    'enrolment-capacity'
                );
            }

            case 'history': return `<div class="data-card chart-card ${sizeClass}" data-chart="history" data-school-id="${school.id}"><div class="card-header"><img src="public/icon/enrolment-charts.svg" alt="" class="card-header-icon"><h2 class="card-title">Historic Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'projection': return `<div class="data-card chart-card ${sizeClass}" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><img src="public/icon/enrolment-charts.svg" alt="" class="card-header-icon"><h2 class="card-title">Projected Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'catchment_map': {
                // Generate map filename from school id using new naming convention
                // For J.H. Bruns Family of Schools, use standardized bruns-fos-map.svg
                const mapFilename = school.familyOfSchools === 'J.H. BRUNS FOS' 
                    ? 'public/maps/bruns-fos-map.svg' 
                    : `public/maps/${school.id}-map.jpg`;
                const schoolName = sanitizeHTML(school.schoolName || '');
                const migration = school.catchment?.migration || 'N/A';
                const description = school.catchment?.description || '';
                
                return `<div class="data-card catchment-map-card ${sizeClass}">
                    <div class="card-header"><img src="public/icon/catchment-map.svg" alt="" class="card-header-icon"><h2 class="card-title">Catchment Map</h2></div>
                    <div class="card-body">
                        <div class="catchment-map-container">
                            <img src="${mapFilename}" alt="Catchment map for ${schoolName}" class="catchment-map-image" data-map-src="${mapFilename}">
                            <div class="catchment-map-content">
                                <div class="catchment-map-info">
                                    <div class="catchment-info-item">
                                        <span class="catchment-label">Migration:</span>
                                        <span class="catchment-value">${migration}</span>
                                    </div>
                                    <div class="catchment-info-note">${description}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            default: { // For all other simple list cards
                const icons = { 
                    building_systems: 'public/icon/building-systems.svg', 
                    accessibility: 'public/icon/accessibility.svg', 
                    playground: 'public/icon/playground.svg', 
                    transportation: 'public/icon/transportation.svg', 
                    childcare: 'public/icon/childcare.svg', 
                    projects_provincial: 'public/icon/provincial-funded.svg', 
                    projects_local: 'public/icon/local-funded.svg' 
                };
                const titles = { building_systems: 'Building Systems', accessibility: 'Accessibility', playground: 'Playground', transportation: 'Transportation', childcare: 'Childcare', projects_provincial: 'Provincially Funded Capital Projects', projects_local: 'Locally Funded Capital Projects' };
                
                // Function to determine the appropriate icon for a playground item
                const getPlaygroundIcon = (item) => {
                    const itemLower = item.toLowerCase();
                    
                    // Play structure items (check before other keywords since "play structure" is specific)
                    if (itemLower.includes('play structure')) {
                        return 'public/icon/play-structure.svg';
                    }
                    // Basketball-related items
                    if (itemLower.includes('basketball')) {
                        return 'public/icon/basketball.svg';
                    }
                    // Baseball-related items
                    if (itemLower.includes('baseball')) {
                        return 'public/icon/baseball.svg';
                    }
                    // Soccer-related items
                    if (itemLower.includes('soccer')) {
                        return 'public/icon/soccer.svg';
                    }
                    // Football-related items (using soccer icon as football typically refers to soccer)
                    if (itemLower.includes('football')) {
                        return 'public/icon/soccer.svg';
                    }
                    // Volleyball-related items
                    if (itemLower.includes('volleyball')) {
                        return 'public/icon/volleyball.svg';
                    }
                    // Slide-related items
                    if (itemLower.includes('slide')) {
                        return 'public/icon/slide.svg';
                    }
                    // Climbing-related items
                    if (itemLower.includes('climbing') || itemLower.includes('climb')) {
                        return 'public/icon/climbing.svg';
                    }
                    // Nature-related items (gardens, outdoor classrooms, shade structures)
                    const natureKeywords = ['garden', 'outdoor classroom', 'nature', 'shade structure', 'outdoor learning', 'rain garden'];
                    if (natureKeywords.some(keyword => itemLower.includes(keyword))) {
                        return 'public/icon/nature.svg';
                    }
                    
                    // Default to playground icon for general items
                    return 'public/icon/playground.svg';
                };
                
                let data, listItems;
                if (cardType === 'projects_provincial' || cardType === 'projects_local') {
                    const projectType = cardType.split('_')[1];
                    data = school.projects[projectType];
                    listItems = ['requested', 'inProgress', 'completed'].flatMap(status => {
                        if (!data || !data[status] || data[status].length === 0) return [];
                        
                        // Use correct SVG for each status with appropriate color filters
                        let iconSvg, iconClass;
                        if (status === 'requested') {
                            iconSvg = 'public/requested.svg';
                            iconClass = 'status-icon-requested';
                        } else if (status === 'inProgress') {
                            iconSvg = 'public/inprogress.svg';
                            iconClass = 'status-icon-inprogress';
                        } else { // completed
                            iconSvg = 'public/completed.svg';
                            iconClass = 'status-icon-completed';
                        }
                        
                        const statusLabel = status === 'inProgress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
                        return [
                            `<li class="detail-item"><span class="detail-label"><img src="${iconSvg}" alt="${statusLabel}" class="status-icon ${iconClass}" />${statusLabel}</span></li>`,
                            ...data[status].map(item => `<li class="detail-item" style="padding-left: 1rem;">${item}</li>`)
                        ];
                    }).join('');
                } else if (cardType === 'playground') {
                    data = school[cardType];
                    listItems = Array.isArray(data) ? data.flatMap(item => {
                        // Check if this is a City Property item
                        if (item.startsWith('City Property:')) {
                            const cityPropertyItems = item.replace('City Property:', '').trim();
                            // Split by comma and create separate rows for each item
                            const items = cityPropertyItems.split(',').map(i => i.trim());
                            return [
                                `<li class="detail-item"><span class="detail-label">City Property</span></li>`,
                                ...items.map(cityItem => {
                                    const icon = getPlaygroundIcon(cityItem);
                                    return `<li class="detail-item"><img src="${icon}" alt="" class="playground-item-icon">${cityItem}</li>`;
                                })
                            ];
                        }
                        // Regular playground items with icons
                        const icon = getPlaygroundIcon(item);
                        return [`<li class="detail-item"><img src="${icon}" alt="" class="playground-item-icon">${item}</li>`];
                    }).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${formatLabel(key)}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : formatNumber(val)}</span></li>`).join('');
                } else {
                    data = school[cardType === 'building_systems' ? 'building' : cardType];
                    listItems = Array.isArray(data) ? data.map(item => `<li class="detail-item">${item}</li>`).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${formatLabel(key)}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : formatNumber(val)}</span></li>`).join('');
                }

                // Add footnotes for specific card types
                let footnote = '';
                if (cardType === 'projects_local') {
                    footnote = '<div class="tile-footnote-static">Does not include routine upkeep and maintenance.</div>';
                } else if (cardType === 'accessibility') {
                    footnote = `<div class="tile-footnote"><a href="${SCHOOL_BUILDING_SPACE_STANDARDS_URL}" target="_blank" rel="noopener noreferrer" class="footnote-link">See School Building Space Standards</a></div>`;
                }
                
                return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><img src="${icons[cardType]}" alt="" class="card-header-icon"><h2 class="card-title">${titles[cardType]}</h2></div><div class="card-body"><ul class="detail-list">${listItems || '<li class="detail-item">No data available.</li>'}</ul>${footnote}</div></div>`;
            }
        }
    }

    /**
     * Chart Rendering Function
     * Creates and manages Chart.js instances with proper cleanup
     * @param {Object} school - School data object
     * @param {string} type - Chart type ('history' or 'projection')
     */
    const renderChart = (school, type) => {
        // Validate input parameters
        if (!school || !type) {
            console.warn('renderChart: Invalid parameters', { school, type });
            return;
        }
        
        // Skip chart rendering if Chart.js is not available
        if (typeof Chart === 'undefined') {
            const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
            if (chartCard) {
                const chartContainer = chartCard.querySelector('.chart-container');
                if (chartContainer) {
                    // Use textContent for security instead of innerHTML
                    chartContainer.textContent = '';
                    const message = document.createElement('p');
                    message.style.textAlign = 'center';
                    message.style.color = 'var(--text-light)';
                    message.style.padding = '2rem';
                    message.textContent = 'Charts require Chart.js library';
                    chartContainer.appendChild(message);
                }
            }
            return;
        }
        
        // Find chart card element
        const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
        if (!chartCard) {
            console.warn(`renderChart: Chart card not found for ${type} - ${school.id}`);
            return;
        }
        
        const canvas = chartCard.querySelector('canvas');
        if (!canvas) {
            console.warn(`renderChart: Canvas not found in chart card for ${type} - ${school.id}`);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn(`renderChart: Could not get 2D context for ${type} - ${school.id}`);
            return;
        }
        
        const chartId = `${type}-${school.id}`;

        // Properly destroy existing chart instance to prevent memory leaks
        if (chartInstances[chartId]) {
            try {
                chartInstances[chartId].destroy();
                delete chartInstances[chartId];
            } catch (error) {
                console.error(`Error destroying chart ${chartId}:`, error);
            }
        }

        // Calculate unified y-axis max for both history and projection charts
        // Add null checks for data integrity
        const historyValues = school.enrolment?.history?.values || [];
        const historyMax = historyValues.length > 0 ? Math.max(...historyValues) : 0;
        
        const projectionValues = school.enrolment?.projection?.values || [];
        const projectionMax = projectionValues.length > 0 ? Math.max(...projectionValues) : 0;
        
        const combinedMax = Math.max(historyMax, projectionMax);
        // Previous behavior: add 50 to max value, then round up to nearest multiple of 50
        const yAxisMax = Math.ceil((combinedMax + 50) / CHART_Y_AXIS_ROUNDING) * CHART_Y_AXIS_ROUNDING;

        // Calculate threshold for label positioning (85% of max to prevent cut-off)
        const labelPositionThreshold = yAxisMax * 0.85;
        
        // Helper function for dynamic label positioning
        // Places labels below points when near the top to prevent cut-off
        const getLabelAlignment = (context) => {
            const value = context.dataset.data[context.dataIndex];
            return value >= labelPositionThreshold ? 'bottom' : 'top';
        };
        
        // Helper function for label offset
        // Adds extra margin below the point when label is positioned below
        const getLabelOffset = (context) => {
            const value = context.dataset.data[context.dataIndex];
            return value >= labelPositionThreshold ? 8 : 0; // 8px extra margin when below
        };

        if (type === 'history') {
            // Convert underscores to hyphens in labels (e.g., 2024_25 -> 2024-25)
            const formattedLabels = school.enrolment.history.labels.map(label => label.replace(/_/g, '-'));
            
            // Get capacity value for the horizontal reference line
            const capacity = school.enrolment?.capacity || 0;
            
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { 
                    labels: formattedLabels, 
                    datasets: [
                        // Capacity line dataset (rendered first, behind the data)
                        {
                            data: formattedLabels.map(() => capacity),
                            borderColor: 'rgba(190, 82, 71, 0.3)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            tension: 0,
                            order: 2
                        },
                        // Main data line
                        { 
                            data: school.enrolment.history.values, 
                            borderColor: '#BE5247', 
                            backgroundColor: 'rgba(190, 82, 71, 0.1)', 
                            fill: true, 
                            tension: 0.3,
                            order: 1
                        }
                    ] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false }, 
                        datalabels: typeof ChartDataLabels !== 'undefined' ? { 
                            anchor: 'end', 
                            align: getLabelAlignment,
                            offset: getLabelOffset,
                            font: { weight: 'bold' },
                            color: '#BE5247',
                            display: function(context) {
                                // Only show labels for the main data line (dataset index 1)
                                return context.datasetIndex === 1;
                            }
                        } : { display: false } 
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yAxisMax
                        }
                    }
                }
            });
        } else if (type === 'projection') {
            // Convert underscores to hyphens in labels (e.g., 2026_27 -> 2026-27)
            const formattedLabels = school.enrolment.projection.labels.map(label => label.replace(/_/g, '-'));
            
            // Get capacity value for the horizontal reference line
            const capacity = school.enrolment?.capacity || 0;
            
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { 
                    labels: formattedLabels, 
                    datasets: [
                        // Capacity line dataset (rendered first, behind the data)
                        {
                            data: formattedLabels.map(() => capacity),
                            borderColor: 'rgba(190, 82, 71, 0.5)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            tension: 0,
                            order: 2
                        },
                        // Main data line
                        { 
                            data: school.enrolment.projection.values, 
                            borderColor: '#2BA680', 
                            backgroundColor: 'rgba(43, 166, 128, 0.1)', 
                            fill: true, 
                            tension: 0.3,
                            order: 1
                        }
                    ] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false }, 
                        datalabels: typeof ChartDataLabels !== 'undefined' ? { 
                            anchor: 'end', 
                            align: getLabelAlignment,
                            offset: getLabelOffset,
                            font: { weight: 'bold' },
                            color: '#2BA680',
                            display: function(context) {
                                // Only show labels for the main data line (dataset index 1)
                                return context.datasetIndex === 1;
                            }
                        } : { display: false } 
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yAxisMax
                        }
                    }
                }
            });
        }
    }

    // --- Main View Logic ---
    function setupStickyBanner() {
        // Show the sticky banner immediately
        showBanner();
        
        // Update banner text based on current view
        if (currentViewMode === 'school') {
            const school = schoolData[selectedSchoolId];
            stickyBannerText.textContent = school.schoolName.toUpperCase();
        } else {
            stickyBannerText.textContent = categories[selectedCategoryId].toUpperCase();
        }
        
        // Check if we're near the top of the page
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // If we're at or near the top, keep banner visible (don't auto-hide)
        if (currentScroll <= BANNER_TOP_THRESHOLD) {
            // Clear any existing auto-hide timer
            if (bannerAutoHideTimer) {
                clearTimeout(bannerAutoHideTimer);
                bannerAutoHideTimer = null;
            }
        } else {
            // Auto-hide after a delay when further down the page
            if (bannerAutoHideTimer) {
                clearTimeout(bannerAutoHideTimer);
            }
            bannerAutoHideTimer = setTimeout(() => {
                hideBanner();
            }, BANNER_AUTO_HIDE_DELAY);
        }
    }
    
    /**
     * Show the sticky banner
     */
    function showBanner() {
        if (!bannerVisible) {
            stickyBanner.classList.add('visible');
            stickyBanner.classList.remove('hidden');
            bannerVisible = true;
        }
    }
    
    /**
     * Hide the sticky banner
     */
    function hideBanner() {
        if (bannerVisible) {
            stickyBanner.classList.remove('visible');
            stickyBanner.classList.add('hidden');
            bannerVisible = false;
        }
    }
    
    /**
     * Updates the view based on current mode (school or category)
     * Properly cleans up resources before re-rendering
     */
    function updateView() {
        // Clean up existing chart instances to prevent memory leaks
        Object.values(chartInstances).forEach(chart => {
            try {
                chart.destroy();
            } catch (error) {
                console.error('Error destroying chart:', error);
            }
        });
        chartInstances = {};
        
        // Clear grid content
        cardGrid.innerHTML = ''; 

        document.querySelectorAll('.nav-view-link').forEach(link => link.classList.toggle('active', link.dataset.view === currentViewMode));
        document.querySelectorAll('.nav-list-container').forEach(c => c.classList.toggle('active', c.id.startsWith(currentViewMode)));
        
        // Update category items active state
        document.querySelectorAll('.nav-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === (item.dataset.type === 'school' ? selectedSchoolId : selectedCategoryId));
        });

        if (currentViewMode === 'school') {
            const school = schoolData[selectedSchoolId];
            const cardTypes = ['school_header', 'details', 'additions', 'enrolment', 'capacity', 'utilization', 'projection', 'history', 'building_systems', 'accessibility', 'playground', 'transportation', 'childcare', 'catchment_map', 'projects_provincial', 'projects_local'];
            cardGrid.innerHTML = cardTypes.map(type => createCard(school, type)).join('');
            
            // Add staggered animation delays and navigation icons
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                
                // Add navigation icon to cards in school view (except school_header)
                const cardType = cardTypes[index];
                if (cardType !== 'school_header') {
                    // All cards with headers get navigation icon in header
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('img');
                        navIcon.src = 'public/icon/navigation.svg';
                        navIcon.alt = '';
                        navIcon.className = 'card-nav-icon';
                        navIcon.title = 'View all schools for this category';
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            currentViewMode = 'category';
                            // Map enrolment, capacity, and utilization to enrolment_capacity category
                            if (cardType === 'enrolment' || cardType === 'capacity' || cardType === 'utilization') {
                                selectedCategoryId = 'enrolment_capacity';
                            } else {
                                selectedCategoryId = cardType;
                            }
                            updateView();
                        });
                        header.appendChild(navIcon);
                    }
                }
            });
            
            renderChart(school, 'history');
            renderChart(school, 'projection');
        } else {
            // Category view
            
            // Filter schools based on current filter
            let filteredSchools = Object.values(schoolData);
            if (filterValue === 'elementary') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'Elementary School');
            } else if (filterValue === 'highschool') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'High School');
            } else if (filterValue.startsWith('fos:')) {
                const fosValue = filterValue.substring(4); // Remove 'fos:' prefix
                filteredSchools = filteredSchools.filter(s => s.familyOfSchools === fosValue);
            }
            // If filterValue is 'all', show all schools (no filtering)
            
            // Single category view
            const cardType = selectedCategoryId;
            
            // Show warning icons for enrolment_capacity cards
            const showWarningIcons = cardType === 'enrolment_capacity';
            
            const cardHTML = filteredSchools.map(school => {
                const utilization = school.enrolment.current / school.enrolment.capacity;
                const utilizationPercent = (utilization * 100).toFixed(1);
                let warningIcon = '';
                
                // Show warning icons for enrolment_capacity cards
                if (showWarningIcons) {
                    if (utilization >= 1) {
                        warningIcon = '<img src="public/icon/red-warning.svg" alt="" class="warning-icon warning-icon-red">';
                    } else if (utilization >= 0.95 && utilization < 1) {
                        warningIcon = '<img src="public/icon/yellow-warning.svg" alt="" class="warning-icon warning-icon-yellow">';
                    }
                }
                
                // Create a simple header with school name and icon based on school level
                const schoolIcon = school.schoolLevel === 'Elementary School' ? 'elementary.svg' : 'highschool.svg';
                const header = `<div class="card-header"><img src="public/icon/${schoolIcon}" alt="" class="card-header-icon school-level-icon ${school.schoolLevel === 'Elementary School' ? 'elementary-icon' : 'highschool-icon'}"><h2 class="card-title">${school.schoolName}${warningIcon}</h2></div>`;
                
                // Create card with the selected category type
                const fullCard = createCard(school, cardType);
                return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
            }).join('');
            cardGrid.innerHTML = cardHTML;
            
            // Add staggered animation delays and navigation icons
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                
                // Add navigation icon to cards in category view
                const schoolId = filteredSchools[index]?.id;
                if (schoolId) {
                    // All cards with headers get navigation icon in header
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('img');
                        navIcon.src = 'public/icon/navigation.svg';
                        navIcon.alt = '';
                        navIcon.className = 'card-nav-icon';
                        navIcon.title = 'View all categories for this school';
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            currentViewMode = 'school';
                            selectedSchoolId = schoolId;
                            updateView();
                        });
                        header.appendChild(navIcon);
                    }
                }
            });
            
            // Render charts for history and projection categories
            if (cardType === 'history' || cardType === 'projection') {
                filteredSchools.forEach(school => renderChart(school, cardType));
            }
        }
        
        // Setup sticky banner after view is updated
        setupStickyBanner();
    }

    /**
     * Shows a custom confirmation popup dialog
     * @param {string} message - Message to display
     * @param {number} x - X coordinate for popup position
     * @param {number} y - Y coordinate for popup position
     * @param {Function} onConfirm - Callback function on confirmation
     */
    function showCustomPopup(message, x, y, onConfirm) {
        const popup = document.querySelector('.custom-popup');
        const overlay = document.querySelector('.popup-overlay');
        const popupMessage = document.querySelector('.popup-message');
        const confirmBtn = document.querySelector('.popup-button-confirm');
        const cancelBtn = document.querySelector('.popup-button-cancel');
        
        // Validate required elements
        if (!popup || !overlay || !popupMessage || !confirmBtn || !cancelBtn) {
            console.error('showCustomPopup: Required popup elements not found');
            return;
        }
        
        // Use textContent for security instead of innerHTML
        popupMessage.textContent = message;
        
        // Position popup near click location
        const popupWidth = 250;
        const popupHeight = 120;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = x - (popupWidth / 2);
        let top = y - popupHeight - 10; // Position above click by default
        
        // Adjust if popup would go off screen
        if (left < 10) left = 10;
        if (left + popupWidth > viewportWidth - 10) left = viewportWidth - popupWidth - 10;
        if (top < 10) top = y + 10; // Position below if not enough space above
        if (top + popupHeight > viewportHeight - 10) top = viewportHeight - popupHeight - 10;
        
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        
        popup.classList.add('show');
        overlay.classList.add('show');
        
        const cleanup = () => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        const handleConfirm = () => {
            cleanup();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        };
        
        const handleCancel = () => {
            cleanup();
        };
        
        // Add keyboard support (Enter to confirm, Escape to cancel)
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeyDown);
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        navViewSelector.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-view-link'); 
            if (target && target.dataset.view !== currentViewMode) { 
                currentViewMode = target.dataset.view;
                // Reset filter when switching views
                filterValue = 'all';
                
                // Reset dropdown
                const combinedFilter = document.getElementById('combined-filter');
                if (combinedFilter) combinedFilter.value = 'all';
                
                updateView(); 
            } 
        });
        schoolListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) { 
                selectedSchoolId = target.dataset.id; 
                updateView(); 
                // Close sidebar on mobile after selection
                closeSidebarOnMobile();
            } 
        });
        categoryListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) {
                const categoryId = target.dataset.id;
                selectedCategoryId = categoryId;
                // Don't reset filter when clicking a category link - preserve the current filter
                updateView();
                // Close sidebar on mobile after selection
                closeSidebarOnMobile();
            } 
        });
        
        // Combined filter dropdown
        const combinedFilter = document.getElementById('combined-filter');
        if (combinedFilter) {
            combinedFilter.addEventListener('change', (e) => {
                filterValue = e.target.value;
                updateView();
            });
        }
        
        // School search input
        const schoolSearch = document.getElementById('school-search');
        if (schoolSearch) {
            schoolSearch.addEventListener('input', (e) => {
                populateSchoolList(e.target.value);
                // Re-highlight the active school if it's still visible
                const activeSchoolLink = schoolListContainer.querySelector('.nav-list-item.active');
                if (activeSchoolLink) {
                    activeSchoolLink.classList.add('active');
                }
                // Update active state for the currently selected school
                document.querySelectorAll('#school-list-container .nav-list-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.id === selectedSchoolId);
                });
            });
        }
        
        // Info icon button and card flip event delegation
        cardGrid.addEventListener('click', (e) => {
            const infoBtn = e.target.closest('.info-icon-btn');
            const closeBtn = e.target.closest('.card-back-close');
            
            if (infoBtn) {
                e.preventDefault();
                e.stopPropagation();
                // Find the parent flippable card
                const card = infoBtn.closest('[data-flippable="true"]');
                if (card) {
                    card.classList.add('flipped');
                    // Focus on the close button for accessibility
                    setTimeout(() => {
                        const closeButton = card.querySelector('.card-back-close');
                        if (closeButton) closeButton.focus();
                    }, DIALOG_FOCUS_DELAY);
                }
            } else if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                // Find the parent flippable card and unflip it
                const card = closeBtn.closest('[data-flippable="true"]');
                if (card) {
                    card.classList.remove('flipped');
                    // Focus back on the info button
                    setTimeout(() => {
                        const infoButton = card.querySelector('.info-icon-btn');
                        if (infoButton) infoButton.focus();
                    }, DIALOG_FOCUS_DELAY);
                }
            }
        });
        
        // Handle keyboard events for card flipping
        cardGrid.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const flippedCard = cardGrid.querySelector('[data-flippable="true"].flipped');
                if (flippedCard) {
                    e.preventDefault();
                    flippedCard.classList.remove('flipped');
                    // Focus back on the info button
                    setTimeout(() => {
                        const infoButton = flippedCard.querySelector('.info-icon-btn');
                        if (infoButton) infoButton.focus();
                    }, DIALOG_FOCUS_DELAY);
                }
            }
        });
        
        /**
         * Toggles sidebar visibility for mobile view
         * Updates ARIA attributes for accessibility
         */
        function toggleSidebar() { 
            const isOpen = sidebar.classList.toggle('open'); 
            sidebarOverlay.classList.toggle('visible', isOpen);
            // Update ARIA attribute for accessibility
            if (sidebarToggleBtn) {
                sidebarToggleBtn.setAttribute('aria-expanded', isOpen.toString());
            }
        }
        
        // Sidebar toggle event listeners
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                toggleSidebar(); 
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', toggleSidebar);
        }
        
        // Close sidebar when clicking on a nav item on mobile
        const closeSidebarOnMobile = () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('visible');
                if (sidebarToggleBtn) {
                    sidebarToggleBtn.setAttribute('aria-expanded', 'false');
                }
            }
        };
        
        // Scroll event listener for sticky banner behavior
        let scrollTimer = null;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = Math.abs(currentScroll - lastScrollPosition);
            
            // Always show banner when at or near the top of the page
            if (currentScroll <= BANNER_TOP_THRESHOLD) {
                showBanner();
                
                // Clear any auto-hide timers when at the top
                if (bannerAutoHideTimer) {
                    clearTimeout(bannerAutoHideTimer);
                    bannerAutoHideTimer = null;
                }
                if (scrollTimer) {
                    clearTimeout(scrollTimer);
                    scrollTimer = null;
                }
            } else {
                // Show banner when scrolling more than threshold (further down the page)
                if (scrollDelta > BANNER_SCROLL_THRESHOLD) {
                    showBanner();
                    
                    // Reset auto-hide timer on scroll
                    if (bannerAutoHideTimer) {
                        clearTimeout(bannerAutoHideTimer);
                    }
                    
                    // Clear existing scroll timer
                    if (scrollTimer) {
                        clearTimeout(scrollTimer);
                    }
                    
                    // Hide banner after user stops scrolling for a bit
                    scrollTimer = setTimeout(() => {
                        bannerAutoHideTimer = setTimeout(() => {
                            hideBanner();
                        }, BANNER_AUTO_HIDE_DELAY);
                    }, 500); // Wait 500ms after scroll stops
                }
            }
            
            lastScrollPosition = currentScroll;
        });
    }

    /**
     * Catchment Map Lightbox Functionality
     * Handles opening, closing, zooming, and panning of map images
     */
    function setupMapLightbox() {
        const lightbox = document.getElementById('map-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const closeBtn = lightbox.querySelector('.map-lightbox-close');
        const overlay = lightbox.querySelector('.map-lightbox-overlay');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const resetZoomBtn = document.getElementById('reset-zoom-btn');
        
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        
        // Open lightbox when clicking on map container
        document.addEventListener('click', (e) => {
            const container = e.target.closest('.catchment-map-container');
            if (container) {
                const mapImage = container.querySelector('.catchment-map-image');
                if (mapImage) {
                    const mapSrc = mapImage.dataset.mapSrc;
                    openLightbox(mapSrc);
                }
            }
        });
        
        function openLightbox(imageSrc) {
            lightboxImage.src = imageSrc;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            resetTransform();
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            resetTransform();
        }
        
        function resetTransform() {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
            lightboxImage.classList.remove('zoomed');
        }
        
        function updateTransform() {
            lightboxImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
        
        function zoomIn() {
            scale = Math.min(scale + 0.5, 5);
            updateTransform();
            if (scale > 1) {
                lightboxImage.classList.add('zoomed');
            }
        }
        
        function zoomOut() {
            scale = Math.max(scale - 0.5, 0.5);
            updateTransform();
            if (scale <= 1) {
                lightboxImage.classList.remove('zoomed');
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
        }
        
        // Event listeners
        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        zoomInBtn.addEventListener('click', zoomIn);
        zoomOutBtn.addEventListener('click', zoomOut);
        resetZoomBtn.addEventListener('click', resetTransform);
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
        
        // Mouse wheel zoom
        lightboxImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        });
        
        // Drag to pan (only when zoomed)
        lightboxImage.addEventListener('mousedown', (e) => {
            if (scale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                lightboxImage.classList.add('dragging');
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                lightboxImage.classList.remove('dragging');
            }
        });
        
        // Touch support for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let initialDistance = 0;
        let initialScale = 1;
        
        lightboxImage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && scale > 1) {
                // Single touch for panning
                isDragging = true;
                touchStartX = e.touches[0].clientX - translateX;
                touchStartY = e.touches[0].clientY - translateY;
            } else if (e.touches.length === 2) {
                // Two touches for pinch zoom
                isDragging = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialDistance = Math.sqrt(dx * dx + dy * dy);
                initialScale = scale;
            }
        });
        
        lightboxImage.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && isDragging && scale > 1) {
                // Pan
                translateX = e.touches[0].clientX - touchStartX;
                translateY = e.touches[0].clientY - touchStartY;
                updateTransform();
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const scaleChange = distance / initialDistance;
                scale = Math.min(Math.max(initialScale * scaleChange, 0.5), 5);
                updateTransform();
                
                if (scale > 1) {
                    lightboxImage.classList.add('zoomed');
                } else {
                    lightboxImage.classList.remove('zoomed');
                    translateX = 0;
                    translateY = 0;
                    updateTransform();
                }
            }
        });
        
        lightboxImage.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                isDragging = false;
            }
        });
    }

    // Initialize lightbox after DOM is ready
    setupMapLightbox();

    initializeApp();
});
