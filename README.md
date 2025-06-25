
## ⚙️ Tech Stack

- **Frontend**  
  - React 19  
  - Vite (ESNext modules, fast HMR)  
  - TypeScript (strict type safety disabled unused checks)  
  - Tailwind CSS + PostCSS + autoprefixer  
  - Zustand (state management)  
  - Framer Motion (animations)  
  - React Three Fiber & Drei (3D scenes)  
  - Axios (HTTP client)

- **Backend**  
  - Node.js 22.x  
  - Express 5.x  
  - TypeScript (strict disabled, skipLibCheck enabled)  
  - MongoDB (Mongoose ODM)  
  - Helmet (security headers)  
  - CORS (dynamic origin whitelist via env)  
  - Cookie-Parser (HTTP-only auth cookies)  
  - Cron & node-cron (scheduled tasks)  
  - Axios, Puppeteer, Cheerio (external data fetch/scraping)

- **Dev Tools & Config**  
  - ESLint + Prettier (code linting & formatting)  
  - Husky & lint-staged (pre-commit hooks)  
  - ts-node-dev & nodemon (local dev server)  
  - Docker (optional containerization)  
  - GitHub Actions (CI pipeline)  

---

*Environment variable templates are provided in `.env.example` files inside both `client/` and `server/` directories.*
