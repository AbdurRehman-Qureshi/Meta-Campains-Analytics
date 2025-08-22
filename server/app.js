const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(require('cors')());

app.get('/api/meta-insights', async (req, res) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: process.env.ACCESS_TOKEN,
          date_preset: 'last_7d',
          level: 'campaign',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));