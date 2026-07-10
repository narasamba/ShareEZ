# ShareEZ 📤

> Drop a file → get a **4-digit code** → anyone can download it within **24 hours**

![ShareEZ Screenshot](https://img.shields.io/badge/Built%20with-React%20%2B%20Express-4CAF50?style=for-the-badge)

---

## ✨ Features

- 🖱️ **Drag & Drop** file upload
- 4️⃣ **4-digit share code** — random, unique per upload
- ⏰ **24-hour auto-expiry** — files deleted automatically
- 📋 **One-click copy** the share code
- 📥 **Download tab** — enter code → preview → download with correct filename
- 🎨 **Light green glassmorphism** UI

---

## 🚀 Run Locally

### 1. Install dependencies
```bash
npm install --prefix server
npm install --prefix client
```

### 2. Start the backend (port 5001)
```bash
node server/index.js
```

### 3. Start the frontend (port 3001)
```bash
npm run dev --prefix client
```

Open **http://localhost:3001**

---

## 🌐 Deploy to Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**

**Build command:** `npm install --prefix server && npm install --prefix client && npm run build --prefix client`  
**Start command:** `node server/index.js`

> ⚠️ Add a **Persistent Disk** (1 GB) mounted at `/opt/render/project/src/server/uploads` so uploaded files survive restarts.

---

## 📁 Project Structure

```
ShareEZ/
├── server/
│   ├── index.js        ← Express API
│   ├── uploads/        ← Stored files (runtime)
│   └── metadata.json   ← Code registry (runtime)
├── client/
│   ├── src/
│   │   ├── App.jsx     ← React app
│   │   └── index.css   ← Light green theme
│   └── vite.config.js
├── render.yaml         ← One-click Render deploy
└── package.json        ← Root scripts
```

---

**Developed by Gayatri**
