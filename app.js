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
    const levelFilterSelect = document.getElementById('level-filter');
    const fosFilterSelect = document.getElementById('fos-filter');

    let schoolData = {};
    let chartInstances = {};
    let currentViewMode = 'school';
    let selectedSchoolId = '';
    let selectedCategoryId = '';
    let levelFilter = 'all';
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
        "projects_provincial": "Provincially Funded Capital Projects",
        "projects_local": "Locally Funded Capital Projects"
    };

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }
            
            const response = await fetch('schools.json'); 
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
        schoolListContainer.innerHTML = Object.values(schoolData)
            .sort((a, b) => a.schoolName.localeCompare(b.schoolName))
            .map(school => 
                `<a href="#" class="nav-list-item" data-type="school" data-id="${school.id}">${school.schoolName}</a>`
            ).join('');

        const categoryLinks = Object.entries(categories).map(([key, name]) => 
            `<a href="#" class="nav-list-item" data-type="category" data-id="${key}">${name}</a>`
        ).join('');
        const categoryFilterControls = categoryListContainer.querySelector('.filter-controls');
        categoryListContainer.insertBefore(document.createRange().createContextualFragment(categoryLinks), categoryFilterControls.nextSibling.nextSibling);

        const familiesOfSchools = [...new Set(Object.values(schoolData).map(s => s.familyOfSchools))].sort();
        fosFilterSelect.innerHTML += familiesOfSchools.map(fos => `<option value="${fos}">${fos}</option>`).join('');
    }

    // --- Card Creation Functions ---
    const getTileSizeClass = (cardType) => {
        if (['school_header', 'history', 'projection'].includes(cardType)) return 'tile-double-width';
        if (['details', 'accessibility', 'projects_provincial', 'projects_local'].includes(cardType)) return 'tile-double-height';
        return '';
    };

    const createCard = (school, cardType) => {
        const isOverCapacity = school.enrolment.current / school.enrolment.capacity >= 1;
        const capacityClass = isOverCapacity ? 'over-capacity' : '';
        const sizeClass = getTileSizeClass(cardType);

        switch(cardType) {
            case 'school_header': return `<div class="data-card school-header-card ${sizeClass}"><div class="card-body"><img src="${school.headerImage}" alt="${school.schoolName}"><h2 class="school-name-title">${school.schoolName}</h2></div></div>`;
            case 'details': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-info-circle"></i><h2 class="card-title">Details</h2></div><div class="card-body"><ul class="detail-list">${Object.entries({"Address": school.address, "Phone": school.phone, "Program": school.program, ...school.details}).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val}</span></li>`).join('')}</ul></div></div>`;
            case 'additions': return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-plus-square"></i><h2 class="card-title">Additions</h2></div><div class="card-body"><ul class="detail-list">${school.additions && school.additions.length > 0 ? school.additions.map(a => `<li class="detail-item"><span class="detail-label">${a.year}</span><span class="detail-value">${a.size}</span></li>`).join('') : '<li class="detail-item">No additions on record.</li>'}</ul></div></div>`;
            case 'capacity': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-users"></i><h2 class="card-title">Capacity</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.capacity}</div><div class="stat-label">Classroom Capacity</div></div></div>`;
            case 'enrolment': return `<div class="data-card stat-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-user-graduate"></i><h2 class="card-title">Enrolment</h2></div><div class="card-body"><div class="stat-value">${school.enrolment.current}</div><div class="stat-label">Current Enrolment (Sept. 30)</div></div></div>`;
            case 'utilization': return `<div class="data-card utilization-card ${capacityClass} ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-percent"></i><h2 class="card-title">Utilization</h2></div><div class="card-body"><div class="stat-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${Math.min(100, school.enrolment.current / school.enrolment.capacity * 100)}%"></div></div></div></div>`;
            case 'stats': return `<div class="data-card stats-combined-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-chart-pie"></i><h2 class="card-title">Statistics</h2></div><div class="card-body"><div class="stats-grid"><div class="stat-item"><div class="stat-item-label">Capacity</div><div class="stat-item-value">${school.enrolment.capacity}</div></div><div class="stat-item"><div class="stat-item-label">Enrolment</div><div class="stat-item-value">${school.enrolment.current}</div></div><div class="stat-item ${capacityClass}"><div class="stat-item-label">Utilization</div><div class="stat-item-value">${Math.round(school.enrolment.current / school.enrolment.capacity * 100)}%</div><div class="progress-bar-container"><div class="progress-bar-fill ${capacityClass}" style="width: ${Math.min(100, school.enrolment.current / school.enrolment.capacity * 100)}%"></div></div></div></div></div></div>`;
            case 'history': return `<div class="data-card chart-card ${sizeClass}" data-chart="history" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-line"></i><h2 class="card-title">Historical Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;
            case 'projection': return `<div class="data-card chart-card ${sizeClass}" data-chart="projection" data-school-id="${school.id}"><div class="card-header"><i class="card-header-icon fas fa-chart-bar"></i><h2 class="card-title">Projected Enrolment</h2></div><div class="card-body"><div class="chart-container"><canvas></canvas></div></div></div>`;
            default: {
                const icons = { building_systems: 'cogs', accessibility: 'universal-access', playground: 'basketball-ball', transportation: 'bus', childcare: 'child', projects_provincial: 'hard-hat', projects_local: 'hard-hat' };
                const titles = { building_systems: 'Building Systems', accessibility: 'Accessibility', playground: 'Playground', transportation: 'Transportation', childcare: 'Childcare', projects_provincial: 'Provincially Funded Capital Projects', projects_local: 'Locally Funded Capital Projects' };
                
                let data, listItems;
                if (cardType === 'projects_provincial' || cardType === 'projects_local') {
                    const projectType = cardType.split('_')[1];
                    data = school.projects?.[projectType];
                    const statuses = ['requested', 'inProgress', 'completed'];
                    listItems = statuses.flatMap(status => {
                        const items = data?.[status] || [];
                        if (items.length === 0) return [];
                        const statusTitle = status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return [`<li class="detail-item"><span class="detail-label">${statusTitle}</span></li>`, ...items.map(item => `<li class="detail-item" style="padding-left: 1.5rem; justify-content: flex-start; gap: 0.5rem;"><i class="fas fa-check-circle" style="color: var(--primary-green);"></i><span>${item}</span></li>`)]
                    }).join('');
                    if (!listItems) listItems = '<li class="detail-item">No projects to display.</li>';
                } else if (cardType === 'playground') {
                    data = school[cardType];
                    listItems = Array.isArray(data) && data.length > 0 ? data.map(item => `<li class="detail-item">${item}</li>`).join('') : '<li class="detail-item">No data available.</li>';
                } else {
                    data = school[cardType === 'building_systems' ? 'building' : cardType];
                    listItems = data ? Object.entries(data).map(([key, val]) => `<li class="detail-item"><span class="detail-label">${key}</span><span class="detail-value">${val === "YES" ? '<span class="yes-badge">YES</span>' : val === "NO" ? '<span class="no-badge">NO</span>' : val}</span></li>`).join('') : '<li class="detail-item">No data available.</li>';
                }

                return `<div class="data-card list-card ${sizeClass}"><div class="card-header"><i class="card-header-icon fas fa-${icons[cardType]}"></i><h2 class="card-title">${titles[cardType]}</h2></div><div class="card-body"><ul class="detail-list">${listItems}</ul></div></div>`;
            }
        }
    }

    // --- Chart Rendering ---
    const renderChart = (school, type) => {
        if (typeof Chart === 'undefined') {
            const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
            if (chartCard) chartCard.querySelector('.chart-container').innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Charts require Chart.js library</p>';
            return;
        }
        
        const chartCard = document.querySelector(`.chart-card[data-chart="${type}"][data-school-id="${school.id}"]`);
        if (!chartCard) return;
        const ctx = chartCard.querySelector('canvas').getContext('2d');
        const chartId = `${type}-${school.id}`;

        if (chartInstances[chartId]) chartInstances[chartId].destroy();

        const baseOptions = {
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false }, 
                datalabels: typeof ChartDataLabels !== 'undefined' ? { anchor: 'end', align: 'top', font: { weight: 'bold' } } : { display: false } 
            },
            scales: { y: { beginAtZero: true } }
        };

        if (type === 'history') {
            const values = school.enrolment.history.values;
            baseOptions.scales.y.max = Math.ceil(Math.max(...values) * 1.15);
            baseOptions.plugins.datalabels.color = '#BE5247';
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { labels: school.enrolment.history.labels, datasets: [{ data: values, borderColor: '#BE5247', backgroundColor: 'rgba(190, 82, 71, 0.1)', fill: true, tension: 0.3 }] },
                options: baseOptions
            });
        } else if (type === 'projection') {
            const values = Object.values(school.enrolment.projection).map(v => parseInt(v.split('-')[0]));
            baseOptions.scales.y.max = Math.ceil(Math.max(...values) * 1.15);
            baseOptions.plugins.datalabels.color = '#2BA680';
            chartInstances[chartId] = new Chart(ctx, {
                type: 'line', 
                data: { labels: Object.keys(school.enrolment.projection), datasets: [{ data: values, borderColor: '#2BA680', backgroundColor: 'rgba(43, 166, 128, 0.1)', fill: true, tension: 0.3 }] },
                options: baseOptions
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
        document.querySelectorAll('.nav-list-item').forEach(item => {
            const id = item.dataset.type === 'school' ? selectedSchoolId : selectedCategoryId;
            item.classList.toggle('active', item.dataset.id === id);
        });

        if (currentViewMode === 'school') {
            const school = schoolData[selectedSchoolId];
            contentSubtitle.textContent = school.schoolName;
            const cardTypes = ['school_header', 'details', 'additions', 'stats', 'projection', 'history', 'building_systems', 'accessibility', 'playground', 'transportation', 'childcare', 'projects_provincial', 'projects_local'];
            cardGrid.innerHTML = cardTypes.map(type => createCard(school, type)).join('');
            
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                const cardType = cardTypes[index];
                if (cardType !== 'school_header') {
                    const header = card.querySelector('.card-header');
                    if (header) {
                        const navIcon = document.createElement('i');
                        navIcon.className = 'fas fa-external-link-alt card-nav-icon';
                        navIcon.title = 'View all schools for this category';
                        navIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showCustomPopup('Go to category?', e.clientX, e.clientY, () => {
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
            contentSubtitle.textContent = categories[selectedCategoryId];
            
            let filteredSchools = Object.values(schoolData);
            if (levelFilter !== 'all') {
                const level = levelFilter === 'elementary' ? 'Elementary School' : 'High School';
                filteredSchools = filteredSchools.filter(s => s.schoolLevel === level);
            }
            if (fosFilter !== 'all') {
                filteredSchools = filteredSchools.filter(s => s.familyOfSchools === fosFilter);
            }
            
            const cardHTML = filteredSchools
                .sort((a, b) => a.schoolName.localeCompare(b.schoolName))
                .map(school => {
                    const utilizationPercent = Math.round((school.enrolment.current / school.enrolment.capacity) * 100);
                    let warningIcon = '';
                    if (['utilization', 'stats'].includes(selectedCategoryId)) {
                        if (utilizationPercent >= 100) warningIcon = '<i class="fas fa-exclamation-triangle warning-icon warning-icon-red"></i>';
                        else if (utilizationPercent >= 95) warningIcon = '<i class="fas fa-exclamation-circle warning-icon warning-icon-yellow"></i>';
                    }
                    const header = `<div class="card-header"><i class="card-header-icon fas fa-school"></i><h2 class="card-title">${school.schoolName}${warningIcon}</h2></div>`;
                    const fullCard = createCard(school, selectedCategoryId);
                    return fullCard.replace(/<div class="card-header">.*?<\/div>/, header);
                }).join('');
            cardGrid.innerHTML = cardHTML;
            
            document.querySelectorAll('.data-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                const schoolId = filteredSchools.sort((a, b) => a.schoolName.localeCompare(b.schoolName))[index].id;
                const header = card.querySelector('.card-header');
                if (header) {
                    const navIcon = document.createElement('i');
                    navIcon.className = 'fas fa-external-link-alt card-nav-icon';
                    navIcon.title = 'View all categories for this school';
                    navIcon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showCustomPopup('Go to school?', e.clientX, e.clientY, () => {
                            currentViewMode = 'school';
                            selectedSchoolId = schoolId;
                            updateView();
                        });
                    });
                    header.appendChild(navIcon);
                }
            });
            
            if (['history', 'projection'].includes(selectedCategoryId)) {
                filteredSchools.forEach(school => renderChart(school, selectedCategoryId));
            }
        }
        
        const firstSchool = schoolData[Object.keys(schoolData)[0]];
        if (firstSchool?.meta) footerTimestamp.textContent = `Data updated ${firstSchool.meta.updated}`;
    }

    // --- Custom Popup Functions ---
    function showCustomPopup(message, x, y, onConfirm) {
        const popup = document.querySelector('.custom-popup');
        const overlay = document.querySelector('.popup-overlay');
        document.querySelector('.popup-message').textContent = message;
        
        const popupWidth = 250, popupHeight = 120;
        let left = Math.max(10, Math.min(x - (popupWidth / 2), window.innerWidth - popupWidth - 10));
        let top = (y - popupHeight - 10 < 10) ? y + 20 : y - popupHeight - 20;
        
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        
        popup.classList.add('show');
        overlay.classList.add('show');
        
        const confirmBtn = document.querySelector('.popup-button-confirm');
        const cancelBtn = document.querySelector('.popup-button-cancel');

        const cleanup = () => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', cleanup);
            overlay.removeEventListener('click', cleanup);
        };
        const handleConfirm = () => { cleanup(); onConfirm(); };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', cleanup);
        overlay.addEventListener('click', cleanup);
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        navViewSelector.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-view-link'); 
            if (target && target.dataset.view !== currentViewMode) { 
                currentViewMode = target.dataset.view;
                levelFilter = 'all';
                fosFilter = 'all';
                levelFilterSelect.value = 'all';
                fosFilterSelect.value = 'all';
                updateView(); 
            } 
        });

        schoolListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) { selectedSchoolId = target.dataset.id; updateView(); } 
        });

        categoryListContainer.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const target = e.target.closest('.nav-list-item'); 
            if (target) { 
                selectedCategoryId = target.dataset.id;
                levelFilter = 'all';
                fosFilter = 'all';
                levelFilterSelect.value = 'all';
                fosFilterSelect.value = 'all';
                updateView(); 
            } 
        });
        
        levelFilterSelect.addEventListener('change', () => {
            levelFilter = levelFilterSelect.value;
            fosFilter = 'all';
            fosFilterSelect.value = 'all';
            updateView();
        });

        fosFilterSelect.addEventListener('change', () => {
            fosFilter = fosFilterSelect.value;
            levelFilter = 'all';
            levelFilterSelect.value = 'all';
            updateView();
        });
        
        const toggleSidebar = () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible', sidebar.classList.contains('open')); };
        sidebarToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
        sidebarOverlay.addEventListener('click', toggleSidebar);
        document.getElementById('sidebar-close-btn')?.addEventListener('click', toggleSidebar);
    }

    initializeApp();
});
