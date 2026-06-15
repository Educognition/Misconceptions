# Cyber-Classroom: Misconception Explorer

An ultra-modern, interactive, and modular single-page web application designed to track, investigate, and debunk **64 verified misconceptions** across four key learning pillars: Human Biology, Physics/Astronomy, Zoology, and History.

Developed as a highly production-ready curriculum utility, it utilizes a custom retro cybernetic command console interface to engage learners and fit seamless integration hooks for learning platforms.

---

## 📂 Codebase Architecture

The application is split into four distinct, modular files to isolate concerns:

1. **`data.json`**: Independent data payload containing the 64 misconception entries. Fits this exact schema:
   ```json
   {
     "id": 1,
     "category": "Human Biology & Medicine",
     "title": "The 10% Brain Myth",
     "icon": "fa-dna",
     "myth": "The belief that humans only utilize a small fraction of their brain matter.",
     "origin": "Common cultural misunderstanding and sensory illusion.",
     "science": "Neuroimaging (fMRI) shows that virtually 100% of the brain is active across a 24-hour cycle..."
   }
   ```
2. **`styles.css`**: Design system configuration containing custom styling properties, CRT grid filters, scanline scrolling keyframes, custom terminal cursor elements, and hard-edged geometrical parameters (all rounded corners are strictly prohibited).
3. **`app.js`**: Reactivity driver that loads the JSON payload, manages user text queries, filters by category/completion state, persists progress data locally using `SessionStorage`, and operates the interactive canvas particle background.
4. **`index.html`**: Semantic page templates, linking stylesheet, script, and Tailwind CSS + FontAwesome CDNs.

---

## 🛠️ Local Development & Testing

Since the application fetches `data.json` asynchronously, modern web browsers will block local file access due to **CORS (Cross-Origin Resource Sharing)** restrictions if the file is opened directly (`file://` protocol). 

To test the application locally, run a lightweight web server in the project directory.

### Options to Run Locally:

* **Using Python** (Available by default on most developer environments):
  ```bash
  # Python 3
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000` in your web browser.

* **Using Node.js / NPM** (if installed):
  ```bash
  npm install -g local-server
  local-server
  ```

* **Using VS Code Extension**:
  Install the **Live Server** extension, open the directory, and click **"Go Live"** in the status bar.

---

## 🌐 GitHub Pages Deployment

The codebase is optimized for seamless deployment on GitHub Pages without requiring compile-time build steps:

1. **Initialize Git & Push**:
   Create a new repository on GitHub. Initialize git locally in the workspace folder and push the files:
   ```bash
   git init
   git add .
   git commit -m "Initialize Cyber-Classroom explorer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   git push -u origin main
   ```
2. **Configure Pages**:
   * Navigate to your repository page on GitHub.
   * Go to **Settings** -> **Pages** (in the sidebar).
   * Under **Build and deployment**, set the source branch to `main` and folder to `/ (root)`.
   * Click **Save**.
3. **Access Live App**:
   GitHub will deploy your site to `https://YOUR_USERNAME.github.io/REPO_NAME/` within a few minutes.

---

## 🔌 LMS Integration & Telemetry Callbacks

The logic layer in `app.js` exposes two clean, predefined callback hook points designed to bind the application into a Learning Management System (LMS) or telemetry database:

### 1. `onIconClick(misconceptionId)`
Fired when a user clicks the category icon button inside a card:
```javascript
function onIconClick(misconceptionId) {
  // Replace with custom code to report interaction to an LMS
  console.log(`LMS Event: Clicked icon for item ${misconceptionId}`);
}
```

### 2. `onProgressUpdate(count)`
Fired whenever a misconception is marked as "Debunked" or "Restored", updating the learner's total count:
```javascript
function onProgressUpdate(count) {
  // Replace with custom code to update completion data in the database
  console.log(`LMS Event: Completed count updated to ${count}`);
}
```
Session data is persisted automatically in `SessionStorage` to preserve progress during single browser sessions.
