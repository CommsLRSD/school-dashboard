document.addEventListener('DOMContentLoaded', function() {
    
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
    let selectedCategoryIds = []; // Array for multi-category selection
    let combineCategoriesMode = false;
    let categoryFilter = null; // null means show all schools
    let fosFilter = 'all';

    const categories = {
        "details": "Contact & Building Info",
        "capacity": "Capacity",
        "enrolment": "Enrolment",
        "utilization": "Utilization",
        "history": "Historical Enrolment",
        "projection": "Projected Enrolment",
        "additions": "Building Additions",
        "building_systems": "Building Systems",
        "accessibility": "Accessibility",
        "playground": "Playground Features",
        "transportation": "Transportation",
        "childcare": "Childcare",
        "projects_provincial": "Provincially Funded Capital Projects",
        "projects_local": "Locally Funded Capital Projects"
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
            selectedCategoryIds = [selectedCategoryId];

            populateSidebarControls();
            setupEventListeners();
            updateView();
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            cardGrid.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load school data. Check console.</p>`;
        }
    }

    // --- UI Population ---
    function populateSidebarControls() {
        schoolListContainer.innerHTML = Object.keys(schoolData).map(schoolId => 
            `<a href="#" class="nav-list-item" data-type="school" data-id="${schoolId}">${schoolData[schoolId].schoolName}</a>`
        ).join('');

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
                // Title case for other words
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
            return `<option value="${fos}">${displayName}</option>`;
        }).join('');
        
        const fosFilter = document.getElementById('fos-filter');
        if (fosFilter) {
            fosFilter.innerHTML = '<option value="all">All</option>' + fosOptions;
        }

        // Add category links after the existing filter buttons
        const categoryLinks = Object.entries(categories).map(([key, name]) => 
            `<a href="#" class="nav-list-item" data-type="category" data-id="${key}">${name}</a>`
        ).join('');
        categoryListContainer.innerHTML += categoryLinks;
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
        const isOverCapacity = school.enrolment.current / school.enrolment.capacity >= 1;
        const capacityClass = isOverCapacity ? 'over-capacity' : '';
        const sizeClass = getTileSizeClass(cardType);

        switch(cardType) {
            case 'school_header': return `<div class="data-card school-header-card ${sizeClass}"><div class="card-body"><img src="${school.headerImage}" alt="${school.schoolName}"><h2 class="school-name-title">${school.schoolName}</h2></div></div>`;
            
            case 'details': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-info-circle"></i><h2 class="card-title">Details</h2></div><div class="card-body"><ul class="detail-list">${Object.entries({"Address": school.address, "Phone": school.phone, "Program": school.program, ...school.details}).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val}</span></li>`).join('')}</ul></div></div>`;
            
            case 'additions': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-plus-square"></i><h2 class="card-title">Additions</h2></div><div class="card-body"><ul class="detail-list">${school.additions.map(a => `<li class="detail-item"><span class="detail-label">${a.year}</span><span class="detail-value">${a.size}</span></li>`).join('') || '<li class="detail-item">No additions on record.</li>'}</ul></div></div>`;

            case 'capacity': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-users"></i><h2 class="card-title">Capacity</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.capacity}</div><div class="stat-label">Classroom Capacity</div></div></div>`;
            
            case 'enrolment': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-user-graduate"></i><h2 class="card-title">Enrolment</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.current}</div><div class="stat-label">Current Enrolment (Sept. 30)</div></div></div>`;
            
            case 'utilization': return `<div class="data-card utilization-card ${capacityClass} ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-percent"></i><h2 class="card-title">Utilization</h2></div><div class="card-body"><div class="stat-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${Math.min(100, school.enrolment.current / school.enrolment.capacity * 100)}%"></div></div></div></div>`;

            case 'stats': return `<div class="data-card stats-combined-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-chart-pie"></i><h2 class="card-title">Statistics</h2></div><div class="card-body"><div class="stats-grid"><div class="stat-item"><div class="stat-item-label">Capacity</div><div class="stat-item-value">${school.enrolment.capacity}</div></div><div class="stat-item"><div class="stat-item-label">Enrolment</div><div class="stat-item-value">${school.enrolment.current}</div></div><div class="stat-item ${capacityClass}"><div class="stat-item-label">Utilization</div><div class="stat-item-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, school.enrolment.current / school.enrolment.capacity * 100)}%"></div></div></div></div></div></div>`;

            case 'history': return `<div class="data-card chart-card ${sizeClass}" data-chart="history" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-line"></i><h2 class="card-title">Historical Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'projection': return `<div class="data-card chart-card ${sizeClass}" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-bar"></i><h2 class="card-title">Projected Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            default: { // For all other simple list cards
                const icons = { building_systems: 'cogs', accessibility: 'universal-access', playground: 'basketball-ball', transportation: 'bus', childcare: 'child', projects_provincial: 'hard-hat', projects_local: 'hard-hat' };
                const titles = { building_systems: 'Building Systems', accessibility: 'Accessibility', playground: 'Playground', transportation: 'Transportation', childcare: 'Childcare', projects_provincial: 'Provincially Funded Capital Projects', projects_local: 'Locally Funded Capital Projects' };
                
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
                    listItems = ['requested', 'inProgress', 'completed'].flatMap(status => 
                        (data && data[status] && data[status].length > 0) 
                        ? [`<li class="detail-item"><span class="detail-label">${status.charAt(0).toUpperCase() + status.slice(1)}</span></li>`, ...data[status].map(item => `<li class="detail-item" style="padding-left: 1rem;"><i class="fas fa-check-circle" style="color: var(--primary-green); margin-right: 0.5rem; font-size: 0.875rem;"></i>${item}</li>`)] 
                        : []
                    ).join('');
                } else if (cardType === 'playground') {
                    data = school[cardType];
                    listItems = Array.isArray(data) ? data.map(item => {
                        const icon = playgroundIcons[item] || 'circle';
                        return `<li class="detail-item"><i class="fas fa-${icon}" style="color: var(--primary-red); margin-right: 0.5rem; font-size: 0.875rem;"></i>${item}</li>`;
                    }).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : val}</span></li>`).join('');
                } else {
                    data = school[cardType === 'building_systems' ? 'building' : cardType];
                    listItems = Array.isArray(data) ? data.map(item => `<li class="detail-item">${item}</li>`).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : val}</span></li>`).join('');
                }

                return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-${icons[cardType]}"></i><h2 class="card-title">${titles[cardType]}</h2></div><div class="card-body"><ul class="detail-list">${listItems || '<li class="detail-item">No data available.</li>'}</ul></div></div>`;
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
                chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Charts require Chart.js library</p>';
            }
            return;
        }
        
        const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
        if (!chartCard) return;
        const canvas = chartCard.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const chartId = `${type}-${school.id}`;

        if (chartInstances[chartId]) chartInstances[chartId].destroy();

        if (type === 'history') {
            const maxValue = Math.max(...school.enrolment.history.values);
            const yAxisMax = Math.ceil(maxValue * 1.15);
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
            const projectionValues = Object.values(school.enrolment.projection).map(v => parseInt(v.split('-')[0]));
            const maxValue = Math.max(...projectionValues);
            const yAxisMax = Math.ceil(maxValue * 1.15);
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
        
        // Update category items active/selected state
        if (currentViewMode === 'category') {
            document.querySelectorAll('.nav-list-item').forEach(item => {
                if (item.dataset.type === 'category') {
                    if (combineCategoriesMode) {
                        // In combine mode, show selected items
                        if (selectedCategoryIds.includes(item.dataset.id)) {
                            item.classList.add('selected-for-combine');
                        } else {
                            item.classList.remove('selected-for-combine');
                        }
                        item.classList.remove('active');
                    } else {
                        // In normal mode, show active item
                        item.classList.toggle('active', item.dataset.id === selectedCategoryId);
                        item.classList.remove('selected-for-combine');
                    }
                }
            });
        } else {
            document.querySelectorAll('.nav-list-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === (item.dataset.type === 'school' ? selectedSchoolId : selectedCategoryId));
                item.classList.remove('selected-for-combine');
            });
        }

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
                        navIcon.title = 'View all schools for this category';
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showCustomPopup('Go to category view?', e.clientX, e.clientY, () => {
                                currentViewMode = 'category';
                                selectedCategoryId = cardType;
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
            if (combineCategoriesMode && selectedCategoryIds.length > 0) {
                // Combined categories view
                contentSubtitle.textContent = selectedCategoryIds.map(id => categories[id]).join(' + ');
            } else {
                contentSubtitle.textContent = categories[selectedCategoryId];
            }
            
            // Filter schools based on current filter
            let filteredSchools = Object.values(schoolData);
            if (categoryFilter === 'elementary') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'Elementary School');
            } else if (categoryFilter === 'highschool') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'High School');
            } else if (categoryFilter === 'fos' && fosFilter !== 'all') {
                filteredSchools = filteredSchools.filter(s => s.familyOfSchools === fosFilter);
            }
            // If categoryFilter is null, show all schools (no filtering)
            
            if (combineCategoriesMode && selectedCategoryIds.length > 0) {
                // Render multiple categories side by side for each school
                const cardHTML = filteredSchools.map(school => {
                    return selectedCategoryIds.map(cardType => {
                        const utilization = school.enrolment.current / school.enrolment.capacity;
                        const utilizationPercent = Math.round(utilization * 100);
                        let warningIcon = '';
                        
                        // Only show warning icons for utilization-related cards
                        if (cardType === 'utilization') {
                            if (utilizationPercent >= 100) {
                                warningIcon = '<i class="fas fa-exclamation-triangle warning-icon warning-icon-red"></i>';
                            } else if (utilizationPercent >= 95 && utilizationPercent < 100) {
                                warningIcon = '<i class="fas fa-exclamation-circle warning-icon warning-icon-yellow"></i>';
                            }
                        }
                        
                        // Create header with school name and category
                        const header = `<div class="card-header"><i class="card-header-icon fas fa-school"></i><h2 class="card-title">${school.schoolName} - ${categories[cardType]}${warningIcon}</h2></div>`;
                        const fullCard = createCard(school, cardType);
                        return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
                    }).join('');
                }).join('');
                cardGrid.innerHTML = cardHTML;
            } else {
                // Single category view
                const cardType = selectedCategoryId;
                const cardHTML = filteredSchools.map(school => {
                    const utilization = school.enrolment.current / school.enrolment.capacity;
                    const utilizationPercent = Math.round(utilization * 100);
                    let warningIcon = '';
                    
                    // Only show warning icons for utilization-related cards
                    if (cardType === 'utilization') {
                        if (utilizationPercent >= 100) {
                            warningIcon = '<i class="fas fa-exclamation-triangle warning-icon warning-icon-red"></i>';
                        } else if (utilizationPercent >= 95 && utilizationPercent < 100) {
                            warningIcon = '<i class="fas fa-exclamation-circle warning-icon warning-icon-yellow"></i>';
                        }
                    }
                    
                    // Create a simple header with school name only (no images)
                    const header = `<div class="card-header"><i class="card-header-icon fas fa-school"></i><h2 class="card-title">${school.schoolName}${warningIcon}</h2></div>`;
                    const fullCard = createCard(school, cardType);
                    return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
                }).join('');
                cardGrid.innerHTML = cardHTML;
            }
            
            // Add staggered animation delays and navigation icons
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                
                // Add navigation icon to cards in category view
                const schoolIndex = Math.floor(index / (combineCategoriesMode ? selectedCategoryIds.length : 1));
                const schoolId = filteredSchools[schoolIndex]?.id;
                if (schoolId) {
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('i');
                        navIcon.className = 'fas fa-external-link-alt card-nav-icon';
                        navIcon.title = 'View all categories for this school';
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showCustomPopup('Go to school view?', e.clientX, e.clientY, () => {
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
            if (combineCategoriesMode) {
                selectedCategoryIds.forEach(cardType => {
                    if (cardType === 'history' || cardType === 'projection') {
                        filteredSchools.forEach(school => renderChart(school, cardType));
                    }
                });
            } else {
                const cardType = selectedCategoryId;
                if (cardType === 'history' || cardType === 'projection') {
                    filteredSchools.forEach(school => renderChart(school, cardType));
                }
            }
        }
        
        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `Data updated ${firstSchool.meta.updated}`;
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
                // Reset filters when switching views
                categoryFilter = null;
                fosFilter = 'all';
                
                // Reset combine mode when switching views
                combineCategoriesMode = false;
                const combineCategoriesCheckbox = document.getElementById('combine-categories-checkbox');
                const combineCategoriesHint = document.getElementById('combine-categories-hint');
                if (combineCategoriesCheckbox) {
                    combineCategoriesCheckbox.checked = false;
                }
                if (combineCategoriesHint) {
                    combineCategoriesHint.classList.remove('visible');
                }
                selectedCategoryIds = [selectedCategoryId];
                
                // Reset dropdowns
                const levelSelect = document.getElementById('level-filter');
                const fosSelect = document.getElementById('fos-filter');
                if (levelSelect) levelSelect.value = 'all';
                if (fosSelect) fosSelect.value = 'all';
                
                updateView(); 
            } 
        });
        schoolListContainer.addEventListener('click', (e) => { e.preventDefault(); const target = e.target.closest('.nav-list-item'); if (target) { selectedSchoolId = target.dataset.id; updateView(); } });
        categoryListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) {
                const categoryId = target.dataset.id;
                
                if (combineCategoriesMode) {
                    // In combine mode, toggle selection
                    const index = selectedCategoryIds.indexOf(categoryId);
                    if (index > -1) {
                        // Deselect
                        selectedCategoryIds.splice(index, 1);
                    } else {
                        // Select (max 3)
                        if (selectedCategoryIds.length < 3) {
                            selectedCategoryIds.push(categoryId);
                        }
                    }
                    
                    // Update UI to show selected categories
                    document.querySelectorAll('#category-list-container .nav-list-item').forEach(item => {
                        if (selectedCategoryIds.includes(item.dataset.id)) {
                            item.classList.add('selected-for-combine');
                        } else {
                            item.classList.remove('selected-for-combine');
                        }
                    });
                    
                    // Only update view if at least one category is selected
                    if (selectedCategoryIds.length > 0) {
                        updateView();
                    }
                } else {
                    // Normal mode - single selection
                    selectedCategoryId = categoryId;
                    selectedCategoryIds = [categoryId];
                    // Reset filters when clicking a category link
                    categoryFilter = null;
                    fosFilter = 'all';
                    // Reset dropdowns
                    const levelSelect = document.getElementById('level-filter');
                    const fosSelect = document.getElementById('fos-filter');
                    if (levelSelect) levelSelect.value = 'all';
                    if (fosSelect) fosSelect.value = 'all';
                    updateView();
                }
            } 
        });
        
        // Level filter dropdown
        const levelSelect = document.getElementById('level-filter');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value === 'all') {
                    categoryFilter = null;
                } else {
                    categoryFilter = value;
                }
                updateView();
            });
        }
        
        // Family of Schools filter dropdown
        const fosSelect = document.getElementById('fos-filter');
        if (fosSelect) {
            fosSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value === 'all') {
                    categoryFilter = null;
                    fosFilter = 'all';
                } else {
                    categoryFilter = 'fos';
                    fosFilter = value;
                }
                updateView();
            });
        }
        
        // Combine categories checkbox
        const combineCategoriesCheckbox = document.getElementById('combine-categories-checkbox');
        const combineCategoriesHint = document.getElementById('combine-categories-hint');
        if (combineCategoriesCheckbox) {
            combineCategoriesCheckbox.addEventListener('change', (e) => {
                combineCategoriesMode = e.target.checked;
                
                if (combineCategoriesMode) {
                    // Enable combine mode
                    combineCategoriesHint.classList.add('visible');
                    // Start with current category selected
                    selectedCategoryIds = [selectedCategoryId];
                    // Update UI
                    document.querySelectorAll('#category-list-container .nav-list-item').forEach(item => {
                        if (item.dataset.id === selectedCategoryId) {
                            item.classList.add('selected-for-combine');
                        }
                    });
                } else {
                    // Disable combine mode
                    combineCategoriesHint.classList.remove('visible');
                    // Keep only first selected category
                    if (selectedCategoryIds.length > 0) {
                        selectedCategoryId = selectedCategoryIds[0];
                        selectedCategoryIds = [selectedCategoryId];
                    }
                    // Remove selection highlights
                    document.querySelectorAll('#category-list-container .nav-list-item').forEach(item => {
                        item.classList.remove('selected-for-combine');
                    });
                    updateView();
                }
            });
        }
        
        function toggleSidebar() { const isOpen = sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible', isOpen); }
        sidebarToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
        sidebarOverlay.addEventListener('click', toggleSidebar);
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', toggleSidebar);
        }
    }

    initializeApp();
});
