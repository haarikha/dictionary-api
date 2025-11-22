// index.js
// 1) Load Express and create an app
const express = require('express');
const axios = require('axios');
const app = express();

// 2) Middleware: parse JSON bodies so req.body works for POST/PUT
app.use(express.json());

// 3) A simple in-memory "dictionary" to start — this is temporary storage
let dictionary = [
  { word: "hello", meaning: "a greeting or expression of goodwill" },
  { word: "code", meaning: "instructions for a computer" }
];

// 4) Health-check route (used to verify the server is running)
app.get('/', (req, res) => {
  res.json({ status: "ok", message: "Dictionary API is up" });
});

// 5) Example route: GET /words returns the entire dictionary
app.get('/words', (req, res) => {
  res.json(dictionary);
});

/**
 * GET /define?word=<word>
 * Example: /define?word=apple
 * Returns a clean JSON: { word, partOfSpeech, definition }
 */
app.get('/define', async (req, res) => {
  const q = (req.query.word || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Please provide ?word=your_word' });
  }

  try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
    const apiResp = await axios.get(apiUrl);

    const entry = Array.isArray(apiResp.data) ? apiResp.data[0] : apiResp.data;
    if (!entry) return res.status(404).json({ error: 'No definition found' });

    const meanings = entry.meanings || [];
    const firstMeaning = meanings[0] || null;
    const firstDefObj = firstMeaning && firstMeaning.definitions && firstMeaning.definitions[0] || null;

    const response = {
      word: entry.word || q,
      partOfSpeech: firstMeaning ? firstMeaning.partOfSpeech : null,
      definition: firstDefObj ? firstDefObj.definition : null
    };

    if (!response.definition) {
      return res.status(404).json({ error: 'Definition not found for this word' });
    }

    res.json(response);

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Word not found' });
    }
    console.error('Define route error:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch definition', details: err.message });
  }
});

// 6) Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dictionary API running at http://localhost:${PORT}`);
});
