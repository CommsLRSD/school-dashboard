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
- **Simple & Scalable:** Built with standard HTML, CSS, and JavaScript, with no complex frameworks required.

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
