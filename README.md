# Recipe REST API

A beginner-friendly REST API for managing recipes, built with **Node.js**, **Express**, and **Neon Postgres** (`@neondatabase/serverless`).

---

## Project Structure

- `src/index.js` — Main Express application with all API routes and validation (exported for Vercel or local use).
- `src/db.js` — Connects to Neon Postgres using `DATABASE_URL` and tagged template SQL queries.
- `local.js` — Starts the server on port `3000` when developing on your computer.
- `schema.sql` — SQL commands to create the `recipes` table and insert 3 sample recipes.
- `.env.example` — Template showing the environment variables you need.
- `.gitignore` — Keeps `node_modules` and `.env` out of Git so secrets are never committed.
- `package.json` — Project settings, dependencies, and the `npm run dev` script.

---

## Step-by-Step Setup

### 1. Prerequisites
Make sure you have:
- **Node.js 22 or newer** installed (`node -v` to check)
- A free **Neon Postgres** account at https://neon.tech

### 2. Install Dependencies
Open your terminal in this project folder and run:

```bash
npm install
```

### 3. Set Up Your Database in Neon
1. Create a new project in the Neon Console.
2. Open the **SQL Editor** in Neon.
3. Copy the entire contents of `schema.sql`, paste it into the SQL Editor, and click **Run**. This creates the `recipes` table and adds 3 sample recipes.

### 4. Configure Your `.env` File
1. Copy `.env.example` to a new file named `.env`:
   - **Windows (PowerShell):** `Copy-Item .env.example .env`
   - **macOS / Linux:** `cp .env.example .env`
2. In your Neon dashboard, copy your database connection string and paste it as the value of `DATABASE_URL` inside `.env`:

```env
DATABASE_URL=postgresql://your_user:your_password@ep-your-endpoint.region.aws.neon.tech/neondb?sslmode=require
PORT=3000
```

### 5. Start the Development Server
Run:

```bash
npm run dev
```

Your server will start at `http://localhost:3000` and automatically restart whenever you edit a file.

---

## API Endpoints

| Method | Endpoint | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Check if the API is running | `200 OK` |
| `GET` | `/recipes` | List all recipes (optional filters: `?cuisine=`, `?difficulty=`, `?author_id=`, `?search=`) | `200 OK` |
| `GET` | `/recipes/:id` | Get a single recipe by its ID | `200 OK` |
| `POST` | `/recipes` | Create a new recipe | `201 Created` |
| `PUT` | `/recipes/:id` | Replace an entire recipe | `200 OK` |
| `PATCH` | `/recipes/:id` | Update specific fields of a recipe | `200 OK` |
| `DELETE` | `/recipes/:id` | Delete a recipe | `204 No Content` |

---

## Example Requests

### Check Health
```bash
curl http://localhost:3000/health
```

### Get All Recipes (or Filter by Cuisine / Difficulty)
```bash
curl http://localhost:3000/recipes
curl "http://localhost:3000/recipes?cuisine=Italian&difficulty=Easy"
```

### Create a Recipe (`POST /recipes`)
```bash
curl -X POST http://localhost:3000/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Avocado Toast",
    "description": "Quick toasted bread topped with mashed seasoned avocado.",
    "author_id": "chef_sam",
    "prep_time_minutes": 5,
    "cook_time_minutes": 3,
    "servings": 1,
    "difficulty": "Easy",
    "cuisine": "American",
    "ingredients": ["2 slices sourdough bread", "1 ripe avocado", "Salt, pepper, and chili flakes"],
    "instructions": ["Toast the bread slices.", "Mash the avocado with salt and pepper.", "Spread on toast and sprinkle chili flakes."],
    "image_url": "https://example.com/images/avocado-toast.jpg",
    "average_rating": 4.7
  }'
```

### Partially Update a Recipe (`PATCH /recipes/:id`)
```bash
curl -X PATCH http://localhost:3000/recipes/11111111-1111-4111-8111-111111111111 \
  -H "Content-Type: application/json" \
  -d '{ "servings": 6, "average_rating": 4.9 }'
```

### Delete a Recipe (`DELETE /recipes/:id`)
```bash
curl -X DELETE http://localhost:3000/recipes/11111111-1111-4111-8111-111111111111
```
