
# 🧹 Assets Cleaner – VS Code Extension

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/yourname.assets-cleaner.svg)](https://marketplace.visualstudio.com/items?itemName=yourname.assets-cleaner)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/yourname.assets-cleaner.svg)](https://marketplace.visualstudio.com/items?itemName=yourname.assets-cleaner)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful VS Code extension to **clean unused CSS rules, JavaScript files, and image assets** from your HTML-based projects.  
It analyzes all your project HTML files and safely removes unreferenced files or selectors — helping you keep your project lean and efficient.

---

## ✨ Features

✅ Remove unused:
- ✅ CSS rules (from both external files and internal `<style>` blocks)
- ✅ Entire unused CSS/JS/image files
- ✅ Automatically generate a detailed cleaning report

🔍 Supports:
- Recursive scanning through all folders
- Path resolving for `/`, `./`, `../` relative styles/scripts
- Multi-folder project structure
- HTML pages in nested folders like `/pages`, `/pages/innerpages`, etc.

📁 Outputs:
- A `/removed/` folder with all removed assets
- A JSON report (`assets-cleaner-report.json`) for transparency and review

---

## 📦 Installation

> **Via VS Code Marketplace**  
1. Open **Visual Studio Code**
2. Go to **Extensions** (`Ctrl+Shift+X`)
3. Search for **"Assets Cleaner"**
4. Click **Install**

> **Or from CLI**
```bash
code --install-extension yourname.assets-cleaner
````

---

## ⚙️ Usage

1. Open your web project in VS Code (must have HTML, CSS, JS, and image assets).

2. Open the **Command Palette** (`Ctrl+Shift+P`)

3. Run:

   ```
   Assets Cleaner: Clean Project
   ```

4. The extension will:

   * Analyze all linked HTML, CSS, JS, and image files
   * Move unused files to a `/removed/` directory
   * Create a detailed `assets-cleaner-report.json`

---

## 📁 Project Folder Structure Example

```plaintext
/project-root
├── /assets
│   ├── /images       → PNG, JPG, SVG, etc.
│   ├── /css          → CSS files
│   └── /js           → JavaScript files
├── /pages
│   ├── index.html
│   └── demo.html
├── /pages/innerpages
│   └── demo2.html
├── /removed          ← Generated after cleaning
│   ├── css/
│   ├── js/
│   ├── images/
│   └── assets-cleaner-report.json
```

---

## 🧪 Supported File Types

* HTML: `.html`
* CSS: `.css`
* JavaScript: `.js`
* Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`

---

## 📜 License

This extension is licensed under the [MIT License](LICENSE).

---

## 🙌 Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/awesome-clean`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-clean`)
5. Create a new Pull Request

---

## 📬 Feedback

For bugs, suggestions, or issues, please open a [GitHub Issue](https://github.com/HackRoot1/Assets-Cleaner/issues).

---
