document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Variables ---
    const cardGrid = document.getElementById('card-grid');
    const schoolSelect = document.getElementById('school-select');
    const categorySelect = document.getElementById('category-select');
    const viewBySchoolBtn = document.getElementById('view-by-school-btn');
    const viewByCategoryBtn = document.getElementById('view-by-category-btn');
    const schoolSelectorGroup = document.getElementById('school-selector-group');
    const categorySelectorGroup = document.getElementById('category-selector-group');
    
    let schoolData = {};
    let currentView = 'school';
    let isAnimating = false;
    let chartInstances = {};

    // --- Main Initialization ---
    async function initializeApp() {
        try {
            const response = await fetch('../data/schools.json'); // CORRECTED FETCH PATH
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
    // ... (All the createCard functions: createBasicInfoCard, createEnrollmentCard, etc. remain the same as before) ...
    // (For brevity, not re-listing all card creation functions here, as they are unchanged)
    function createCard(id, className, content) {
        const card = document.createElement('div');
        card.className = `data-card ${className || ''}`;
        card.dataset.id = id;
        card.innerHTML = content;
        return card;
    }

    // --- Chart Rendering ---
    // ... (All chart rendering functions: renderProjectionChart, renderHistoryChart remain the same) ...

    // --- Main View Logic ---
    function getCardsForSchool(schoolId) {
        // ... (This function remains the same) ...
    }

    function getCardsForCategory(categoryId) {
        // ... (This function remains the same) ...
    }
    
    async function updateView() {
        if (isAnimating) return;
        isAnimating = true;

        const existingCards = Array.from(cardGrid.children);
        if (existingCards.length > 0) {
            await animateCards(existingCards, false);
        }

        // Destroy old charts to prevent memory leaks
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};

        const selectedSchool = schoolSelect.value;
        const selectedCategory = categorySelect.value;
        const newCardData = currentView === 'school' ? getCardsForSchool(selectedSchool) : getCardsForCategory(selectedCategory);

        cardGrid.innerHTML = '';
        const newElements = newCardData.map(data => {
            const card = createCard(data.id, data.className, data.content);
            cardGrid.appendChild(card);
            return card;
        });

        await animateCards(newElements, true);
        
        // Re-initialize charts for the new view
        if (currentView === 'school') {
            renderProjectionChart(schoolData[selectedSchool]);
            renderHistoryChart(schoolData[selectedSchool]);
        } else if (currentView === 'category' && (selectedCategory === 'enrollment' || selectedCategory === 'enrollment-proj' || selectedCategory === 'enrollment-hist')) {
            Object.values(schoolData).forEach(school => {
                renderProjectionChart(school);
                renderHistoryChart(school);
            });
        }
        
        isAnimating = false;
    }
    
    // --- Animation ---
    function animateCards(cards, isEntering) {
        // ... (This function remains the same) ...
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        viewBySchoolBtn.addEventListener('click', () => { 
            if (currentView !== 'school') { 
                currentView = 'school'; 
                viewBySchoolBtn.classList.add('active');
                viewByCategoryBtn.classList.remove('active');
                schoolSelectorGroup.style.display = 'flex';
                categorySelectorGroup.style.display = 'none';
                updateView();
            } 
        });
        
        viewByCategoryBtn.addEventListener('click', () => { 
            if (currentView !== 'category') { 
                currentView = 'category'; 
                viewByCategoryBtn.classList.add('active');
                viewBySchoolBtn.classList.remove('active');
                categorySelectorGroup.style.display = 'flex';
                schoolSelectorGroup.style.display = 'none';
                updateView();
            } 
        });
        
        schoolSelect.addEventListener('change', updateView);
        categorySelect.addEventListener('change', updateView);
    }

    // --- Start the App ---
    initializeApp();
});
