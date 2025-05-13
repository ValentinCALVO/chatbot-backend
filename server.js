import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: "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" // ⚠️ NE laisse jamais une clé exposée publiquement
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message utilisateur manquant." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant RH spécialisé en recrutement. Réponds de manière concise, professionnelle et utile."
        },
        { role: "user", content: userMessage }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("🔥 Erreur OpenAI:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});

app.listen(3000, () => {
  console.log("✅ Serveur lancé sur http://localhost:3000");
});
