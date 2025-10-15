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

    const categories = {
        "details": "Contact & Building Info",
        "enrolment": "Enrolment Stats",
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
            Chart.register(ChartDataLabels);
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

        categoryListContainer.innerHTML = Object.entries(categories).map(([key, name]) => 
            `<a href="#" class="nav-list-item" data-type="category" data-id="${key}">${name}</a>`
        ).join('');
    }

    // --- Card Creation Functions ---
    const createCard = (school, cardType) => {
        const isOverCapacity = school.enrolment.current / school.enrolment.capacity >= 1;
        const capacityClass = isOverCapacity ? 'over-capacity' : '';

        switch(cardType) {
            case 'school_header': return `<div class="data-card school-header-card"><div class="card-body"><img src="${school.headerImage}" alt="${school.schoolName}"><h2 class="school-name-title">${school.schoolName}</h2></div></div>`;
            
            case 'details': return `<div class="data-card list-card"><div class="card-header"><i class="card-header-icon fas fa-info-circle"></i><h2 class="card-title">Details</h2></div><div class="card-body"><ul class="detail-list">${Object.entries({"Address": school.address, "Phone": school.phone, "Program": school.program, ...school.details}).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val}</span></li>`).join('')}</ul></div></div>`;
            
            case 'additions': return `<div class="data-card list-card"><div class="card-header"><i class="card-header-icon fas fa-plus-square"></i><h2 class="card-title">Additions</h2></div><div class="card-body"><ul class="detail-list">${school.additions.map(a => `<li class="detail-item"><span class="detail-label">${a.year}</span><span class="detail-value">${a.size}</span></li>`).join('') || '<li class="detail-item">No additions on record.</li>'}</ul></div></div>`;

            case 'capacity': return `<div class="data-card stat-card"><div class="card-header"><i class="card-header-icon fas fa-users"></i><h2 class="card-title">Capacity</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.capacity}</div><div class="stat-label">Classroom Capacity</div></div></div>`;
            
            case 'enrolment': return `<div class="data-card stat-card"><div class="card-header"><i class="card-header-icon fas fa-user-graduate"></i><h2 class="card-title">Enrolment</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.current}</div><div class="stat-label">Current Enrolment</div></div></div>`;
            
            case 'utilization': return `<div class="data-card utilization-card ${capacityClass}"><div class="card-header"><i class="card-header-icon fas fa-percent"></i><h2 class="card-title">Utilization</h2></div><div class="card-body"><div class="stat-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${Math.min(100, school.enrolment.current / school.enrolment.capacity * 100)}%"></div></div></div></div>`;

            case 'history': return `<div class="data-card chart-card" data-chart="history" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-line"></i><h2 class="card-title">Historical Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            case 'projection': return `<div class="data-card chart-card" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-bar"></i><h2 class="card-title">Projected Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;

            default: { // For all other simple list cards
                const icons = { building_systems: 'cogs', accessibility: 'universal-access', playground: 'basketball-ball', transportation: 'bus', childcare: 'child', projects_provincial: 'hard-hat', projects_local: 'hard-hat' };
                const titles = { building_systems: 'Building Systems', accessibility: 'Accessibility', playground: 'Playground', transportation: 'Transportation', childcare: 'Childcare', projects_provincial: 'Provincial Projects', projects_local: 'Local Projects' };
                
                let data, listItems;
                if (cardType === 'projects_provincial' || cardType === 'projects_local') {
                    const projectType = cardType.split('_')[1];
                    data = school.projects[projectType];
                    listItems = ['requested', 'inProgress', 'completed'].flatMap(status => data[status].length > 0 ? [`<li class="detail-item"><span class="detail-label">${status.charAt(0).toUpperCase() + status.slice(1)}</span></li>`, ...data[status].map(item => `<li class="detail-item" style="padding-left: 1rem;">${item}</li>`)] : []).join('');
                } else {
                    data = school[cardType === 'building_systems' ? 'building' : cardType];
                    listItems = Array.isArray(data) ? data.map(item => `<li class="detail-item">${item}</li>`).join('') : Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : val}</span></li>`).join('');
                }

                return `<div class="data-card list-card"><div class="card-header"><i class="card-header-icon fas fa-${icons[cardType]}"></i><h2 class="card-title">${titles[cardType]}</h2></div><div class="card-body"><ul class="detail-list">${listItems || '<li class="detail-item">No data available.</li>'}</ul></div></div>`;
            }
        }
    }

    // --- Chart Rendering ---
    const renderChart = (school, type) => {
        const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
        if (!chartCard) return;
        const canvas = chartCard.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const chartId = `${type}-${school.id}`;

        if (chartInstances[chartId]) chartInstances[chartId].destroy();

        if (type === 'history') {
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', data: { labels: school.enrolment.history.labels, datasets: [{ data: school.enrolment.history.values, borderColor: 'var(--primary-blue)', backgroundColor: 'rgba(58, 93, 143, 0.1)', fill: true, tension: 0.3 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'top', font: { weight: 'bold' } } } }
            });
        } else if (type === 'projection') {
            chartInstances[chartId] = new Chart(ctx, {
                type: 'bar', data: { labels: Object.keys(school.enrolment.projection), datasets: [{ data: Object.values(school.enrolment.projection).map(v => parseInt(v.split('-')[0])), backgroundColor: 'var(--primary-blue)' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'end', formatter: (v, ctx) => Object.values(school.enrolment.projection)[ctx.dataIndex], font: { weight: 'bold' } } } }
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
            const cardTypes = ['school_header', 'details', 'additions', 'capacity', 'enrolment', 'utilization', 'history', 'projection', 'building_systems', 'accessibility', 'playground', 'transportation', 'childcare', 'projects_provincial', 'projects_local'];
            cardGrid.innerHTML = cardTypes.map(type => createCard(school, type)).join('');
            renderChart(school, 'history');
            renderChart(school, 'projection');
        } else {
            contentSubtitle.textContent = categories[selectedCategoryId];
            const cardType = selectedCategoryId;
            const cardHTML = Object.values(schoolData).map(school => {
                // For category view, we need a different header for the single card type
                const isOverCapacity = school.enrolment.current / school.enrolment.capacity >= 1;
                const header = `<div class="card-header"><img src="${school.headerImage}" alt="${school.schoolName}" class="card-header-thumbnail"><div><h2 class="card-title">${school.schoolName}</h2></div>${isOverCapacity && (cardType==='utilization' || cardType==='enrolment') ? '<i class="fas fa-exclamation-triangle warning-icon"></i>' : ''}</div>`;
                const fullCard = createCard(school, cardType);
                // Replace the standard header with our special category-view header
                return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
            }).join('');
            cardGrid.innerHTML = cardHTML;
            if (cardType === 'history' || cardType === 'projection') {
                Object.values(schoolData).forEach(school => renderChart(school, cardType));
            }
        }
        
        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `Data updated ${firstSchool.meta.updated}`;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        navViewSelector.addEventListener('click', (e) => { e.preventDefault(); const target = e.target.closest('.nav-view-link'); if (target && target.dataset.view !== currentViewMode) { currentViewMode = target.dataset.view; updateView(); } });
        schoolListContainer.addEventListener('click', (e) => { e.preventDefault(); const target = e.target.closest('.nav-list-item'); if (target) { selectedSchoolId = target.dataset.id; updateView(); } });
        categoryListContainer.addEventListener('click', (e) => { e.preventDefault(); const target = e.target.closest('.nav-list-item'); if (target) { selectedCategoryId = target.dataset.id; updateView(); } });
        function toggleSidebar() { const isOpen = sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible', isOpen); }
        sidebarToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    initializeApp();
});
