# 🌍 CAZ OS (Community Autonomous Zone)

> **Offline-first, peer-to-peer socio-technical operating system for neighborhood resilience, mutual aid, and direct horizontal self-governance.**

## 📖 About The Project

CAZ OS is built to empower communities by providing digital tools for coordination that don't rely on centralized infrastructure. Whether for organizing mutual aid, coordinating emergency responses, or establishing neighborhood-level governance, CAZ OS is designed to be resilient, offline-capable, and completely horizontal.

### ✨ Key Features
- **Offline-First Architecture**: Works locally and syncs when a connection is available.
- **Peer-to-Peer Networking**: Decentralized communication without central servers.
- **Mutual Aid Coordination**: Tools for matching community needs with local resources.
- **Horizontal Self-Governance**: Decision-making interfaces built for consensus and direct democracy.
- **Interactive Mapping**: Geospatial tools powered by MapLibre for neighborhood visualization.

## 🛠️ Built With

This project is built with modern, performant web technologies:

- **[React 19](https://react.dev/)** - UI Library
- **[Vite](https://vitejs.dev/)** - Build Tool & Development Server
- **[TypeScript](https://www.typescriptlang.org/)** - Static Typing
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first Styling
- **[Framer Motion](https://www.framer.com/motion/)** - Animations
- **[MapLibre GL JS](https://maplibre.org/)** - Interactive Maps
- **[dnd-kit](https://docs.dndkit.com/)** - Drag & Drop Interactions

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need Node.js installed on your machine.
- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/arielchuri/CAZ.git
   ```
2. Navigate to the project directory
   ```sh
   cd CAZ
   ```
3. Install NPM packages
   ```sh
   npm install
   ```

## 💻 Development

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Start Dev Server** | Runs Vite's local dev server with Hot Module Replacement (HMR). Best for daily coding. |
| `npm run build` | **Production Build** | Runs TypeScript checks and bundles the app into `dist/`. |
| `npm run preview` | **Preview Build** | Launches a local web server to preview the `dist/` directory before deployment. |
| `npm run lint` | **Lint Code** | Runs ESLint to check for code quality and style issues. |

## 🌐 Deployment

This project is configured to automatically deploy to **GitHub Pages** using GitHub Actions.

Any code pushed to the `main` branch will trigger the workflow defined in `.github/workflows/deploy.yml`, which builds the project and pushes the output to the `gh-pages` branch. 

To view your live site, ensure that GitHub Pages is enabled in your repository settings (Settings > Pages) and set to serve from the `gh-pages` branch.

---

*Designed for resilience. Built for community.*
