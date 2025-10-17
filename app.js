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
    let categoryFilter = 'all';
    let fosFilter = 'all';

    const categories = {
        "details": "Contact & Building Info",
        "stats": "Capacity, Enrolment & Utilization",
        "history": "Historical Enrolment",
        "projection": "Projected Enrolment",
        "additions": "Building Additions",
        "building_systems": "Building Systems",
        "accessibility": "Accessibility",
        "playground": "Playground Features",
        "transportation": "Transportation",
        "childcare": "Childcare",
        "projects_provincial": "Provincial Projects",
        "projects_local": "Local Projects"
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
    function populateSidebarControls() {
        schoolListContainer.innerHTML = Object.keys(schoolData).map(schoolId => 
            `<a href="#" class="nav-list-item" data-type="school" data-id="${schoolId}">${schoolData[schoolId].schoolName}</a>`
        ).join('');

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

            case 'stats': return `<div class="data-card stats-combined-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-chart-pie"></i><h2 class="card-title">Statistics</h2></div><div class="card-body"><div class="stats-grid"><div class="stat-item"><div class="stat-item-label">Capacity</div><div class="stat-item-value">${school.enrolment.capacity}</div></div><div class="stat-item"><div class="stat-item-label">Enrolment</div><div class="stat-item-value">${school.enrolment.current}</div></div><div class="stat-item ${capacityClass}"><div class="stat-item-label">Utilization</div><div class="stat-item-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div></div></div></div></div>`;

            case 'history': return `<div class="data-card chart-card ${sizeClass}" data-chart="history" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-line"></i><h2 class="card-title">Historical Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'projection': return `<div class="data-card chart-card ${sizeClass}" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-bar"></i><h2 class="card-title">Projected Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            default: { // For all other simple list cards
                const icons = { building_systems: 'cogs', accessibility: 'universal-access', playground: 'basketball-ball', transportation: 'bus', childcare: 'child', projects_provincial: 'hard-hat', projects_local: 'hard-hat' };
                const titles = { building_systems: 'Building Systems', accessibility: 'Accessibility', playground: 'Playground', transportation: 'Transportation', childcare: 'Childcare', projects_provincial: 'Provincial Projects', projects_local: 'Local Projects' };
                
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
        document.querySelectorAll('.nav-list-item').forEach(item => item.classList.toggle('active', item.dataset.id === (item.dataset.type === 'school' ? selectedSchoolId : selectedCategoryId)));

        if (currentViewMode === 'school') {
            const school = schoolData[selectedSchoolId];
            contentSubtitle.textContent = school.schoolName;
            const cardTypes = ['school_header', 'details', 'additions', 'capacity', 'enrolment', 'utilization', 'projection', 'history', 'building_systems', 'accessibility', 'playground', 'transportation', 'childcare', 'projects_provincial', 'projects_local'];
            cardGrid.innerHTML = cardTypes.map(type => createCard(school, type)).join('');
            
            // Add staggered animation delays
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
            });
            
            renderChart(school, 'history');
            renderChart(school, 'projection');
        } else {
            contentSubtitle.textContent = categories[selectedCategoryId];
            const cardType = selectedCategoryId;
            
            // Filter schools based on current filter
            let filteredSchools = Object.values(schoolData);
            if (categoryFilter === 'elementary') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'Elementary School');
            } else if (categoryFilter === 'highschool') {
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === 'High School');
            } else if (categoryFilter === 'fos' && fosFilter !== 'all') {
                filteredSchools = filteredSchools.filter(s => s.familyOfSchools === fosFilter);
            }
            
            const cardHTML = filteredSchools.map(school => {
                // For category view, create a simplified card with just the school name in header
                const isOverCapacity = school.enrolment.current / school.enrolment.capacity >= 1;
                const warningIcon = isOverCapacity && (cardType==='utilization' || cardType==='enrolment' || cardType==='capacity' || cardType==='stats') ? '<i class="fas fa-exclamation-triangle warning-icon"></i>' : '';
                
                // Create a simple header with school name only (no images)
                const header = `<div class="card-header"><i class="card-header-icon fas fa-school"></i><h2 class="card-title">${school.schoolName}</h2>${warningIcon}</div>`;
                const fullCard = createCard(school, cardType);
                // Replace the standard header with our category-view header (school name only)
                return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
            }).join('');
            cardGrid.innerHTML = cardHTML;
            
            // Add staggered animation delays
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
            });
            
            if (cardType === 'history' || cardType === 'projection') {
                filteredSchools.forEach(school => renderChart(school, cardType));
            }
        }
        
        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `Data updated ${firstSchool.meta.updated}`;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        navViewSelector.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-view-link'); 
            if (target && target.dataset.view !== currentViewMode) { 
                currentViewMode = target.dataset.view;
                // Reset filters when switching views
                categoryFilter = 'all';
                fosFilter = 'all';
                updateView(); 
            } 
        });
        schoolListContainer.addEventListener('click', (e) => { e.preventDefault(); const target = e.target.closest('.nav-list-item'); if (target) { selectedSchoolId = target.dataset.id; updateView(); } });
        categoryListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) { 
                selectedCategoryId = target.dataset.id; 
                updateView(); 
            } 
        });
        
        // Category filter buttons
        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters) {
            categoryFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                
                const filter = btn.dataset.filter;
                categoryFilter = filter;
                
                // Update active state
                categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show/hide FOS submenu
                const fosSubmenu = document.getElementById('fos-submenu');
                const categoryLinks = categoryListContainer.querySelectorAll('.nav-list-item');
                if (filter === 'fos') {
                    fosSubmenu.style.display = 'flex';
                    categoryLinks.forEach(link => link.style.display = 'none');
                } else {
                    fosSubmenu.style.display = 'none';
                    categoryLinks.forEach(link => link.style.display = 'flex');
                    fosFilter = 'all';
                }
                
                updateView();
            });
        }
        
        // FOS filter buttons
        const fosSubmenu = document.getElementById('fos-submenu');
        if (fosSubmenu) {
            fosSubmenu.addEventListener('click', (e) => {
                const btn = e.target.closest('.fos-filter-btn');
                if (btn) {
                    fosFilter = btn.dataset.fos;
                    fosSubmenu.querySelectorAll('.fos-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateView();
                }
                
                // Back button
                const backBtn = e.target.closest('.fos-back-btn');
                if (backBtn) {
                    categoryFilter = 'all';
                    fosFilter = 'all';
                    fosSubmenu.style.display = 'none';
                    const categoryLinks = categoryListContainer.querySelectorAll('.nav-list-item');
                    categoryLinks.forEach(link => link.style.display = 'flex');
                    const categoryFilters = document.getElementById('category-filters');
                    categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    categoryFilters.querySelector('[data-filter="all"]').classList.add('active');
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
