/* --- Root Variables & Global Styles --- */
:root {
    --bg-color: #f4f7fa; --card-bg: #ffffff; --sidebar-bg: #ffffff;
    --primary-blue: #3a5d8f; --accent-red: #d9534f; --text-color: #333;
    --text-light: #6c757d; --border-color: #e9ecef; --shadow-color: rgba(0, 0, 0, 0.05);
    --font-title: 'Montserrat', sans-serif; --font-body: 'Poppins', sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-body); background-color: var(--bg-color); color: var(--text-color); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

/* --- Main Layout --- */
.dashboard-layout { display: flex; }
.sidebar { width: 260px; background-color: var(--sidebar-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; height: 100vh; position: fixed; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 200; }
.main-content { flex-grow: 1; margin-left: 260px; display: flex; flex-direction: column; transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

/* --- Header --- */
.main-header { display: flex; align-items: center; padding: 1rem 1.5rem; background-color: var(--card-bg); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 100; }
#main-title { font-family: var(--font-title); font-size: 1.5rem; margin-left: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-toolbar { margin-left: auto; }
.header-logo { height: 40px; }

/* --- Sidebar --- */
.sidebar-header { display: flex; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color); }
.logo-icon { font-size: 1.8rem; color: var(--primary-blue); margin-right: 0.75rem; }
.sidebar-header h2 { font-family: var(--font-title); font-size: 1.2rem; }
.sidebar-nav { flex-grow: 1; overflow-y: auto; padding: 1.5rem 0; }
.nav-section { padding: 0 1.5rem; margin-bottom: 1.5rem; }
.nav-title { font-family: var(--font-title); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); margin-bottom: 1rem; }
.view-toggle { display: flex; background-color: var(--bg-color); border-radius: 8px; padding: 4px; border: 1px solid var(--border-color); }
.view-toggle label { flex: 1; }
.view-toggle input { display: none; }
.view-toggle span { display: block; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: center; transition: all 0.2s ease-out; color: var(--text-light); }
.view-toggle input:not(:checked) + span:hover { background-color: #e2e8f0; color: var(--text-color); }
.view-toggle input:checked + span { background-color: var(--card-bg); color: var(--primary-blue); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.filter-list label { display: flex; align-items: center; padding: 0.6rem 0.75rem; margin-left: -0.75rem; cursor: pointer; border-radius: 6px; transition: background-color 0.2s ease; }
.filter-list label:hover { background-color: var(--bg-color); }
.filter-list input { margin-right: 0.75rem; accent-color: var(--primary-blue); }
.sidebar-footer { padding: 1.5rem; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-light); }

/* --- Card Grid & States --- */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); grid-auto-rows: min-content; gap: 1.5rem; padding: 1.5rem; }
.data-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 4px 6px var(--shadow-color); overflow: hidden; transition: all 0.2s ease-in-out; opacity: 0; animation: fadeIn 0.5s ease forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
.data-card:hover { transform: translateY(-5px); box-shadow: 0 8px 12px rgba(0, 0, 0, 0.08); }
.data-card.wide-card { grid-column: span 2; }
.data-card.over-capacity { background-color: #fff6f6; border-color: #f5c6cb; }

.card-header { display: flex; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); }
.card-header i { color: var(--primary-blue); margin-right: 0.75rem; font-size: 1.1rem; }
.card-title { font-family: var(--font-title); font-size: 1.1rem; }
.category-card-school-name { font-family: var(--font-body); font-size: 0.9rem; font-weight: 500; color: var(--text-light); margin-left: auto; }
.warning-icon { font-size: 1.2rem; color: var(--accent-red); margin-left: 0.5rem; animation: pulseWarning 2s infinite; }
@keyframes pulseWarning { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.card-body { padding: 1.25rem; }

/* --- Specific Card Styles --- */
.school-hero-image { width: 100%; height: 180px; object-fit: cover; }
.school-info-columns { display: flex; gap: 2rem; }
.contact-info, .additions-info { flex: 1; }
.school-name-title { font-family: var(--font-title); font-size: 1.6rem; margin-bottom: 1rem; }
.school-name-title span { color: var(--primary-blue); }
.section-title { font-family: var(--font-title); font-size: 1rem; margin-bottom: 0.5rem; border-bottom: 2px solid var(--primary-blue); padding-bottom: 0.25rem; }
.info-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--text-light); }
.info-item i { width: 16px; text-align: center; color: var(--primary-blue); }
.detail-list { margin-top: 1rem; }
.detail-item { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.detail-item:last-child { border-bottom: none; }
.detail-label { font-weight: 500; }
.detail-value { color: var(--text-light); }

.stats-container { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.stat-box { flex: 1; background: var(--bg-color); padding: 1rem; border-radius: 8px; text-align: center; }
.stat-icon { font-size: 1.5rem; color: var(--primary-blue); margin-bottom: 0.5rem; }
.stat-value { font-size: 1.5rem; font-weight: 600; }
.stat-label { font-size: 0.9rem; color: var(--text-light); }

.utilization-container { text-align: center; margin-bottom: 1.5rem; }
.utilization-percentage { font-family: var(--font-title); font-size: 2.5rem; font-weight: 700; color: var(--primary-blue); line-height: 1; }
.utilization-label { font-weight: 600; font-size: 1rem; margin-top: 0.25rem; margin-bottom: 0.75rem; display: block; }
.progress-bar-container { width: 100%; height: 10px; background-color: var(--border-color); border-radius: 5px; overflow: hidden; }
.progress-bar-fill { height: 100%; background-color: var(--primary-blue); border-radius: 5px; transition: width 0.5s ease-in-out; }
.over-capacity .progress-bar-fill { background-color: var(--accent-red); }
.over-capacity .utilization-percentage { color: var(--accent-red); }

.enrolment-toggle { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
.toggle-btn { background: none; border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; }
.toggle-btn.active { background: var(--primary-blue); color: white; border-color: var(--primary-blue); }
.enrolment-display-area { min-height: 280px; position: relative; }
.enrolment-content { display: none; }
.enrolment-content.active { display: block; }
.chart-container { position: relative; height: 250px; }
.projection-chart { padding-top: 1rem; }
.projection-row { display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem; }
.projection-year { width: 80px; text-align: right; margin-right: 1rem; color: var(--text-light); }
.projection-bar-container { flex-grow: 1; height: 20px; background: var(--bg-color); border-radius: 4px; }
.projection-bar { height: 100%; background: var(--primary-blue); border-radius: 4px; transition: width 0.5s ease-in-out; }
.projection-value { width: 80px; margin-left: 1rem; font-weight: 500; }

.catchment-info { margin-top: 1.5rem; text-align: center; background: var(--bg-color); padding: 1rem; border-radius: 8px; }
.catchment-info h3 { font-family: var(--font-title); font-size: 1rem; margin-bottom: 0.5rem; }
.catchment-rate { font-size: 1.5rem; font-weight: 600; color: var(--primary-blue); }
.catchment-desc { font-size: 0.8rem; color: var(--text-light); }

.feature-list { list-style: none; }
.feature-list li { padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.feature-list li:last-child { border-bottom: none; }
.yes-badge, .no-badge { padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; color: white; }
.yes-badge { background: #28a745; }
.no-badge { background: var(--accent-red); }

.projects-container { display: flex; gap: 2rem; }
.project-category { flex: 1; }
.project-category h3 { font-family: var(--font-title); font-size: 1.1rem; margin-bottom: 1rem; }
.project-status-label { font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem; }
.project-list { list-style-position: inside; padding-left: 0.5rem; }
.project-list li { font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem; }

/* --- Responsive & Mobile --- */
.sidebar-toggle-btn { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-color); }
.sidebar-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 199; opacity: 0; transition: opacity 0.3s ease; }
.sidebar-overlay.visible { display: block; opacity: 1; }
@media (max-width: 1200px) { .data-card.wide-card { grid-column: span 1; } }
@media (max-width: 992px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0; }
    .sidebar-toggle-btn { display: block; }
    .projects-container { flex-direction: column; }
}
@media (max-width: 768px) { .school-info-columns { flex-direction: column; } }
@media (max-width: 576px) { .card-grid { grid-template-columns: 1fr; } #main-title { font-size: 1.2rem; } }
