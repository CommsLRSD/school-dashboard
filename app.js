document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Variables ---
    const cardGrid = document.getElementById('card-grid');
    const schoolSelect = document.getElementById('school-select');
    const categorySelect = document.getElementById('category-select');
    const viewBySchoolBtn = document.getElementById('view-by-school-btn');
    const viewByCategoryBtn = document.getElementById('view-by-category-btn');
    const schoolSelectorGroup = document.getElementById('school-selector-group');
    const categorySelectorGroup = document.getElementById('category-selector-group');
    const footerTimestamp = document.getElementById('footer-timestamp');
    
    let schoolData = {};
    let currentView = 'school';
    let isAnimating = false;
    let chartInstances = {};

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            // CORRECTED PATH: No longer need ../ to go up a directory
            const response = await fetch('data/schools.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            schoolData = await response.json();
            
            populateSchoolSelect();
            setupEventListeners();
            updateView();
            console.log("Dashboard initialized successfully.");
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            cardGrid.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load school data. Please check the console.</p>`;
        }
    }

    // --- UI Population ---
    function populateSchoolSelect() {
        schoolSelect.innerHTML = '';
        Object.keys(schoolData).forEach(schoolId => {
            const school = schoolData[schoolId];
            const option = document.createElement('option');
            option.value = schoolId;
            option.textContent = `${school.schoolName} ${school.schoolType || ''}`.trim();
            schoolSelect.appendChild(option);
        });
    }

    // --- Card Creation Functions ---
    // (These functions are unchanged, but are included for completeness)
    
    function createBasicInfoCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card wide-card';
        card.dataset.id = `${school.id}-basic`;
        
        card.innerHTML = `
            <div class="school-hero-section">
                <img src="${school.headerImage}" alt="${school.schoolName}" class="school-hero-image">
                <div class="school-title-overlay">
                    <h1 class="school-name-title"><span>${school.schoolName}</span> ${school.schoolType}</h1>
                </div>
            </div>
            <div class="card-body">
                <div class="school-info-columns">
                    <div class="contact-info">
                        <div class="info-item"><i class="fas fa-map-marker-alt"></i><span>${school.address}</span></div>
                        <div class="info-item"><i class="fas fa-phone"></i><span>${school.phone}</span></div>
                        <div class="info-item"><i class="fas fa-graduation-cap"></i><span>${school.program}</span></div>
                        <div class="detail-list">${Object.entries(school.details).map(([key, value]) => `<div class="detail-item"><div class="detail-label">${key}</div><div class="detail-value">${value}</div></div>`).join('')}</div>
                    </div>
                    <div class="additions-info">
                        <h3 class="section-title">Additions</h3>
                        ${school.additions.length > 0 ? `<div class="detail-list">${school.additions.map(a => `<div class="detail-item"><div class="detail-label">${a.year}</div><div class="detail-value">${a.size}</div></div>`).join('')}</div>` : '<p>No additions recorded</p>'}
                    </div>
                </div>
            </div>`;
        return card;
    }

    function createEnrollmentCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card wide-card';
        card.dataset.id = `${school.id}-enrollment`;
        const utilization = Math.round((school.enrolment.current / school.enrolment.capacity) * 100);
        
        card.innerHTML = `
            <div class="card-header"><i class="fas fa-chart-line"></i><h2 class="card-title">Enrollment & Capacity</h2></div>
            <div class="card-body">
                <div class="stats-container">
                    <div class="stat-box"><i class="fas fa-users stat-icon"></i><div class="stat-value">${school.enrolment.capacity}</div><div class="stat-label">Classroom Capacity</div></div>
                    <div class="stat-box"><i class="fas fa-user-graduate stat-icon"></i><div class="stat-value">${school.enrolment.current}</div><div class="stat-label">Current Enrollment</div></div>
                </div>
                <div class="gauge-container">
                    <div class="gauge">
                        <div class="gauge-background"></div>
                        <div class="gauge-fill" id="util-gauge-${school.id}"></div>
                        <div class="gauge-center"><div class="gauge-percentage">${utilization}%</div></div>
                    </div>
                    <div class="gauge-label">Utilization</div>
                </div>
                <div class="enrollment-toggle">
                    <button class="toggle-btn active" data-view="projection">Four-year Projection</button>
                    <button class="toggle-btn" data-view="history">Enrollment History</button>
                </div>
                <div class="enrollment-content active" id="projection-${school.id}"><div class="projection-chart" id="proj-chart-${school.id}"></div></div>
                <div class="enrollment-content" id="history-${school.id}"><div class="chart-container"><canvas id="hist-chart-${school.id}"></canvas></div></div>
                <div class="catchment-info"><h3>Catchment Migration</h3><p class="catchment-rate">${school.catchment.migration}</p><p class="catchment-desc">${school.catchment.description}</p></div>
            </div>`;
        
        setTimeout(() => {
            card.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    card.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                    card.querySelectorAll('.enrollment-content').forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    const viewType = this.dataset.view;
                    document.getElementById(`${viewType}-${school.id}`).classList.add('active');
                    if (viewType === 'projection') renderProjectionChart(school); else if (viewType === 'history') renderHistoryChart(school);
                });
            });
            const gaugeElement = document.getElementById(`util-gauge-${school.id}`);
            if (gaugeElement) {
                const utilPercent = Math.min(Math.max(utilization / 100, 0), 1);
                gaugeElement.style.transform = `rotate(${utilPercent * 180}deg)`;
                if (utilization >= 100) gaugeElement.style.backgroundColor = 'var(--accent-color)';
            }
            renderProjectionChart(school);
        }, 0);
        return card;
    }

    function createBuildingSystemsCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.id = `${school.id}-building`;
        card.innerHTML = `<div class="card-header"><i class="fas fa-building"></i><h2 class="card-title">Building Systems</h2></div><div class="card-body"><ul class="feature-list">${Object.entries(school.building).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}</ul></div>`;
        return card;
    }

    function createPlaygroundCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.id = `${school.id}-playground`;
        card.innerHTML = `<div class="card-header"><i class="fas fa-basketball-ball"></i><h2 class="card-title">Playground Info</h2></div><div class="card-body"><ul class="feature-list">${school.playground.map(item => `<li>${item}</li>`).join('')}</ul></div>`;
        return card;
    }

    function createTransportationCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.id = `${school.id}-transportation`;
        card.innerHTML = `<div class="card-header"><i class="fas fa-bus"></i><h2 class="card-title">Transportation</h2></div><div class="card-body"><ul class="feature-list">${Object.entries(school.transportation).map(([key, value]) => `<li>${key}: ${value === "YES" ? '<span class="yes-badge">YES</span>' : value === "NO" ? '<span class="no-badge">NO</span>' : value}</li>`).join('')}</ul></div>`;
        return card;
    }

    function createAccessibilityCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.id = `${school.id}-accessibility`;
        card.innerHTML = `<div class="card-header"><i class="fas fa-universal-access"></i><h2 class="card-title">Accessibility</h2></div><div class="card-body"><ul class="feature-list">${Object.entries(school.accessibility).map(([key, value]) => `<li>${key}: ${value === "YES" ? '<span class="yes-badge">YES</span>' : value === "NO" ? '<span class="no-badge">NO</span>' : value}</li>`).join('')}</ul></div>`;
        return card;
    }

    function createChildcareCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.id = `${school.id}-childcare`;
        card.innerHTML = `<div class="card-header"><i class="fas fa-child"></i><h2 class="card-title">On-site Childcare Spots</h2></div><div class="card-body"><ul class="feature-list">${Object.entries(school.childcare).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}</ul></div>`;
        return card;
    }

    function createProjectsCard(school) {
        const card = document.createElement('div');
        card.className = 'data-card wide-card';
        card.dataset.id = `${school.id}-projects`;
        const renderProjectSection = (category, title) => {
            const sections = [];
            if (category.requested && category.requested.length > 0) sections.push(`<div class="project-status-label">Requested:</div><ul class="project-list">${category.requested.map(item => `<li>${item}</li>`).join('')}</ul>`);
            if (category.inProgress && category.inProgress.length > 0) sections.push(`<div class="project-status-label">In Progress:</div><ul class="project-list">${category.inProgress.map(item => `<li>${item}</li>`).join('')}</ul>`);
            if (category.completed && category.completed.length > 0) sections.push(`<div class="project-status-label">Completed:</div><ul class="project-list">${category.completed.map(item => `<li>${item}</li>`).join('')}</ul>`);
            return `<div class="project-category"><h3>${title}</h3>${sections.length > 0 ? sections.join('') : '<p>No projects listed</p>'}</div>`;
        };
        card.innerHTML = `<div class="card-header"><i class="fas fa-hard-hat"></i><h2 class="card-title">Capital Projects: 2020-2034</h2></div><div class="card-body"><div class="projects-container">${renderProjectSection(school.projects.provincial, "Provincially Funded")}${renderProjectSection(school.projects.local, "Locally Funded")}</div></div>`;
        return card;
    }

    // --- Chart Rendering Functions ---
    function renderProjectionChart(school) {
        const chartContainer = document.getElementById(`proj-chart-${school.id}`);
        if (!chartContainer) return;
        chartContainer.innerHTML = '';
        const { capacity, projection } = school.enrolment;
        const maxValue = Math.max(capacity, ...Object.values(projection).map(v => parseInt(v.split('-')[1] || v))) * 1.1;
        const capacityPosition = (capacity / maxValue) * 100;
        const capacityLineHTML = `<div class="capacity-line-container"><div class="capacity-line" style="left: ${capacityPosition}%"><div class="capacity-label">capacity: ${capacity}</div></div></div>`;
        let rowsHTML = '';
        for (const [year, value] of Object.entries(projection)) {
            const barWidth = (parseInt(value.split('-')[0]) / maxValue) * 100;
            rowsHTML += `<div class="projection-row"><div class="projection-year">${year}</div><div class="projection-bar-container"><div class="projection-bar" style="width: ${barWidth}%"></div></div><div class="projection-value">${value}</div></div>`;
        }
        chartContainer.innerHTML = capacityLineHTML + rowsHTML;
    }

    function renderHistoryChart(school) {
        const canvasId = `hist-chart-${school.id}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
        try {
            const ctx = canvas.getContext('2d');
            chartInstances[canvasId] = new Chart(ctx, {
                type: 'line',
                data: { labels: school.enrolment.history.labels, datasets: [{ label: 'Enrollment', data: school.enrolment.history.values, borderColor: '#3a5d8f', backgroundColor: 'rgba(58, 93, 143, 0.1)', fill: true, tension: 0.3 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
            });
        } catch (err) { console.error('Error creating chart:', err); }
    }

    // --- Main View Logic ---
    function getCardsForSchool(schoolId) {
        const school = schoolData[schoolId];
        if (!school) return [];
        return [createBasicInfoCard(school), createEnrollmentCard(school), createBuildingSystemsCard(school), createPlaygroundCard(school), createTransportationCard(school), createAccessibilityCard(school), createChildcareCard(school), createProjectsCard(school)];
    }

    function getCardsForCategory(categoryId) {
        return Object.values(schoolData).map(school => {
            switch(categoryId) {
                case 'basic': return createBasicInfoCard(school);
                case 'enrollment': return createEnrollmentCard(school);
                case 'building': return createBuildingSystemsCard(school);
                case 'playground': return createPlaygroundCard(school);
                case 'transportation': return createTransportationCard(school);
                case 'accessibility': return createAccessibilityCard(school);
                case 'childcare': return createChildcareCard(school);
                case 'projects': return createProjectsCard(school);
                default: return null;
            }
        }).filter(card => card !== null);
    }
    
    async function updateView() {
        if (isAnimating) return;
        isAnimating = true;
        const existingCards = Array.from(cardGrid.children);
        if (existingCards.length > 0) await animateCards(existingCards, false);
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
        const selectedSchoolId = schoolSelect.value;
        const newCards = currentView === 'school' ? getCardsForSchool(selectedSchoolId) : getCardsForCategory(categorySelect.value);
        cardGrid.innerHTML = '';
        newCards.forEach(card => cardGrid.appendChild(card));
        await animateCards(newCards, true);
        const firstSchoolId = Object.keys(schoolData)[0];
        footerTimestamp.textContent = `Last updated by ${schoolData[firstSchoolId].meta.user} on ${schoolData[firstSchoolId].meta.updated}`;
        isAnimating = false;
    }
    
    function animateCards(cards, isEntering) {
        cards.forEach((card, i) => {
            setTimeout(() => {
                card.style.opacity = isEntering ? 1 : 0;
                card.style.transform = isEntering ? 'translateY(0)' : 'translateY(20px)';
            }, i * 50);
        });
        return new Promise(resolve => setTimeout(resolve, cards.length * 50 + 500));
    }

    function setupEventListeners() {
        viewBySchoolBtn.addEventListener('click', () => { if (currentView !== 'school') { currentView = 'school'; viewBySchoolBtn.classList.add('active'); viewByCategoryBtn.classList.remove('active'); schoolSelectorGroup.style.display = 'flex'; categorySelectorGroup.style.display = 'none'; updateView(); } });
        viewByCategoryBtn.addEventListener('click', () => { if (currentView !== 'category') { currentView = 'category'; viewByCategoryBtn.classList.add('active'); viewBySchoolBtn.classList.remove('active'); categorySelectorGroup.style.display = 'flex'; schoolSelectorGroup.style.display = 'none'; updateView(); } });
        schoolSelect.addEventListener('change', updateView);
        categorySelect.addEventListener('change', updateView);
    }

    initializeApp();
});
