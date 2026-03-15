# InsightAI — Conversational BI Dashboard

> Ask any business question in plain English. Get instant, interactive dashboards powered by AI.

Built for the **Conversational AI for Instant Business Intelligence Dashboards** hackathon challenge.

---

## 📸 Features

- 🗣️ **Natural Language → Dashboard** — Type a plain-English question, get back charts and insights in seconds
- 📊 **Smart Chart Selection** — AI automatically picks the right chart type (bar, line, pie, area, scatter, table)
- 💬 **Conversation History** — Follow-up questions to refine or filter your dashboards
- 📁 **CSV Upload** — Upload your own dataset and immediately start querying it
- 🔒 **SQL Safety** — Only `SELECT` queries are allowed; all dangerous operations are blocked
- 🛡️ **Hallucination Guard** — AI reports when it can't answer rather than making up data
- 🔁 **Self-Healing SQL** — If generated SQL fails, the AI automatically tries to fix it
- 💾 **Export CSV** — Download query results directly from any dashboard
- 🌙 **Dark UI** — Clean, modern dark-mode interface

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Chart.js, Recharts |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| AI | Anthropic Claude (claude-sonnet) |
| Styling | Custom CSS with CSS variables |

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** v18 or higher
- **npm** v8 or higher
- An **Anthropic API key** → get one at [console.anthropic.com](https://console.anthropic.com)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bi-dashboard.git
cd bi-dashboard
```

---

### Step 2 — Install dependencies

```bash
# Install root dev dependencies (concurrently)
npm install

# Install both server and client dependencies
npm run install:all
```

---

### Step 3 — Configure environment variables

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Now open `server/.env` and add your Anthropic API key:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
NODE_ENV=development
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

---

### Step 4 — Seed the demo database

This creates a realistic sales dataset with ~20,000 rows across 4 tables:
- `sales` — individual order transactions
- `products` — product catalog with pricing
- `customers` — customer profiles with region/segment
- `monthly_targets` — regional revenue targets

```bash
npm run seed
```

Expected output:
```
✅ Database initialized
✅ Seeded 18,000+ sales records, 300 customers, products in 7 categories.
✅ Demo database ready!
```

---

### Step 5 — Start the application

```bash
npm run dev
```

This starts both:
- **Backend** at `http://localhost:5000`
- **Frontend** at `http://localhost:3000`

Open your browser at **http://localhost:3000** 🎉

---

## 📂 Project Structure

```
bi-dashboard/
├── package.json               # Root scripts (dev, seed, install:all)
│
├── server/                    # Express backend
│   ├── index.js               # Server entry point
│   ├── package.json
│   ├── .env.example           # Environment template
│   ├── controllers/
│   │   └── aiController.js    # Claude AI integration & SQL generation
│   ├── db/
│   │   ├── database.js        # SQLite init, schema helpers, query executor
│   │   └── seed.js            # Demo dataset generator
│   ├── routes/
│   │   ├── query.js           # POST /api/query  (main NL→dashboard endpoint)
│   │   ├── schema.js          # GET  /api/schema
│   │   ├── upload.js          # POST /api/upload (CSV import)
│   │   └── session.js         # CRUD /api/session
│   └── uploads/               # Temporary CSV upload storage (auto-created)
│
└── client/                    # React frontend
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js             # Root component, state management
        ├── App.css
        ├── index.js
        ├── index.css          # Global styles & CSS variables
        ├── components/
        │   ├── UI/
        │   │   ├── Sidebar.js         # Session list, schema viewer, CSV upload trigger
        │   │   ├── Sidebar.css
        │   │   ├── WelcomeScreen.js   # Landing page with example queries
        │   │   ├── WelcomeScreen.css
        │   │   ├── UploadModal.js     # Drag-and-drop CSV uploader
        │   │   └── UploadModal.css
        │   ├── Chat/
        │   │   ├── ChatPanel.js       # Conversation thread + input
        │   │   ├── ChatPanel.css
        │   │   ├── MessageBubble.js   # Individual message with dashboard link & SQL viewer
        │   │   └── MessageBubble.css
        │   ├── Dashboard/
        │   │   ├── DashboardPanel.js  # Main dashboard with charts grid
        │   │   └── DashboardPanel.css
        │   └── Charts/
        │       ├── ChartRenderer.js   # Auto-selects bar/line/pie/area/scatter
        │       ├── ChartRenderer.css
        │       ├── DataTable.js       # Sortable, paginated data table
        │       └── DataTable.css
        └── utils/
            ├── api.js            # Axios instance
            └── chartUtils.js     # Colors, formatters, Chart.js defaults
```

---

## 💡 Example Queries to Demo

### Simple
```
Show total revenue by region
```

### Moderate
```
Show monthly sales revenue trend for 2023 broken down by region
```

### Complex
```
Compare top 5 product categories by total revenue and profit margin, show as bar chart
```

### Follow-up (Bonus feature)
After any dashboard loads, you can refine it:
```
Now filter this to only show the North and East regions
```
```
Show me the same data but for 2022 instead
```

### CSV Upload
Upload your own `.csv` file via the **Upload CSV** button in the sidebar, then query it:
```
Show me the top 10 rows by [your_column]
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/query` | Convert NL query → dashboard config + data |
| `GET` | `/api/query/history/:sessionId` | Get message history for a session |
| `GET` | `/api/schema` | List all table schemas |
| `POST` | `/api/upload` | Upload a CSV and create a SQLite table |
| `GET` | `/api/upload/datasets` | List uploaded datasets |
| `DELETE` | `/api/upload/:tableName` | Delete an uploaded dataset |
| `GET` | `/api/session` | List all sessions |
| `POST` | `/api/session` | Create a new session |
| `DELETE` | `/api/session/:id` | Delete a session |
| `GET` | `/health` | Health check |

---

## 🧠 AI Architecture

```
User prompt
    │
    ▼
Build system prompt with full DB schema + sample data
    │
    ▼
Claude claude-sonnet → responds with JSON:
  {
    sql: "SELECT ...",
    charts: [{ type, title, xKey, yKey, ... }],
    insights: ["..."],
    title, summary
  }
    │
    ├── SQL validation (SELECT only, no dangerous keywords)
    │
    ▼
Execute SQL against SQLite
    │
    ├── If SQL error → AI self-healing retry
    │
    ▼
Return data + chart config to frontend
    │
    ▼
React renders charts with Chart.js / Recharts
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | Your Anthropic API key |
| `PORT` | ❌ | `5000` | Backend server port |
| `CLIENT_URL` | ❌ | `http://localhost:3000` | Allowed CORS origin |
| `NODE_ENV` | ❌ | `development` | Environment mode |

---

## 🐛 Troubleshooting

**`Cannot find module 'better-sqlite3'`**
```bash
cd server && npm install
```

**`ANTHROPIC_API_KEY is not set`**
Make sure you created `server/.env` from `server/.env.example` and added your key.

**`No data tables found`**
Run the seed script: `npm run seed`

**Port already in use**
Change `PORT` in `server/.env`, and update the `proxy` field in `client/package.json` to match.

**CSV upload failing**
Make sure the CSV uses UTF-8 encoding and the first row contains column headers.

---

## 📋 Evaluation Criteria Coverage

| Criterion | Implementation |
|-----------|---------------|
| ✅ Data Retrieval Accuracy | AI generates SQL with full schema context; self-healing on error |
| ✅ Contextual Chart Selection | AI picks chart type based on data shape (time-series → line, proportion → pie, etc.) |
| ✅ Error Handling | Graceful messages for vague queries; `understood: false` flow for out-of-scope questions |
| ✅ Dashboard Design | Dark theme, responsive grid, smooth animations |
| ✅ Interactivity | Hover tooltips, sortable tables, pagination, zoom via Chart.js |
| ✅ User Flow | Loading states, skeleton UI, toast notifications |
| ✅ Architecture | NL → LLM → SQLite → React pipeline |
| ✅ Prompt Engineering | Structured JSON schema, chart selection rules, SQL safety rules in system prompt |
| ✅ Hallucination Handling | AI reports `understood: false` for unanswerable queries |
| ✅ Follow-up Questions | Full conversation history sent with each request (Bonus) |
| ✅ CSV Upload | Drag-and-drop CSV importer with type inference (Bonus) |

---

## 📄 License

MIT
