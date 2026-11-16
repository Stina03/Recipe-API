import app from './src/index.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Recipe API is running locally at http://localhost:${PORT}`);
});
