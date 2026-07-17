# LRSD School Facilities Plugin

## 1. What this plugin does
This plugin replaces manual `data/schools.json` editing with a WordPress-managed workflow.

It lets authorized staff:
- import the existing school JSON file,
- edit school records in WordPress,
- export a backup JSON file,
- publish school data through a custom REST endpoint used by the dashboard.

## 2. How the system works
1. Import your existing JSON file at **School Facilities > Import/Export**.
2. The plugin stores one school per WordPress record (`lr_school`).
3. Each record keeps:
   - `lrsd_school_id` (stable school ID)
   - `lrsd_school_data` (full school JSON object)
4. The endpoint `/wp-json/lrsd/v1/schools` returns the complete dataset in the same shape as the original JSON.
5. The frontend fetches that endpoint instead of `data/schools.json`.

## 3. Files included
```
lrsd-school-facilities/
├── lrsd-school-facilities.php
├── README.md
├── includes/
│   ├── post-types.php
│   ├── rest-api.php
│   ├── importer.php
│   ├── exporter.php
│   └── helpers.php
├── admin/
│   ├── admin-page.php
│   ├── school-editor.php
│   ├── admin.css
│   └── admin.js
└── assets/
    └── index.php
```

## 4. How to create the plugin ZIP
From the repository root, zip the **folder itself** (not only its contents).

Required ZIP structure:
```
lrsd-school-facilities.zip
└── lrsd-school-facilities/
    ├── lrsd-school-facilities.php
    ├── README.md
    ├── includes/
    ├── admin/
    └── assets/
```

## 5. How to upload the plugin in WordPress
1. In WordPress admin, go to **Plugins > Add Plugin > Upload Plugin**.
2. Choose `lrsd-school-facilities.zip`.
3. Click **Install Now**.

## 6. How to activate the plugin
1. After install, click **Activate Plugin**.
2. Confirm the **School Facilities** menu appears in admin.

## 7. How to import the existing school JSON file
1. Go to **School Facilities > Import/Export**.
2. In **Import School JSON**, upload your existing schools JSON file.
3. Click **Import JSON**.
4. Review the success message showing how many schools were created/updated.

## 8. How to confirm the import worked
1. Go to **School Facilities > All Schools**.
2. Confirm school records appear.
3. Open a school and verify fields plus the **Advanced full school JSON** area.

## 9. How to test the REST API endpoint
1. Open this URL in a browser:
   - `https://your-site.example/wp-json/lrsd/v1/schools`
2. Confirm response includes:
   - top-level `lastUpdated`
   - school records keyed by stable school ID (`archwood`, `beliveau`, etc.)

## 10. How to update or confirm the frontend fetch URL
Frontend now uses:
- `/wp-json/lrsd/v1/schools`

In this repo, the fetch path is in `app.js`.
Confirm it points to the endpoint above.

## 11. How to test the dashboard after switching data sources
1. Load the dashboard page.
2. Open browser DevTools > Network.
3. Confirm request to `/wp-json/lrsd/v1/schools` succeeds (HTTP 200).
4. Confirm cards, charts, and school/category views render normally.
5. Confirm footer `lastUpdated` still shows expected value.

## 12. How to edit a school record
1. Go to **School Facilities > All Schools**.
2. Open a school.
3. Edit common fields in the simple editor section.
4. If needed, edit **Advanced full school JSON**.
5. Click **Update**.

Notes:
- JSON must remain valid.
- Saving updates the post title from `schoolName`.
- Saving updates `lrsd_schools_last_updated` to today (`YYYY-MM-DD`).

## 13. How to export a backup JSON file
1. Go to **School Facilities > Import/Export**.
2. Click **Export JSON**.
3. Downloaded file name format: `schools-export-YYYY-MM-DD.json`.

## 14. How to roll back if something goes wrong
1. Keep a copy of your latest exported JSON backup.
2. If needed, re-import that backup at **School Facilities > Import/Export**.
3. If plugin-related issues continue, deactivate the plugin and temporarily revert frontend fetch to the previous data source.

## 15. Troubleshooting
### plugin upload fails
- Confirm ZIP includes the top-level `lrsd-school-facilities/` folder.
- Confirm PHP files are not blocked by host security policy.

### plugin activation fails
- Check server PHP error logs.
- Ensure no files are missing from the plugin folder.

### School Facilities menu does not appear
- Confirm plugin is active.
- Confirm your user role has admin/editor capabilities.

### import fails
- Confirm file is valid JSON and uses `.json` extension.
- Confirm your user has permissions to import.

### import succeeds but creates zero schools
- Confirm JSON contains school objects keyed by school ID.
- Confirm each object includes an `id` value (or keyed object name can be used as ID).

### REST endpoint returns 404
- Confirm plugin is active.
- Go to **Settings > Permalinks** and click **Save Changes** to refresh rewrite rules.

### REST endpoint returns empty data
- Confirm schools exist in **School Facilities > All Schools**.
- Re-run import and check created/updated counts.

### dashboard still loads old data
- Clear browser cache and service worker cache.
- Confirm frontend fetch path is `/wp-json/lrsd/v1/schools`.

### dashboard is blank after switching to the REST endpoint
- Check browser console/network for JSON or CORS errors.
- Confirm endpoint returns valid JSON with `lastUpdated` and school entries.

### JSON validation error
- Use a JSON validator and correct syntax issues (commas, quotes, braces).
- Re-open the school editor and save with valid JSON.

### permissions issue
- Use an Administrator account for import/export.
- Ensure your role can edit school records.

## 16. Future improvements
- Replace text-area list editing with polished repeatable row controls.
- Add structured UI editors for additions, accessibility, childcare, enrolment history/projection.
- Add optional JSON schema validation for stronger import checks.
- Add audit logging for record changes.

## 17. Card Creator architecture
- **Registry source:** `includes/card-creator.php` (`lrsd_sf_get_card_type_registry()`).
- **Supported creator card types:** `details_list`, `simple_list`, `highlight`, `stat`, `image`.
- **Shared preview renderer:** `/card-renderer.js` (used by frontend and Card Creator iframe preview).
- **Card Creator UI:** `admin/card-creator.php` + `admin/card-creator.js`.
- **Assignment model:**
  - Global cards are stored in option `lrsd_sf_global_custom_cards`.
  - School-specific cards are stored per school in `customCards` under `lrsd_school_data`.
  - Card placement is controlled by each school's `cardOrder` (updated automatically on save/delete).

## 18. Card Creator data flow
1. UI loads registry + icon list + existing cards via `wp_ajax_lrsd_sf_card_creator_load`.
2. Form fields are generated from registry schema, including type-specific defaults/limits.
3. Live preview posts current card payload into an iframe that renders using shared card markup/classes.
4. Save uses `wp_ajax_lrsd_sf_card_creator_save`:
   - validates/sanitizes card data,
   - applies assignment (global or selected schools),
   - updates `cardOrder` safely for placement.
5. Delete uses `wp_ajax_lrsd_sf_card_creator_delete` and removes assignment plus `cardOrder` references.

## 19. Icon registry
- Icon options come from `lrsd_sf_get_card_creator_icon_registry()` in `includes/card-creator.php`.
- The registry starts from known production icon paths and augments from `public/icon/*.svg` when available.
- Only registry icons are accepted by save validation (prevents arbitrary/unsafe icon paths).

## 20. Adding a new card type
1. Add a new schema entry in `lrsd_sf_get_card_type_registry()`:
   - `key`, `label`, `description`,
   - `defaultValues`,
   - `limits` (row count / text length guardrails).
2. Ensure `/card-renderer.js` supports the new `cardType` branch.
3. The editor UI and preview auto-detect new types from the registry (no page rewrite needed).
