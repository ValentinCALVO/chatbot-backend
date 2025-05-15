const userContexts = {}; // Mémoire conversationnelle par utilisateur
const followUpMap = {};  // Suivi de sujet en attente

import reglement from './data/reglement.json' assert { type: "json" };
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import fs from "fs-extra";
import multer from "multer";
import { v4 as uuid } from "uuid";

const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚡ Fake users RH
const fakeUsers = [
  { id: '1', email: 'valentin.calvo@lyon.fr', password: '1234', service: 'Direction' },
  { id: '2', email: 'axelle.coatan@lyon.fr', password: '1234', service: 'Direction' },
  { id: '3', email: 'manon.latapie@lyon.fr', password: '1234', service: 'Direction' },
  { id: '4', email: 'perrine.moerman@lyon.fr', password: '1234', service: 'Direction' }
];

const messageHistory = {};

// 🔍 Fonction pour détecter les articles pertinents du règlement
function chercherArticlesPertinents(message) {
  const motsCle = message.toLowerCase().split(/[\s,;.!?]+/);
  const resultats = [];

  for (const section of reglement) {
    for (const article of section.articles) {
      if (article.questions.some(q => motsCle.includes(q))) {
        resultats.push({
          ...article,
          titre_section: section.titre
        });
      }
    }
  }
  return resultats;
}

// 📄 Fonction pour rechercher une question similaire
function findSimilarContext(userId, currentMsg) {
  const context = userContexts[userId] || [];
  return context.find(entry =>
    entry.sender === "user" &&
    currentMsg.includes(entry.text.slice(0, 15)) &&
    currentMsg.length > 20
  );
}

// 🤖 Chat principal
app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  const userId = req.body.userId;
  if (!userContexts[userId]) userContexts[userId] = [];

  // 🧠 1. Réponse règlementaire enrichie
  const articlesTrouves = chercherArticlesPertinents(message);

  if (articlesTrouves.length > 0) {
    const rich = {
      type: "rich",
      className: "bubble",
      elements: articlesTrouves.map(a => ({
        type: "accordion",
        title: `${a.emoji} ${a.titre_section} – ${a.sous_titre}`,
        content: `${a.resume}\n\n${a.texte_complet}\n📄 Source : ${a.reference}`
      }))
    };

    if (!messageHistory[userId]) messageHistory[userId] = [];
    messageHistory[userId].push({ sender: "user", text: message });
    messageHistory[userId].push({ sender: "bot", text: `[Réponse réglementaire : ${articlesTrouves.map(a => a.reference).join(", ")}]` });

    userContexts[userId].push({ sender: 'user', text: message });
    userContexts[userId].push({ sender: 'bot', text: `[Réponse règlementaire]` });

    return res.json({ reply: "", rich });
  }

  // 🔁 Réponses conditionnelles aux suivis "oui / non"
  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?";

  if (followUpMap[userId] && /^(oui|yes|ok|d'accord)$/.test(message.trim())) {
    const topic = followUpMap[userId];
    followUpMap[userId] = null;

    if (topic === "cv") {
      reply = "Voici des conseils plus poussés sur le CV : utilisez des verbes d'action, structurez votre document clairement, adaptez-le à l’offre.";
    } else if (topic === "formation") {
      reply = "Voici les types de formations proposées à la Métropole : numérique, management, développement personnel...";
    } else {
      reply = "Très bien, approfondissons ce sujet ensemble.";
    }

    messageHistory[userId] = messageHistory[userId] || [];
    messageHistory[userId].push({ sender: 'user', text: message });
    messageHistory[userId].push({ sender: 'bot', text: reply });

    userContexts[userId].push({ sender: 'user', text: message });
    userContexts[userId].push({ sender: 'bot', text: reply });
    return res.json({ reply });
  }

  if (followUpMap[userId] && /^(non|pas maintenant|plus tard)$/.test(message.trim())) {
    followUpMap[userId] = null;
    reply = "Pas de souci. Si vous voulez y revenir plus tard, je suis là.";
    return res.json({ reply });
  }

  // 🧠 Réponses prédéfinies
  if (/cv|curriculum/.test(message)) {
    reply = "Un bon CV doit être clair, concis et valoriser vos expériences pertinentes...";
  } else if (/lettre|motivation/.test(message)) {
    reply = "Votre lettre doit exprimer votre intérêt pour les missions publiques...";
  } else if (/formation|se former/.test(message)) {
    reply = "62% des agents sont formés chaque année...";
  } else if (/emploi|poste|offre|vacance/.test(message)) {
    reply = "Toutes nos offres sont disponibles sur : https://www.grandlyon.com/services/nous-rejoindre/nos-offres-demploi.html";
  } else if (/entretien|oral|recruteur|face à face/.test(message)) {
    reply = "Préparez des exemples concrets, informez-vous sur la Métropole...";
  } else if (/mobilité/.test(message)) {
    reply = "Nos conseillers RH accompagnent les agents souhaitant évoluer...";
  } else if (/bonjour|salut/.test(message)) {
    reply = "Bonjour ! Comment puis-je vous aider concernant la Métropole de Lyon ?";
  } else if (/merci/.test(message)) {
    reply = "Avec plaisir ! N'hésitez pas à poser d'autres questions.";
  } else if (/au revoir|à bientôt/.test(message)) {
    reply = "Au revoir et à bientôt !";
  } else if (/télétravail/.test(message)) {
    reply = "Jusqu’à 2 jours de télétravail par semaine sont possibles...";
  } else if (/candidature|recrutement|postuler|embauche/.test(message)) {
    reply = "Vous pouvez postuler via https://www.grandlyon.com...";
  } else if (/concours/.test(message)) {
    reply = "Le concours est la voie classique pour devenir fonctionnaire territorial...";
  } else if (/job d'été|emploi saisonnier/.test(message)) {
    reply = "Des jobs d’été sont disponibles...";
  }

  // 🧠 Historique + similarité
  if (!messageHistory[userId]) messageHistory[userId] = [];
  messageHistory[userId].push({ sender: 'user', text: message });
  messageHistory[userId].push({ sender: 'bot', text: reply });

  const similar = findSimilarContext(userId, message);
  if (similar) {
    reply += `\n🔁 Vous m'aviez posé une question similaire plus tôt. Souhaitez-vous que nous approfondissions ce sujet ?`;

    if (similar.text.includes("cv")) followUpMap[userId] = "cv";
    else if (similar.text.includes("formation")) followUpMap[userId] = "formation";
  }

  userContexts[userId].push({ sender: 'user', text: message });
  userContexts[userId].push({ sender: 'bot', text: reply });
  if (userContexts[userId].length > 20) {
    userContexts[userId] = userContexts[userId].slice(-20);
  }

  res.json({ reply });
});

// 📁 Autres routes existantes (inchangées)
app.get('/cv/:userId', async (req, res) => {
  const profiles = await fs.readJson("./data/profiles.json");
  const user = profiles.find(p => p.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "Profil non trouvé" });
  res.json(user.cv || {});
});

app.post("/cv/:userId", async (req, res) => {
  const profiles = await fs.readJson("./data/profiles.json");
  const user = profiles.find(p => p.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  user.cv = req.body;
  await fs.writeJson("./data/profiles.json", profiles, { spaces: 2 });
  res.json({ success: true });
});

app.get("/applications/:userId", async (req, res) => {
  const apps = await fs.readJson("./data/applications.json");
  const userApps = apps.filter(a => a.userId === req.params.userId);
  res.json(userApps);
});

app.post("/applications", async (req, res) => {
  const apps = await fs.readJson("./data/applications.json");
  const newApp = { id: uuid(), ...req.body };
  apps.push(newApp);
  await fs.writeJson("./data/applications.json", apps, { spaces: 2 });
  res.json({ success: true });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const { userId } = req.body;
  const documents = await fs.readJson("./data/documents.json");

  documents.push({
    id: uuid(),
    userId,
    filename: req.file.originalname,
    path: req.file.path,
    uploadedAt: new Date().toISOString()
  });

  await fs.writeJson("./data/documents.json", documents, { spaces: 2 });
  res.json({ success: true });
});

app.get('/appointments/slots', async (req, res) => {
  const appointments = await fs.readJson('./data/appointments.json');
  const takenSlots = appointments.map(a => a.slot);

  const allSlots = [
    "2025-05-15T09:00", "2025-05-15T10:00", "2025-05-15T11:00",
    "2025-05-16T14:00", "2025-05-16T15:00", "2025-05-17T10:00"
  ];

  const available = allSlots.filter(slot => !takenSlots.includes(slot));
  res.json({ slots: available });
});

app.post('/appointments/book', async (req, res) => {
  const { userId, slot } = req.body;
  if (!userId || !slot) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const appointments = await fs.readJson('./data/appointments.json');
  if (appointments.find(a => a.slot === slot)) {
    return res.status(400).json({ error: "Créneau déjà pris" });
  }

  appointments.push({ id: uuid(), userId, slot });
  await fs.writeJson('./data/appointments.json', appointments, { spaces: 2 });

  console.log(`📧 Email simulé à l'utilisateur ${userId} : Confirmation du RDV le ${slot}`);
  res.json({ success: true, message: `RDV réservé pour ${slot}` });
});

app.get('/appointments/:userId', async (req, res) => {
  const { userId } = req.params;
  const appointments = await fs.readJson('./data/appointments.json');
  const userAppointments = appointments.filter(a => a.userId === userId);
  res.json(userAppointments);
});

app.delete('/appointments/:appointmentId', async (req, res) => {
  const appointmentId = req.params.appointmentId;
  let appointments = await fs.readJson('./data/appointments.json');
  const initialLength = appointments.length;

  appointments = appointments.filter(a => a.id !== appointmentId);
  await fs.writeJson('./data/appointments.json', appointments, { spaces: 2 });

  if (appointments.length === initialLength) {
    return res.status(404).json({ error: "Rendez-vous non trouvé" });
  }

  res.json({ success: true });
});

app.get('/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const messages = messageHistory[userId] || [];
  res.json({ messages });
});

// 🚀 Serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
