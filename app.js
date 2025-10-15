document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Variables ---
    const cardGrid = document.getElementById('card-grid');
    const mainTitle = document.getElementById('main-title');
    const footerTimestamp = document.getElementById('footer-timestamp');
    const viewToggle = document.getElementById('view-toggle');
    const schoolList = document.getElementById('school-list');
    const categoryList = document.getElementById('category-list');
    const schoolListSection = document.getElementById('school-list-section');
    const categoryListSection = document.getElementById('category-list-section');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    let schoolData = {};
    let chartInstances = {};
    const categories = {
        "basic": "Basic Info", "enrolment": "Enrolment", "building": "Building Systems",
        "playground": "Playground", "transportation": "Transportation",
        "accessibility": "Accessibility", "childcare": "Childcare", "projects": "Capital Projects"
    };

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            Chart.register(ChartDataLabels);
            const response = await fetch('data/schools.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            schoolData = await response.json();
            populateSidebarControls();
            setupEventListeners();
            updateView(true); // Initial load
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            cardGrid.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load school data. Check console.</p>`;
        }
    }

    // --- UI Population ---
    function populateSidebarControls() {
        Object.keys(schoolData).forEach((schoolId, index) => {
            schoolList.innerHTML += `<label><input type="radio" name="school-filter" value="${schoolId}" ${index === 0 ? 'checked' : ''}><span>${schoolData[schoolId].schoolName}</span></label>`;
        });
        Object.entries(categories).forEach(([key, name], index) => {
            categoryList.innerHTML += `<label><input type="radio" name="category-filter" value="${key}" ${index === 0 ? 'checked' : ''}><span>${name}</span></label>`;
        });
    }

    // --- Card Creation Functions ---
    function createCardHeader(icon, title, schoolName = null, isWarning = false) {
        const schoolNameHTML = schoolName ? `<span class="category-card-school-name">${schoolName}</span>` : '';
        const warningIconHTML = isWarning ? `<i class="fas fa-exclamation-triangle warning-icon"></i>` : '';
        return `<div class="card-header"><i class="fas fa-${icon}"></i><h2 class="card-title">${title}</h2>${schoolNameHTML}${warningIconHTML}</div>`;
    }

    function createBasicInfoCard(school) {
        return `<div class="data-card wide-card">
                    <img src="${school.headerImage}" alt="${school.schoolName}" class="school-hero-image">
                    <div class="card-body">
                        <h2 class="school-name-title"><span>${school.schoolName}</span> ${school.schoolType || ''}</h2>
                        <div class="school-info-columns">
                            <div class="contact-info">
                                <h3 class="section-title">Details</h3>
                                <div class="info-item"><i class="fas fa-map-marker-alt"></i><span>${school.address}</span></div>
                                <div class="info-item"><i class="fas fa-phone"></i><span>${school.phone}</span></div>
                                <div class="info-item"><i class="fas fa-graduation-cap"></i><span>${school.program}</span></div>
                                <div class="detail-list">${Object.entries(school.details).map(([key, value]) => `<div class="detail-item"><div class="detail-label">${key}</div><div class="detail-value">${value}</div></div>`).join('')}</div>
                            </div>
                            <div class="additions-info">
                                <h3 class="section-title">Additions</h3>
                                <div class="detail-list">${school.additions.map(a => `<div class="detail-item"><div class="detail-label">${a.year}</div><div class="detail-value">${a.size}</div></div>`).join('') || 'No additions on record.'}</div>
                            </div>
                        </div>
                    </div>
                </div>`;
    }

    function createEnrolmentCard(school, viewMode) {
        const { capacity, current } = school.enrolment;
        const utilization = Math.round((current / capacity) * 100);
        const isOverCapacity = utilization >= 100;
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        const cardClass = isOverCapacity ? 'over-capacity' : '';
        
        setTimeout(() => {
            renderHistoryChart(school);
            renderProjectionChart(school);
            document.querySelectorAll(`.enrolment-card[data-school-id="${school.id}"] .toggle-btn`).forEach(btn => {
                btn.addEventListener('click', function() {
                    const parentCard = this.closest('.enrolment-card');
                    parentCard.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    const viewType = this.dataset.view;
                    parentCard.querySelectorAll('.enrolment-content').forEach(c => c.classList.remove('active'));
                    parentCard.querySelector(`#${viewType}-${school.id}`).classList.add('active');
                });
            });
        }, 10);

        return `<div class="data-card wide-card enrolment-card ${cardClass}" data-school-id="${school.id}">
                    ${createCardHeader('chart-line', 'Enrolment & Capacity', schoolNameForHeader, isOverCapacity)}
                    <div class="card-body">
                        <div class="stats-container">
                            <div class="stat-box"><i class="fas fa-users stat-icon"></i><div class="stat-value">${capacity}</div><div class="stat-label">Classroom Capacity</div></div>
                            <div class="stat-box"><i class="fas fa-user-graduate stat-icon"></i><div class="stat-value">${current}</div><div class="stat-label">Current Enrolment</div></div>
                        </div>
                        <div class="utilization-container">
                            <div class="utilization-percentage">${utilization}%</div>
                            <div class="utilization-label">Utilization</div>
                            <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${Math.min(utilization, 100)}%;"></div></div>
                        </div>
                        <div class="enrolment-toggle">
                            <button class="toggle-btn active" data-view="history">History</button>
                            <button class="toggle-btn" data-view="projection">Projection</button>
                        </div>
                        <div class="enrolment-display-area">
                            <div class="enrolment-content active" id="history-${school.id}"><div class="chart-container"><canvas id="hist-chart-${school.id}"></canvas></div></div>
                            <div class="enrolment-content" id="projection-${school.id}"><div class="projection-chart" id="proj-chart-${school.id}"></div></div>
                        </div>
                        <div class="catchment-info"><h3>Catchment Migration</h3><p class="catchment-rate">${school.catchment.migration}</p><p class="catchment-desc">${school.catchment.description}</p></div>
                    </div>
                </div>`;
    }

    function createSimpleCard(school, viewMode, categoryKey, icon, title) {
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        const data = school[categoryKey];
        const listItems = Array.isArray(data) ? data.map(item => `<li>${item}</li>`).join('') : Object.entries(data).map(([key, value]) => `<li>${key}: ${value === "YES" ? '<span class="yes-badge">YES</span>' : value === "NO" ? '<span class="no-badge">NO</span>' : value}</li>`).join('');
        return `<div class="data-card">${createCardHeader(icon, title, schoolNameForHeader)}<div class="card-body"><ul class="feature-list">${listItems}</ul></div></div>`;
    }

    function createProjectsCard(school, viewMode) {
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        const renderSection = (category) => {
            const sections = [];
            if (category.requested?.length > 0) sections.push(`<div class="project-status-label">Requested:</div><ul class="project-list">${category.requested.map(item => `<li>${item}</li>`).join('')}</ul>`);
            if (category.inProgress?.length > 0) sections.push(`<div class="project-status-label">In Progress:</div><ul class="project-list">${category.inProgress.map(item => `<li>${item}</li>`).join('')}</ul>`);
            if (category.completed?.length > 0) sections.push(`<div class="project-status-label">Completed:</div><ul class="project-list">${category.completed.map(item => `<li>${item}</li>`).join('')}</ul>`);
            return sections.length > 0 ? sections.join('') : '<p>No projects listed</p>';
        };
        return `<div class="data-card wide-card">${createCardHeader('hard-hat', 'Capital Projects', schoolNameForHeader)}<div class="card-body"><div class="projects-container"><div class="project-category"><h3>Provincially Funded</h3>${renderSection(school.projects.provincial)}</div><div class="project-category"><h3>Locally Funded</h3>${renderSection(school.projects.local)}</div></div></div></div>`;
    }

    // --- Chart Rendering ---
    function renderHistoryChart(school) {
        const canvasId = `hist-chart-${school.id}`;
        if (!document.getElementById(canvasId)) return;
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
        chartInstances[canvasId] = new Chart(document.getElementById(canvasId).getContext('2d'), {
            type: 'line',
            data: { labels: school.enrolment.history.labels, datasets: [{ label: 'Enrolment', data: school.enrolment.history.values, borderColor: 'var(--primary-blue)', backgroundColor: 'rgba(58, 93, 143, 0.1)', fill: true, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'top', formatter: (value) => value, font: { weight: 'bold' }, color: '#444' } } }
        });
    }

    function renderProjectionChart(school) {
        const chartContainer = document.getElementById(`proj-chart-${school.id}`);
        if (!chartContainer) return;
        const { projection } = school.enrolment;
        const allValues = Object.values(projection).map(v => parseInt(v.split('-')[1] || v));
        const maxValue = Math.max(...allValues) * 1.1;
        chartContainer.innerHTML = Object.entries(projection).map(([year, value]) => {
            const barValue = parseInt(value.split('-')[0]);
            const barWidth = (barValue / maxValue) * 100;
            return `<div class="projection-row"><div class="projection-year">${year}</div><div class="projection-bar-container"><div class="projection-bar" style="width: ${barWidth}%"></div></div><div class="projection-value">${value}</div></div>`;
        }).join('');
    }

    // --- Main View Logic ---
    async function updateView(isInitialLoad = false) {
        // Use the global 'motion' object provided by the script tag
        const { animate, stagger } = motion;

        const cards = document.querySelectorAll('.data-card');
        if (cards.length > 0) {
            await animate(cards, { y: 20, opacity: 0 }, { duration: 0.3 }).finished;
        }
        
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
        cardGrid.innerHTML = ''; 
        const viewMode = document.querySelector('input[name="view-mode"]:checked').value;

        if (viewMode === 'school') {
            const selectedSchoolId = document.querySelector('input[name="school-filter"]:checked').value;
            const school = schoolData[selectedSchoolId];
            mainTitle.textContent = school.schoolName;
            cardGrid.innerHTML = [ createBasicInfoCard(school), createEnrolmentCard(school, viewMode), createSimpleCard(school, viewMode, 'building', 'cogs', 'Building Systems'), createSimpleCard(school, viewMode, 'playground', 'basketball-ball', 'Playground'), createSimpleCard(school, viewMode, 'transportation', 'bus', 'Transportation'), createSimpleCard(school, viewMode, 'accessibility', 'universal-access', 'Accessibility'), createSimpleCard(school, viewMode, 'childcare', 'child', 'Childcare'), createProjectsCard(school, viewMode) ].join('');
        } else {
            const selectedCategoryId = document.querySelector('input[name="category-filter"]:checked').value;
            mainTitle.textContent = categories[selectedCategoryId];
            Object.values(schoolData).forEach(school => {
                let cardHTML = '';
                switch(selectedCategoryId) {
                    case 'basic': cardHTML = createBasicInfoCard(school); break;
                    case 'enrolment': cardHTML = createEnrolmentCard(school, viewMode); break;
                    case 'building': cardHTML = createSimpleCard(school, viewMode, 'building', 'cogs', 'Building Systems'); break;
                    case 'playground': cardHTML = createSimpleCard(school, viewMode, 'playground', 'basketball-ball', 'Playground'); break;
                    case 'transportation': cardHTML = createSimpleCard(school, viewMode, 'transportation', 'bus', 'Transportation'); break;
                    case 'accessibility': cardHTML = createSimpleCard(school, viewMode, 'accessibility', 'universal-access', 'Accessibility'); break;
                    case 'childcare': cardHTML = createSimpleCard(school, viewMode, 'childcare', 'child', 'Childcare'); break;
                    case 'projects': cardHTML = createProjectsCard(school, viewMode); break;
                }
                cardGrid.innerHTML += cardHTML;
            });
        }
        
        // Animate new cards in
        const newCards = document.querySelectorAll('.data-card');
        if (newCards.length > 0) {
            animate(newCards, { y: [20, 0], opacity: [0, 1] }, { duration: 0.5, delay: isInitialLoad ? stagger(0.075) : 0 });
        }

        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `Data updated ${firstSchool.meta.updated}`;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        viewToggle.addEventListener('change', () => {
            const viewMode = document.querySelector('input[name="view-mode"]:checked').value;
            schoolListSection.style.display = viewMode === 'school' ? 'block' : 'none';
            categoryListSection.style.display = viewMode === 'category' ? 'block' : 'none';
            updateView();
        });
        schoolList.addEventListener('change', updateView);
        categoryList.addEventListener('change', updateView);
        
        function toggleSidebar() {
            const isOpen = sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('visible', isOpen);
        }
        sidebarToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    initializeApp();
});
