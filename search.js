// School Search Functionality
// Provides case-insensitive and accent-insensitive search for school names

/**
 * Normalizes text by removing accents and converting to lowercase
 * @param {string} text - The text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
    return text
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .toLowerCase(); // Convert to lowercase
}

/**
 * Filters school list based on search query
 * @param {string} searchQuery - The search query from the input
 */
function filterSchools(searchQuery) {
    const schoolList = document.getElementById('school-list');
    const schoolLabels = schoolList.querySelectorAll('label');
    const normalizedQuery = normalizeText(searchQuery);

    schoolLabels.forEach(label => {
        const schoolNameElement = label.querySelector('span');
        if (schoolNameElement) {
            const schoolName = schoolNameElement.textContent;
            const normalizedSchoolName = normalizeText(schoolName);

            // Show or hide based on whether the normalized school name contains the normalized query
            if (normalizedSchoolName.includes(normalizedQuery)) {
                label.style.display = '';
            } else {
                label.style.display = 'none';
            }
        }
    });
}

/**
 * Initializes the school search functionality
 * Should be called after the DOM is loaded and school list is populated
 */
function initializeSchoolSearch() {
    const searchInput = document.getElementById('school-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterSchools(e.target.value);
        });
    }
}

// Export for use in app.js if needed
if (typeof window !== 'undefined') {
    window.initializeSchoolSearch = initializeSchoolSearch;
    window.filterSchools = filterSchools;
    window.normalizeText = normalizeText;
}
