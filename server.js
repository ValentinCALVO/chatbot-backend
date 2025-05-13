import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚡ Fake users RH
const fakeUsers = [
  { id: '1', email: 'valentin.calvo@lyon.fr', password: '1234', service: 'Direction' },
  { id: '2', email: 'axelle.coatan@lyon.fr', password: '1234', service: 'Direction' },
  { id: '3', email: 'manon.latapie@lyon.fr', password: '1234', service: 'Direction' },
  { id: '2', email: 'perrine.moerman@lyon.fr', password: '1234', service: 'Direction' }
];

// 🔐 Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = fakeUsers.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ user: { id: user.id, email: user.email, service: user.service } });
  } else {
    res.status(401).json({ error: "Identifiants incorrects" });
  }
});

// 💬 Historique (fictif pour le moment)
app.get('/history/:userId', (req, res) => {
  const messages = []; // aucun message préchargé
  res.json({ messages });
});

// 🤖 Chat principal
app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  const userId = req.body.userId;

  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?";

  if (/entretien|rdv|recruteur|face à face|oral/.test(message)) {
    reply = "Préparez-vous à parler de vos expériences concrètes, informez-vous sur la Métropole de Lyon...";
  } else if (/cv|curriculum/.test(message)) {
    reply = "Un bon CV dans la fonction publique doit être clair, précis...";
  } else if (/lettre|motivation/.test(message)) {
    reply = "Votre lettre doit expliquer pourquoi vous souhaitez rejoindre la Métropole de Lyon...";
  } else if (/congé|absence|rtt|maladie/.test(message)) {
    reply = "La gestion des congés se fait selon les règles de la fonction publique...";
  } else if (/poste|offre|emploi|recrute|recrutement|vacance/.test(message)) {
    reply = "Consultez nos offres sur https://www.grandlyon.com.";
  }

  res.json({ reply });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
