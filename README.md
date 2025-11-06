# School Profile Dashboard

A dynamic, single-page web application designed to display detailed profiles for various schools. The dashboard is data-driven, loading all school information from a central JSON file, and features a clean, responsive interface for easy viewing on any device.

## Live Demo

You can view the live version of this project on GitHub Pages:  
**https://<Your-Username>.github.io/school-dashboard/**

*(Note: Replace `<Your-Username>` with your actual GitHub username after deploying.)*

---

## Features

- **Data-Driven:** All school information is loaded dynamically from `data/schools.json`, making updates easy and centralized.
- **Two Viewing Modes:** Users can browse by individual **School** or by **Category** (e.g., view the "Playground" card for all schools at once).
- **Interactive Charts:** Utilizes Chart.js to render historical and projected enrollment data.
- **Responsive Design:** The layout is fully responsive and optimized for desktop, tablet, and mobile viewing.
- **Progressive Web App (PWA):** Installable on mobile and desktop devices with offline support.
- **Simple & Scalable:** Built with standard HTML, CSS, and JavaScript, with no complex frameworks required.
- **Secure by Design:** Implements industry-standard security practices including CSP, security headers, and SRI for external resources.

---

## File Structure

The project is organized with a simple and intuitive file structure, keeping source code, data, and static assets separate.

```
school-dashboard/
│
├── data/
│   └── schools.json      # All school data lives here. Edit this file to update content.
│
├── public/
│   ├── manifest.json     # PWA manifest file
│   ├── service-worker.js # Service worker for offline support
│   ├── archwood.jpg      # Image assets for each school.
│   ├── beliveau.jpg
│   ├── CJS.jpg
│   └── dakota.jpg
│
├── app.js                # Main application logic (fetching data, rendering cards, event handling).
├── index.html            # The main HTML file for the application.
├── styles.css            # All visual styling and responsive design rules.
│
├── .gitignore            # Tells Git which files to ignore (e.g., system files).
└── README.md             # This documentation file.
```

---

## How to Run Locally

Because the app uses `fetch()` to load the `schools.json` file, you need to run it from a local web server. Simply opening `index.html` in your browser from your file system will not work.

**The Easiest Method (Using VS Code Live Server):**
1.  Open the project folder in Visual Studio Code.
2.  Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3.  Right-click on `index.html` and choose **"Open with Live Server"**.

**Alternative Method (Using Terminal):**
If you have Node.js installed, you can use the `serve` package for a quick, no-config server.
1.  Open your terminal in the project's root directory.
2.  Run the command: `npx serve`
3.  Open your browser to the local address provided (usually `http://localhost:3000`).

---

## How to Deploy to GitHub Pages

This project structure is optimized for easy deployment to GitHub Pages.

1.  Push your code to your GitHub repository.
2.  In your repository, go to the **Settings** tab.
3.  In the left sidebar, click on **Pages**.
4.  Under "Build and deployment," set the **Source** to **Deploy from a branch**.
5.  Under "Branch," ensure the branch is set to `main` and the folder is set to `/ (root)`.
6.  Click **Save**.

After a minute or two, your site will be live at the URL provided on that page.

---

## Progressive Web App (PWA)

This application is a fully functional Progressive Web App that can be installed on mobile devices and desktop computers.

### PWA Features

- **Installable:** Users can install the app on their home screen (mobile) or desktop for quick access
- **Offline Support:** The app works offline after the first visit, caching essential assets
- **App-like Experience:** Runs in standalone mode without browser UI when installed
- **Fast Loading:** Uses service worker caching for instant loading on repeat visits

### Installing the App

**On Mobile (Android/iOS):**
1. Open the dashboard in your mobile browser
2. Look for the "Add to Home Screen" or "Install" prompt
3. Follow the prompts to install
4. The app will appear as an icon on your home screen

**On Desktop (Chrome/Edge):**
1. Look for the install icon in the address bar
2. Click "Install" to add the app to your desktop
3. The app will open in its own window

### Technical Implementation

- **Manifest:** `/public/manifest.json` defines app metadata, icons, and display mode
- **Service Worker:** `/public/service-worker.js` handles offline caching and asset management
- **Caching Strategy:** Cache-first with network fallback for optimal performance

### GitHub Pages Sub-Path Deployment

**Important for Contributors:** This app is configured for GitHub Pages deployment at `/school-dashboard/`. The following files use this base path for proper PWA functionality:

1. **`index.html`**: Contains `<base href="/school-dashboard/">` tag for proper asset resolution
2. **`public/manifest.json`**: Has `start_url` and `scope` set to `/school-dashboard/`
3. **`public/service-worker.js`**: Uses `BASE_PATH = '/school-dashboard'` for caching URLs
4. **Service Worker Registration**: Explicitly sets scope to `/school-dashboard/`

**When modifying PWA assets or paths:**
- All asset links in HTML are relative (thanks to the `<base>` tag)
- Service worker caches must include the base path prefix
- Manifest URLs must be absolute with the base path
- Test both browser and home screen PWA launches to ensure no 404 errors

**For custom domain or root deployment:**
- Change `<base href>` in `index.html` to `/` or your custom domain
- Update `BASE_PATH` in `service-worker.js` to `/`
- Update `start_url` and `scope` in `manifest.json` to `/`
- Update icon paths in `manifest.json` accordingly

---

## Security

This application implements comprehensive security measures to protect users and data:

- **Content Security Policy (CSP)** - Prevents XSS and code injection attacks
- **Security Headers** - Includes X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, and more
- **Subresource Integrity (SRI)** - Verifies external resources haven't been tampered with
- **Input Sanitization** - All user inputs are validated and sanitized
- **Secure API Key Management** - API keys properly separated with security documentation

For detailed security information, deployment guidelines, and production hardening steps, see:
- [SECURITY.md](SECURITY.md) - Comprehensive security documentation
- [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) - Summary of all security enhancements

**Security Status:** ✅ CodeQL scan passed with 0 vulnerabilities
