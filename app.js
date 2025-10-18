document.addEventListener('DOMContentLoaded', async function() {
    
    // --- i18n Initialization ---
    const savedLanguage = localStorage.getItem('language') || 'en';
    
    await i18next.init({
        lng: savedLanguage,
        fallbackLng: 'en',
        resources: {}
    });
    
    // Load translation files
    const languages = ['en', 'fr', 'es'];
    for (const lang of languages) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            const translations = await response.json();
            i18next.addResourceBundle(lang, 'translation', translations);
        } catch (error) {
            console.error(`Failed to load ${lang} translations:`, error);
        }
    }
    
    // Set initial language
    await i18next.changeLanguage(savedLanguage);
    
    // Helper function to translate elements with data-i18n attributes
    const translatePage = () => {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = i18next.t(key);
            
            // Handle special cases for attributes
            if (key.startsWith('[')) {
                const match = key.match(/\[(.*?)\](.*)/);
                if (match) {
                    const attr = match[1];
                    const translationKey = match[2];
                    element.setAttribute(attr, i18next.t(translationKey));
                }
            } else {
                element.textContent = translation;
            }
        });
        
        // Update page title
        document.title = i18next.t('app.title');
    };
    
    // Initial translation
    translatePage();
    
    // --- Global Variables ---
    const cardGrid = document.getElementById('card-grid');
    const contentSubtitle = document.getElementById('content-subtitle');
    const footerTimestamp = document.getElementById('footer-timestamp');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const navViewSelector = document.querySelector('.nav-view-selector');
    const schoolListContainer = document.getElementById('school-list-container');
    const categoryListContainer = document.getElementById('category-list-container');

    let schoolData = {};
    let chartInstances = {};
    let currentViewMode = 'school';
    let selectedSchoolId = '';
    let selectedCategoryId = '';
    let filterValue = 'all'; // Combined filter value

    // Helper function to format numbers with commas
    const formatNumber = (num) => {
        // Handle number type first
        if (typeof num === 'number') {
            const numStr = num.toString();
            // Don't format years (4-digit numbers between 1800-2100)
            if (num >= 1800 && num <= 2100 && numStr.length === 4) {
                return numStr;
            }
            if (num >= 1000) {
                return num.toLocaleString('en-US');
            }
            return num;
        }
        
        // Handle string type
        if (typeof num === 'string') {
            // Extract just the number part if it contains units like "ft²"
            const match = num.match(/^(\d+)\s*(.*)$/);
            if (match) {
                const number = parseInt(match[1]);
                const unit = match[2];
                // Don't format years in the string
                if (number >= 1800 && number <= 2100 && match[1].length === 4 && !unit) {
                    return num;
                }
                if (number >= 1000) {
                    return number.toLocaleString('en-US') + (unit ? ' ' + unit : '');
                }
                return num; // Return as-is if less than 1000
            }
            // Check if it's just a number string
            if (!isNaN(num)) {
                const number = parseInt(num);
                // Don't format years (4-digit numbers between 1800-2100)
                if (number >= 1800 && number <= 2100 && num.length === 4) {
                    return num;
                }
                if (number >= 1000) {
                    return number.toLocaleString('en-US');
                }
            }
        }
        return num;
    };

    // Helper function to fix label text (e.g., add line breaks)
    const formatLabel = (label) => {
        // Replace "Automatic entrance door operators" with proper label
        if (label === 'Automatic entrance door operators') {
            return i18next.t('labels.accessibleEntranceDoorOperators');
        }
        return label;
    };

    const categories = {
        "details": () => i18next.t("categories.details"),
        "enrolment_capacity": () => i18next.t("categories.enrolment_capacity"),
        "history": () => i18next.t("categories.history"),
        "projection": () => i18next.t("categories.projection"),
        "additions": () => i18next.t("categories.additions"),
        "building_systems": () => i18next.t("categories.building_systems"),
        "accessibility": () => i18next.t("categories.accessibility"),
        "playground": () => i18next.t("categories.playground"),
        "transportation": () => i18next.t("categories.transportation"),
        "childcare": () => i18next.t("categories.childcare"),
        "projects_provincial": () => i18next.t("categories.projects_provincial"),
        "projects_local": () => i18next.t("categories.projects_local")
    };

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            // Check if Chart is available, register plugin if it is
            if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }
            
            const response = await fetch('data/schools.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            schoolData = await response.json();
            
            selectedSchoolId = Object.keys(schoolData)[0];
            selectedCategoryId = Object.keys(categories)[0];

            populateSidebarControls();
            setupEventListeners();
            updateView();
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            cardGrid.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load school data. Check console.</p>`;
        }
    }

    // --- UI Population ---
    function populateSchoolList(searchTerm = '') {
        // Normalize search term for accent-insensitive and case-insensitive search
        const normalizedSearch = normalizeString(searchTerm);
        
        // Find the container for school links (after search controls)
        const schoolLinksHTML = Object.keys(schoolData)
            .filter(schoolId => {
                if (!searchTerm) return true;
                const schoolName = schoolData[schoolId].schoolName;
                return normalizeString(schoolName).includes(normalizedSearch);
            })
            .map(schoolId => 
                `<a href="#" class="nav-list-item" data-type="school" data-id="${schoolId}">${schoolData[schoolId].schoolName}</a>`
            ).join('');
        
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

        // Remove old category links if they exist
        const oldCategoryLinks = categoryListContainer.querySelectorAll('.nav-list-item');
        oldCategoryLinks.forEach(link => link.remove());
        
        // Add category links after the existing filter buttons
        const categoryLinks = Object.entries(categories).map(([key, name]) => 
            `<a href="#" class="nav-list-item" data-type="category" data-id="${key}">${name()}</a>`
        ).join('');
        categoryListContainer.innerHTML += categoryLinks;
    }
    
    // Helper function to normalize strings (case-insensitive, accent-insensitive)
    function normalizeString(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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

    const createCard = (school, cardType) => {
        const utilization = school.enrolment.current / school.enrolment.capacity;
        const utilizationPercent = (utilization * 100).toFixed(1);
        const isOverCapacity = utilization >= 1;
        const isYellowZone = utilization >= 0.95 && utilization < 1;
        const capacityClass = isOverCapacity ? 'over-capacity' : (isYellowZone ? 'yellow-zone' : '');
        const sizeClass = getTileSizeClass(cardType);

        switch(cardType) {
            case 'school_header': return `<div class="data-card school-header-card ${sizeClass}"><div class="card-body"><img src="${school.headerImage}" alt="${school.schoolName}"><h2 class="school-name-title">${school.schoolName}</h2></div></div>`;
            
            case 'details': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-info-circle"></i><h2 class="card-title">${i18next.t('cards.details')}</h2></div><div class="card-body"><ul class="detail-list">${Object.entries({[i18next.t('labels.address')]: school.address, [i18next.t('labels.phone')]: school.phone, [i18next.t('labels.program')]: school.program, ...school.details}).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${formatNumber(val)}</span></li>`).join('')}</ul></div></div>`;
            
            case 'additions': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-plus-square"></i><h2 class="card-title">${i18next.t('cards.additions')}</h2></div><div class="card-body"><ul class="detail-list">${school.additions.map(a => `<li class="detail-item"><span class="detail-label">${a.year}</span><span class="detail-value">${a.size}</span></li>`).join('') || `<li class="detail-item">${i18next.t('labels.noAdditions')}</li>`}</ul></div></div>`;

            case 'capacity': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-users"></i><h2 class="card-title">${i18next.t('cards.capacity')}</h2></div><div class="card-body"><div class="stat-value">${formatNumber(school.enrolment.capacity)}</div><div class="stat-label">${i18next.t('labels.classroomCapacity')}</div></div></div>`;
            
            case 'enrolment': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-user-graduate"></i><h2 class="card-title">${i18next.t('cards.enrolment')}</h2></div><div class="card-body"><div class="stat-value">${formatNumber(school.enrolment.current)}</div><div class="stat-label">${i18next.t('labels.currentEnrolment')}</div></div></div>`;
            
            case 'utilization': return `<div class="data-card utilization-card ${capacityClass} ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-percent"></i><h2 class="card-title">${i18next.t('cards.utilization')}</h2></div><div class="card-body"><div class="stat-value">${utilizationPercent}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></div></div>`;

            case 'stats': return `<div class="data-card stats-combined-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-chart-pie"></i><h2 class="card-title">${i18next.t('cards.statistics')}</h2></div><div class="card-body"><div class="stats-rows"><div class="stat-row"><div class="stat-row-label">${i18next.t('cards.enrolment')}</div><div class="stat-row-value">${formatNumber(school.enrolment.current)}</div></div><div class="stat-row"><div class="stat-row-label">${i18next.t('cards.capacity')}</div><div class="stat-row-value">${formatNumber(school.enrolment.capacity)}</div></div><div class="stat-row ${capacityClass}"><div class="stat-row-label">${i18next.t('cards.utilization')}</div><div class="stat-row-value">${utilizationPercent}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></div></div></div></div>`;

            case 'enrolment_capacity': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-users"></i><h2 class="card-title">${i18next.t('categories.enrolment_capacity')}</h2></div><div class="card-body"><ul class="detail-list"><li class="detail-item"><span class="detail-label">${i18next.t('labels.enrolmentLabel')}</span><span class="detail-value enrolment-value">${formatNumber(school.enrolment.current)}</span></li><li class="detail-item"><span class="detail-label">${i18next.t('labels.capacityLabel')}</span><span class="detail-value capacity-value">${formatNumber(school.enrolment.capacity)}</span></li><li class="detail-item ${capacityClass}"><span class="detail-label">${i18next.t('labels.utilizationLabel')}</span><span class="detail-value utilization-value">${utilizationPercent}%</span></li><li class="detail-item progress-item"><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, utilization * 100)}%"></div></div></li></ul></div></div>`;

            case 'history': return `<div class="data-card chart-card ${sizeClass}" data-chart="history" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-line"></i><h2 class="card-title">${i18next.t('cards.historicEnrolment')}</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'projection': return `<div class="data-card chart-card ${sizeClass}" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-bar"></i><h2 class="card-title">${i18next.t('cards.projectedEnrolment')}</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            default: { // For all other simple list cards
                const icons = { building_systems: 'cogs', accessibility: 'universal-access', playground: 'basketball-ball', transportation: 'bus', childcare: 'child', projects_provincial: 'hard-hat', projects_local: 'hard-hat' };
                const titles = { 
                    building_systems: () => i18next.t('cards.buildingSystems'), 
                    accessibility: () => i18next.t('cards.accessibility'), 
                    playground: () => i18next.t('cards.playground'), 
                    transportation: () => i18next.t('cards.transportation'), 
                    childcare: () => i18next.t('cards.childcare'), 
                    projects_provincial: () => i18next.t('cards.provincialProjects'), 
                    projects_local: () => i18next.t('cards.localProjects') 
                };
                
                const playgroundIcons = {
                    'Basketball Court': 'basketball-ball',
                    'Basketball Action Play': 'basketball-ball',
                    'Steel Play structure': 'tower-cell',
                    'Wooden Play structure': 'tree',
                    'Climbing dome': 'mountain',
                    'Shade structure': 'umbrella',
                    'Soccer nets': 'futbol',
                    'Baseball Diamond': 'baseball-ball'
                };
                
                let data, listItems;
                if (cardType === 'projects_provincial' || cardType === 'projects_local') {
                    const projectType = cardType.split('_')[1];
                    data = school.projects[projectType];
                    listItems = ['requested', 'inProgress', 'completed'].flatMap(status => {
                        if (!data || !data[status] || data[status].length === 0) return [];
                        
                        // Determine icon color based on status
                        let iconColor, iconClass;
                        if (status === 'requested') {
                            iconColor = 'var(--over-capacity-red)'; // Red
                            iconClass = 'fa-circle';
                        } else if (status === 'inProgress') {
                            iconColor = '#f59e0b'; // Yellow
                            iconClass = 'fa-circle';
                        } else { // completed
                            iconColor = 'var(--primary-green)'; // Green
                            iconClass = 'fa-check-circle';
                        }
                        
                        const statusLabel = i18next.t(`projectStatus.${status}`);
                        return [
                            `<li class="detail-item"><span class="detail-label"><i class="fas ${iconClass}" style="color: ${iconColor}; margin-right: 0.5rem; font-size: 0.875rem;"></i>${statusLabel}</span></li>`,
                            ...data[status].map(item => `<li class="detail-item" style="padding-left: 1rem;">${item}</li>`)
                        ];
                    }).join('');
                } else if (cardType === 'playground') {
                    data = school[cardType];
                    listItems = Array.isArray(data) ? data.map(item => {
                        // Check if this is a City Property item
                        if (item.startsWith('City Property:')) {
                            const cityPropertyItem = item.replace('City Property:', '').trim();
                            return `<li class="detail-item"><span class="detail-label">${i18next.t('labels.cityProperty')}</span><span class="detail-value">${cityPropertyItem}</span></li>`;
                        }
                        // Regular playground items with icons
                        const icon = playgroundIcons[item] || 'circle';
                        return `<li class="detail-item"><i class="fas fa-${icon}" style="color: var(--primary-red); margin-right: 0.5rem; font-size: 0.875rem;"></i>${item}</li>`;
                    }).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${formatLabel(key)}</span><span class="detail-value">${val === "YES" ? `<span class="yes-badge">${i18next.t('badges.yes')}</span>` : val === "NO" ? `<span class="no-badge">${i18next.t('badges.no')}</span>` : formatNumber(val)}</span></li>`).join('');
                } else {
                    data = school[cardType === 'building_systems' ? 'building' : cardType];
                    listItems = Array.isArray(data) ? data.map(item => `<li class="detail-item">${item}</li>`).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${formatLabel(key)}</span><span class="detail-value">${val === "YES" ? `<span class="yes-badge">${i18next.t('badges.yes')}</span>` : val === "NO" ? `<span class="no-badge">${i18next.t('badges.no')}</span>` : formatNumber(val)}</span></li>`).join('');
                }

                return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-${icons[cardType]}"></i><h2 class="card-title">${titles[cardType]()}</h2></div><div class="card-body"><ul class="detail-list">${listItems || `<li class="detail-item">${i18next.t('labels.noData')}</li>`}</ul></div></div>`;
            }
        }
    }

    // --- Chart Rendering ---
    const renderChart = (school, type) => {
        // Skip chart rendering if Chart.js is not available
        if (typeof Chart === 'undefined') {
            const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
            if (chartCard) {
                const chartContainer = chartCard.querySelector('.chart-container');
                chartContainer.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 2rem;">${i18next.t('labels.chartsRequireChartJS')}</p>`;
            }
            return;
        }
        
        const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
        if (!chartCard) return;
        const canvas = chartCard.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const chartId = `${type}-${school.id}`;

        if (chartInstances[chartId]) chartInstances[chartId].destroy();

        // Calculate unified y-axis max for both history and projection charts
        const historyMax = Math.max(...school.enrolment.history.values);
        const projectionValues = Object.values(school.enrolment.projection).map(v => parseInt(v.split('-')[0]));
        const projectionMax = Math.max(...projectionValues);
        const combinedMax = Math.max(historyMax, projectionMax);
        // Round up to nearest 50
        const yAxisMax = Math.ceil(combinedMax / 50) * 50;

        if (type === 'history') {
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { 
                    labels: school.enrolment.history.labels, 
                    datasets: [{ 
                        data: school.enrolment.history.values, 
                        borderColor: '#BE5247', 
                        backgroundColor: 'rgba(190, 82, 71, 0.1)', 
                        fill: true, 
                        tension: 0.3 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false }, 
                        datalabels: typeof ChartDataLabels !== 'undefined' ? { 
                            anchor: 'end', 
                            align: 'top', 
                            font: { weight: 'bold' },
                            color: '#BE5247'
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
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { 
                    labels: Object.keys(school.enrolment.projection), 
                    datasets: [{ 
                        data: projectionValues, 
                        borderColor: '#2BA680', 
                        backgroundColor: 'rgba(43, 166, 128, 0.1)', 
                        fill: true, 
                        tension: 0.3 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false }, 
                        datalabels: typeof ChartDataLabels !== 'undefined' ? { 
                            anchor: 'end', 
                            align: 'top', 
                            font: { weight: 'bold' },
                            color: '#2BA680'
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
    function updateView() {
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
        cardGrid.innerHTML = ''; 

        document.querySelectorAll('.nav-view-link').forEach(link => link.classList.toggle('active', link.dataset.view === currentViewMode));
        document.querySelectorAll('.nav-list-container').forEach(c => c.classList.toggle('active', c.id.startsWith(currentViewMode)));
        
        // Update category items active state
        document.querySelectorAll('.nav-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === (item.dataset.type === 'school' ? selectedSchoolId : selectedCategoryId));
        });

        if (currentViewMode === 'school') {
            const school = schoolData[selectedSchoolId];
            contentSubtitle.textContent = school.schoolName;
            const cardTypes = ['school_header', 'details', 'additions', 'capacity', 'enrolment', 'utilization', 'projection', 'history', 'building_systems', 'accessibility', 'playground', 'transportation', 'childcare', 'projects_provincial', 'projects_local'];
            cardGrid.innerHTML = cardTypes.map(type => createCard(school, type)).join('');
            
            // Add staggered animation delays and navigation icons
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                
                // Add navigation icon to cards in school view (except school_header)
                const cardType = cardTypes[index];
                if (cardType !== 'school_header') {
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('i');
                        navIcon.className = 'fas fa-external-link-alt card-nav-icon';
                        navIcon.title = i18next.t('tooltips.viewAllSchoolsCategory');
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showCustomPopup(i18next.t('popup.goToCategoryView'), e.clientX, e.clientY, () => {
                                currentViewMode = 'category';
                                // Map enrolment, capacity, and utilization to enrolment_capacity category
                                if (cardType === 'enrolment' || cardType === 'capacity' || cardType === 'utilization') {
                                    selectedCategoryId = 'enrolment_capacity';
                                } else {
                                    selectedCategoryId = cardType;
                                }
                                updateView();
                            });
                        });
                        header.appendChild(navIcon);
                    }
                }
            });
            
            renderChart(school, 'history');
            renderChart(school, 'projection');
        } else {
            // Category view
            contentSubtitle.textContent = categories[selectedCategoryId]();
            
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
                        warningIcon = '<i class="fas fa-exclamation-triangle warning-icon warning-icon-red"></i>';
                    } else if (utilization >= 0.95 && utilization < 1) {
                        warningIcon = '<i class="fas fa-exclamation-circle warning-icon warning-icon-yellow"></i>';
                    }
                }
                
                // Create a simple header with school name only (no images)
                const header = `<div class="card-header"><i class="card-header-icon fas fa-school"></i><h2 class="card-title">${school.schoolName}${warningIcon}</h2></div>`;
                
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
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('i');
                        navIcon.className = 'fas fa-external-link-alt card-nav-icon';
                        navIcon.title = i18next.t('tooltips.viewAllCategoriesSchool');
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showCustomPopup(i18next.t('popup.goToSchoolView'), e.clientX, e.clientY, () => {
                                currentViewMode = 'school';
                                selectedSchoolId = schoolId;
                                updateView();
                            });
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
        
        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `${i18next.t('footer.dataUpdated')} ${firstSchool.meta.updated}`;
    }

    // --- Custom Popup Functions ---
    function showCustomPopup(message, x, y, onConfirm) {
        const popup = document.querySelector('.custom-popup');
        const overlay = document.querySelector('.popup-overlay');
        const popupMessage = document.querySelector('.popup-message');
        const confirmBtn = document.querySelector('.popup-button-confirm');
        const cancelBtn = document.querySelector('.popup-button-cancel');
        
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
        
        const handleConfirm = () => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);
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
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('visible');
                }
            } 
        });
        categoryListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) {
                const categoryId = target.dataset.id;
                selectedCategoryId = categoryId;
                // Reset filter when clicking a category link
                filterValue = 'all';
                // Reset dropdown
                const combinedFilter = document.getElementById('combined-filter');
                if (combinedFilter) combinedFilter.value = 'all';
                updateView();
                // Close sidebar on mobile after selection
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('visible');
                }
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
        
        function toggleSidebar() { const isOpen = sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible', isOpen); }
        sidebarToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
        sidebarOverlay.addEventListener('click', toggleSidebar);
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', toggleSidebar);
        }
        
        // Language switcher
        const languageSwitcher = document.getElementById('language-switcher');
        if (languageSwitcher) {
            languageSwitcher.addEventListener('change', async (e) => {
                const newLang = e.target.value;
                await i18next.changeLanguage(newLang);
                localStorage.setItem('language', newLang);
                
                // Translate all static elements
                translatePage();
                
                // Repopulate sidebar to update category names
                populateSidebarControls();
                
                // Update the current view
                updateView();
            });
            
            // Set initial language value
            languageSwitcher.value = savedLanguage;
        }
    }

    initializeApp();
});
