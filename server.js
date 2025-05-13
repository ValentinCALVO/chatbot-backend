import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚡ Fake users RH
const fakeUsers = [
  { id: '1', email: 'valentin.calvo@lyon.fr', password: '1234', service: 'DRH' },
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
  const messages = []; // Aucun message préchargé
  res.json({ messages });
});

// 🤖 Chat enrichi
app.post("/chat", (req, res) => {
  const message = req.body.message?.toLowerCase() || '';
  const userId = req.body.userId;

  let reply = {
    type: "text",
    content: "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?"
  };

  if (/entretien|rdv|recruteur|face à face|oral/.test(message)) {
    reply = {
      type: "rich",
      elements: [
        { type: "text", content: "Voici quelques conseils pour réussir votre entretien RH :" },
        { type: "accordion", title: "Avant l'entretien", content: "Préparez vos expériences clés, renseignez-vous sur la collectivité." },
        { type: "accordion", title: "Pendant l'entretien", content: "Restez clair, concis, et démontrez votre motivation." }
      ]
    };
  } else if (/cv|curriculum/.test(message)) {
    reply = {
      type: "rich",
      elements: [
        { type: "text", content: "Un bon CV dans la fonction publique doit être clair et structuré." },
        { type: "file", text: "Télécharger un exemple de CV", url: "https://example.com/modele-cv.pdf" }
      ]
    };
  } else if (/lettre|motivation/.test(message)) {
    reply = {
      type: "rich",
      elements: [
        { type: "text", content: "Votre lettre doit exprimer votre motivation pour rejoindre la Métropole." },
        { type: "file", text: "Modèle de lettre de motivation", url: "https://example.com/lettre-motivation.pdf" }
      ]
    };
  } else if (/poste|offre|emploi|recrute|recrutement|vacance/.test(message)) {
    reply = {
      type: "rich",
      elements: [
        { type: "text", content: "Voici le lien vers nos offres d'emploi actuelles :" },
        { type: "link", text: "Consulter les offres", url: "https://www.grandlyon.com" }
      ]
    };
  }

  // 🎯 Personnalisation par service
  if (userId === '1') {
    reply.elements?.push({
      type: "text",
      content: "[DRH] N'oubliez pas de consulter l'intranet RH pour les procédures internes."
    });
  } else if (userId === '2') {
    reply.elements?.push({
      type: "text",
      content: "[Direction] Merci de suivre le processus hiérarchique pour toute validation."
    });
  }

  res.json({ reply });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
