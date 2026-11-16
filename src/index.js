import crypto from 'node:crypto'
import express from 'express'
import { sql } from './db.js'

const app = express()

// Built-in middleware that parses incoming JSON request bodies into req.body
app.use(express.json())

// Regex to check if an ID is a valid UUID
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Helper that formats a database row so numbers are returned as JavaScript numbers
function formatRecipe(row) {
  return {
    ...row,
    average_rating:
      row.average_rating !== null && row.average_rating !== undefined
        ? Number(row.average_rating)
        : null,
  }
}

// Helper to check if ingredients or instructions have a valid non-empty value
function isNonEmptyJsonOrText(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length > 0
  }
  return false
}

// Validate recipe input for POST (full create), PUT (full replace), or PATCH (partial update)
function validateRecipeInput(body, { isPartial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.'
  }

  const allowedFields = [
    'id',
    'title',
    'description',
    'author_id',
    'prep_time_minutes',
    'cook_time_minutes',
    'servings',
    'difficulty',
    'cuisine',
    'ingredients',
    'instructions',
    'image_url',
    'average_rating',
  ]

  if (isPartial) {
    const providedUpdatableFields = allowedFields.filter(
      (field) => field !== 'id' && body[field] !== undefined,
    )
    if (providedUpdatableFields.length === 0) {
      return 'At least one recipe field must be provided to update.'
    }
  }

  // Validate id if provided
  if (body.id !== undefined) {
    if (typeof body.id !== 'string' || !UUID_REGEX.test(body.id)) {
      return 'Field "id" must be a valid UUID string.'
    }
  }

  // Required fields for full create/replace (or if explicitly included in PATCH)
  if (!isPartial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return 'Field "title" is required and must be a non-empty text string.'
    }
  }

  if (!isPartial || body.ingredients !== undefined) {
    if (!isNonEmptyJsonOrText(body.ingredients)) {
      return 'Field "ingredients" is required and must be a non-empty array, object, or text.'
    }
  }

  if (!isPartial || body.instructions !== undefined) {
    if (!isNonEmptyJsonOrText(body.instructions)) {
      return 'Field "instructions" is required and must be a non-empty array, object, or text.'
    }
  }

  // Optional text fields
  const optionalTextFields = [
    'description',
    'author_id',
    'difficulty',
    'cuisine',
    'image_url',
  ]
  for (const field of optionalTextFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'string'
    ) {
      return `Field "${field}" must be a text string.`
    }
  }

  // Optional non-negative number fields
  const numberFields = ['prep_time_minutes', 'cook_time_minutes', 'servings']
  for (const field of numberFields) {
    if (body[field] !== undefined && body[field] !== null) {
      if (
        typeof body[field] !== 'number' ||
        !Number.isFinite(body[field]) ||
        body[field] < 0
      ) {
        return `Field "${field}" must be a non-negative number.`
      }
    }
  }

  // Optional average_rating field
  if (body.average_rating !== undefined && body.average_rating !== null) {
    if (
      typeof body.average_rating !== 'number' ||
      !Number.isFinite(body.average_rating) ||
      body.average_rating < 0 ||
      body.average_rating > 5
    ) {
      return 'Field "average_rating" must be a number between 0 and 5.'
    }
  }

  return null
}

// Wrapper that catches any unexpected async errors and forwards them to the 500 error handler
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Root route: shows a helpful overview when visiting http://localhost:3000/
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to the Recipe REST API!',
    endpoints: {
      health: 'GET /health',
      listRecipes: 'GET /recipes',
      getRecipe: 'GET /recipes/:id',
      createRecipe: 'POST /recipes',
      replaceRecipe: 'PUT /recipes/:id',
      updateRecipe: 'PATCH /recipes/:id',
      deleteRecipe: 'DELETE /recipes/:id',
    },
  })
})

// 1. GET /health
// Simple check to confirm the API server is running and responsive.
app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Recipe API is running' })
  }),
)

// 2. GET /recipes
// Returns a list of all recipes. You can filter results with optional query parameters
// like ?cuisine=Italian, ?difficulty=Easy, ?author_id=chef_mario, or ?search=pasta.
app.get(
  '/recipes',
  asyncHandler(async (req, res) => {
    const cuisine = req.query.cuisine ?? null
    const difficulty = req.query.difficulty ?? null
    const authorId = req.query.author_id ?? null
    const search = req.query.search ?? null

    const rows = await sql`
      SELECT *
      FROM recipes
      WHERE (${cuisine}::text IS NULL OR LOWER(cuisine) = LOWER(${cuisine}))
        AND (${difficulty}::text IS NULL OR LOWER(difficulty) = LOWER(${difficulty}))
        AND (${authorId}::text IS NULL OR author_id = ${authorId})
        AND (
          ${search}::text IS NULL
          OR title ILIKE '%' || ${search} || '%'
          OR description ILIKE '%' || ${search} || '%'
        )
      ORDER BY title ASC
    `

    res.status(200).json(rows.map(formatRecipe))
  }),
)

// 3. GET /recipes/:id
// Finds and returns a single recipe by its unique ID. Returns 404 if not found.
app.get(
  '/recipes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const rows = await sql`
      SELECT *
      FROM recipes
      WHERE id::text = ${id}
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' })
    }

    res.status(200).json(formatRecipe(rows[0]))
  }),
)

// 4. POST /recipes
// Creates a brand-new recipe in the database and returns it with status 201 (Created).
app.post(
  '/recipes',
  asyncHandler(async (req, res) => {
    const validationError = validateRecipeInput(req.body, { isPartial: false })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const id = req.body.id ?? crypto.randomUUID()
    const title = req.body.title.trim()
    const description = req.body.description ?? null
    const author_id = req.body.author_id ?? null
    const prep_time_minutes = req.body.prep_time_minutes ?? null
    const cook_time_minutes = req.body.cook_time_minutes ?? null
    const servings = req.body.servings ?? null
    const difficulty = req.body.difficulty ?? null
    const cuisine = req.body.cuisine ?? null
    const ingredients = JSON.stringify(req.body.ingredients)
    const instructions = JSON.stringify(req.body.instructions)
    const image_url = req.body.image_url ?? null
    const average_rating = req.body.average_rating ?? null

    const rows = await sql`
      INSERT INTO recipes (
        id,
        title,
        description,
        author_id,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        difficulty,
        cuisine,
        ingredients,
        instructions,
        image_url,
        average_rating
      ) VALUES (
        ${id},
        ${title},
        ${description},
        ${author_id},
        ${prep_time_minutes},
        ${cook_time_minutes},
        ${servings},
        ${difficulty},
        ${cuisine},
        ${ingredients}::jsonb,
        ${instructions}::jsonb,
        ${image_url},
        ${average_rating}
      )
      RETURNING *
    `

    res.status(201).json(formatRecipe(rows[0]))
  }),
)

// 5. PUT /recipes/:id
// Replaces an entire existing recipe with the new data sent in the request body.
app.put(
  '/recipes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const validationError = validateRecipeInput(req.body, { isPartial: false })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const title = req.body.title.trim()
    const description = req.body.description ?? null
    const author_id = req.body.author_id ?? null
    const prep_time_minutes = req.body.prep_time_minutes ?? null
    const cook_time_minutes = req.body.cook_time_minutes ?? null
    const servings = req.body.servings ?? null
    const difficulty = req.body.difficulty ?? null
    const cuisine = req.body.cuisine ?? null
    const ingredients = JSON.stringify(req.body.ingredients)
    const instructions = JSON.stringify(req.body.instructions)
    const image_url = req.body.image_url ?? null
    const average_rating = req.body.average_rating ?? null

    const rows = await sql`
      UPDATE recipes
      SET
        title = ${title},
        description = ${description},
        author_id = ${author_id},
        prep_time_minutes = ${prep_time_minutes},
        cook_time_minutes = ${cook_time_minutes},
        servings = ${servings},
        difficulty = ${difficulty},
        cuisine = ${cuisine},
        ingredients = ${ingredients}::jsonb,
        instructions = ${instructions}::jsonb,
        image_url = ${image_url},
        average_rating = ${average_rating}
      WHERE id::text = ${id}
      RETURNING *
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' })
    }

    res.status(200).json(formatRecipe(rows[0]))
  }),
)

// 6. PATCH /recipes/:id
// Updates only the specific fields provided in the request body, keeping the rest unchanged.
app.patch(
  '/recipes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const validationError = validateRecipeInput(req.body, { isPartial: true })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    // First look up the existing recipe so we can keep any fields the user did not send
    const existingRows = await sql`
      SELECT *
      FROM recipes
      WHERE id::text = ${id}
    `

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' })
    }

    const current = existingRows[0]

    const title =
      req.body.title !== undefined ? req.body.title.trim() : current.title
    const description =
      req.body.description !== undefined
        ? req.body.description
        : current.description
    const author_id =
      req.body.author_id !== undefined ? req.body.author_id : current.author_id
    const prep_time_minutes =
      req.body.prep_time_minutes !== undefined
        ? req.body.prep_time_minutes
        : current.prep_time_minutes
    const cook_time_minutes =
      req.body.cook_time_minutes !== undefined
        ? req.body.cook_time_minutes
        : current.cook_time_minutes
    const servings =
      req.body.servings !== undefined ? req.body.servings : current.servings
    const difficulty =
      req.body.difficulty !== undefined
        ? req.body.difficulty
        : current.difficulty
    const cuisine =
      req.body.cuisine !== undefined ? req.body.cuisine : current.cuisine
    const ingredients = JSON.stringify(
      req.body.ingredients !== undefined
        ? req.body.ingredients
        : current.ingredients,
    )
    const instructions = JSON.stringify(
      req.body.instructions !== undefined
        ? req.body.instructions
        : current.instructions,
    )
    const image_url =
      req.body.image_url !== undefined ? req.body.image_url : current.image_url
    const average_rating =
      req.body.average_rating !== undefined
        ? req.body.average_rating
        : current.average_rating

    const rows = await sql`
      UPDATE recipes
      SET
        title = ${title},
        description = ${description},
        author_id = ${author_id},
        prep_time_minutes = ${prep_time_minutes},
        cook_time_minutes = ${cook_time_minutes},
        servings = ${servings},
        difficulty = ${difficulty},
        cuisine = ${cuisine},
        ingredients = ${ingredients}::jsonb,
        instructions = ${instructions}::jsonb,
        image_url = ${image_url},
        average_rating = ${average_rating}
      WHERE id::text = ${id}
      RETURNING *
    `

    res.status(200).json(formatRecipe(rows[0]))
  }),
)

// 7. DELETE /recipes/:id
// Permanently removes a recipe by its ID and returns status 204 (No Content).
app.delete(
  '/recipes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const rows = await sql`
      DELETE FROM recipes
      WHERE id::text = ${id}
      RETURNING id
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' })
    }

    res.status(204).send()
  }),
)

// Global error handler: catches malformed JSON (400) and unexpected server/database errors (500)
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' })
  }

  // Log the error on the server for debugging, but never send raw database errors to the client
  console.error('Unexpected error:', err)
  res
    .status(500)
    .json({ error: 'An unexpected internal server error occurred.' })
})

export default app
