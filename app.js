document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Variables ---
    const cardGrid = document.getElementById('card-grid');
    const mainTitle = document.getElementById('main-title');
    const footerTimestamp = document.getElementById('footer-timestamp');

    // Sidebar elements
    const viewToggle = document.getElementById('view-toggle');
    const schoolList = document.getElementById('school-list');
    const categoryList = document.getElementById('category-list');
    const schoolListSection = document.getElementById('school-list-section');
    const categoryListSection = document.getElementById('category-list-section');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    
    let schoolData = {};
    let chartInstances = {};
    const categories = {
        "basic": "Basic Info",
        "enrollment": "Enrollment",
        "building": "Building Systems",
        "playground": "Playground Info",
        "transportation": "Transportation",
        "accessibility": "Accessibility",
        "childcare": "On-site Childcare",
        "projects": "Capital Projects"
    };

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            const response = await fetch('data/schools.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            schoolData = await response.json();
            
            populateSidebarControls();
            setupEventListeners();
            updateView();
            console.log("Dashboard initialized successfully.");
        } catch (error) {
            console.error("Failed to load or initialize school data:", error);
            cardGrid.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load school data. Please check the console.</p>`;
        }
    }

    // --- UI Population ---
    function populateSidebarControls() {
        // Populate schools
        Object.keys(schoolData).forEach((schoolId, index) => {
            const school = schoolData[schoolId];
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="radio" name="school-filter" value="${schoolId}" ${index === 0 ? 'checked' : ''}>
                <span>${school.schoolName}</span>
            `;
            schoolList.appendChild(label);
        });

        // Populate categories
        Object.entries(categories).forEach(([key, name], index) => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="radio" name="category-filter" value="${key}" ${index === 0 ? 'checked' : ''}>
                <span>${name}</span>
            `;
            categoryList.appendChild(label);
        });
    }

    // --- Card Creation Functions (with update for category view) ---
    function createCardHeader(icon, title, schoolName = null) {
        const schoolNameHTML = schoolName ? `<span class="category-card-school-name">${schoolName}</span>` : '';
        return `
            <div class="card-header">
                <i class="fas fa-${icon}"></i>
                <h2 class="card-title">${title}</h2>
                ${schoolNameHTML}
            </div>`;
    }

    function createBasicInfoCard(school, viewMode) {
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        // This is a large card, so we'll just show the school name in the body for category view
        return `<div class="data-card wide-card">
                    ${viewMode === 'category' ? `<div class="card-header"><h2 class="card-title">${school.schoolName}</h2></div>` : ''}
                    <img src="${school.headerImage}" alt="${school.schoolName}" class="school-hero-image">
                    <div class="card-body">...</div>
                </div>`;
    }

    function createEnrollmentCard(school, viewMode) {
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        // ... implementation for enrollment card ...
        return `<div class="data-card wide-card">
                    ${createCardHeader('chart-line', 'Enrollment', schoolNameForHeader)}
                    <div class="card-body">...</div>
                </div>`;
    }
    
    // Example for a simple card
    function createPlaygroundCard(school, viewMode) {
        const schoolNameForHeader = viewMode === 'category' ? school.schoolName : null;
        const listItems = school.playground.map(item => `<li>${item}</li>`).join('');
        return `<div class="data-card">
                    ${createCardHeader('basketball-ball', 'Playground Info', schoolNameForHeader)}
                    <div class="card-body"><ul class="feature-list">${listItems}</ul></div>
                </div>`;
    }

    // --- Main View Logic ---
    async function updateView() {
        // Destroy old charts
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
        
        cardGrid.innerHTML = ''; // Clear grid

        const viewMode = document.querySelector('input[name="view-mode"]:checked').value;

        if (viewMode === 'school') {
            const selectedSchoolId = document.querySelector('input[name="school-filter"]:checked').value;
            const school = schoolData[selectedSchoolId];
            mainTitle.textContent = school.schoolName;
            
            // Add all cards for the selected school
            cardGrid.innerHTML = `
                ${createBasicInfoCard(school, viewMode)}
                ${createEnrollmentCard(school, viewMode)}
                ${createPlaygroundCard(school, viewMode)} 
                <!-- ... other card creation functions for this school ... -->
            `;

        } else if (viewMode === 'category') {
            const selectedCategoryId = document.querySelector('input[name="category-filter"]:checked').value;
            mainTitle.textContent = categories[selectedCategoryId];

            Object.values(schoolData).forEach(school => {
                let cardHTML = '';
                switch(selectedCategoryId) {
                    case 'basic': cardHTML = createBasicInfoCard(school, viewMode); break;
                    case 'enrollment': cardHTML = createEnrollmentCard(school, viewMode); break;
                    case 'playground': cardHTML = createPlaygroundCard(school, viewMode); break;
                    // ... other cases for each category ...
                }
                cardGrid.innerHTML += cardHTML;
            });
        }

        // Update footer
        const firstSchoolId = Object.keys(schoolData)[0];
        if (schoolData[firstSchoolId] && schoolData[firstSchoolId].meta) {
            footerTimestamp.textContent = `Last updated by ${schoolData[firstSchoolId].meta.user} on ${schoolData[firstSchoolId].meta.updated}`;
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // View mode toggle (School vs Category)
        viewToggle.addEventListener('change', () => {
            const viewMode = document.querySelector('input[name="view-mode"]:checked').value;
            if (viewMode === 'school') {
                schoolListSection.style.display = 'block';
                categoryListSection.style.display = 'none';
            } else {
                schoolListSection.style.display = 'none';
                categoryListSection.style.display = 'block';
            }
            updateView();
        });

        // Filter lists
        schoolList.addEventListener('change', updateView);
        categoryList.addEventListener('change', updateView);

        // Mobile sidebar toggle
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- Start the App ---
    initializeApp();
});
