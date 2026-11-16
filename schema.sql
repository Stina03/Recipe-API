-- Create the recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author_id TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty TEXT,
  cuisine TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  image_url TEXT,
  average_rating NUMERIC(3, 2)
);

-- Insert 3 sample recipes
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
) VALUES
(
  '11111111-1111-4111-8111-111111111111',
  'Classic Spaghetti Carbonara',
  'A quick and creamy Italian pasta dish made with eggs, cheese, pancetta, and black pepper.',
  'chef_mario',
  10,
  15,
  4,
  'Easy',
  'Italian',
  '["400g spaghetti", "150g pancetta or guanciale", "3 large eggs", "100g grated Pecorino Romano", "Freshly ground black pepper"]'::jsonb,
  '["Boil pasta in salted water until al dente.", "Crisp the diced pancetta in a skillet over medium heat.", "Whisk eggs, grated cheese, and black pepper in a bowl.", "Toss hot drained pasta with the pancetta, remove from heat, and quickly stir in the egg mixture using pasta water to create a silky sauce."]'::jsonb,
  'https://example.com/images/carbonara.jpg',
  4.8
),
(
  '22222222-2222-4222-8222-222222222222',
  'Vegetable Stir-Fry',
  'Crisp, colorful vegetables tossed in a savory garlic-ginger soy glaze.',
  'chef_lin',
  15,
  10,
  2,
  'Easy',
  'Chinese',
  '["1 head broccoli, cut into florets", "1 red bell pepper, sliced", "1 cup snap peas", "2 cloves garlic, minced", "1 tbsp fresh ginger, grated", "3 tbsp soy sauce", "1 tbsp sesame oil"]'::jsonb,
  '["Heat sesame oil in a wok over high heat.", "Add garlic and ginger and stir-fry for 30 seconds.", "Add broccoli, bell pepper, and snap peas and toss for 5-7 minutes until tender-crisp.", "Pour in soy sauce, toss well to coat, and serve immediately over steamed rice."]'::jsonb,
  'https://example.com/images/vegetable-stir-fry.jpg',
  4.5
),
(
  '33333333-3333-4333-8333-333333333333',
  'Homemade Chocolate Souffle',
  'Light, airy baked chocolate dessert with a rich molten center.',
  'chef_claire',
  25,
  15,
  4,
  'Hard',
  'French',
  '["120g dark chocolate", "3 tbsp unsalted butter", "3 large eggs, separated", "50g granulated sugar", "1 pinch salt", "Cocoa powder for dusting"]'::jsonb,
  '["Preheat oven to 190C (375F) and butter 4 ramekins, dusting them with cocoa powder.", "Melt dark chocolate and butter together over a double boiler, then cool slightly and whisk in egg yolks.", "Whip egg whites and salt to soft peaks, gradually adding sugar until stiff peaks form.", "Gently fold egg whites into the chocolate base, divide into ramekins, and bake for 13-15 minutes without opening the oven door."]'::jsonb,
  'https://example.com/images/chocolate-souffle.jpg',
  4.9
);
