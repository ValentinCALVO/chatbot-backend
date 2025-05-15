const userContexts = {}; // Mémoire conversationnelle par utilisateur

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
  { id: '4', email: 'testeur', password: 'PPA', service: 'Testeur' }
];

// 💾 Historique des messages par utilisateur
const messageHistory = {};

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

app.get("/cv/:userId", async (req, res) => {
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

// 📅 Créneaux disponibles
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

// 📅 Réservation de créneau
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

// 📅 Obtenir les rendez-vous réservés d'un utilisateur
app.get('/appointments/:userId', async (req, res) => {
  const { userId } = req.params;
  const appointments = await fs.readJson('./data/appointments.json');
  const userAppointments = appointments.filter(a => a.userId === userId);
  res.json(userAppointments);
});

// ❌ Annuler un rendez-vous
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

// 💬 Historique (fictif pour le moment)
app.get('/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const messages = messageHistory[userId] || [];
  res.json({ messages });
});

// 🤖 Chat principal
function findSimilarContext(userId, currentMsg) {
  const context = userContexts[userId] || [];
  return context.find(entry =>
    entry.sender === "user" &&
    currentMsg.includes(entry.text.slice(0, 15)) &&
    currentMsg.length > 20
  );
}

app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  const userId = req.body.userId;
  if (!userContexts[userId]) userContexts[userId] = [];

  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?";

  // Réponses simples
  if (/bonjour|salut/.test(message)) reply = "Bonjour ! Comment puis-je vous aider concernant la Métropole de Lyon ?";
  else if (/merci/.test(message)) reply = "Avec plaisir ! N'hésitez pas à poser d'autres questions.";
  else if (/au revoir|à bientôt/.test(message)) reply = "Au revoir et à bientôt !";
  else if (/ça va|ca va/.test(message)) reply = "Je vais bien, merci ! Et vous, comment puis-je vous aider ?";
  else if (/candidature|recrutement|postuler|embauche/.test(message)) reply = "Vous pouvez postuler via https://www.grandlyon.com...";
  else if (/cv|curriculum/.test(message)) reply = "Un bon CV doit être clair, concis et valoriser vos expériences pertinentes...";
  else if (/lettre|motivation/.test(message)) reply = "Votre lettre doit exprimer votre intérêt pour les missions publiques...";
  else if (/entretien|oral|recruteur|face à face/.test(message)) reply = "Préparez des exemples concrets, informez-vous sur la Métropole...";
  else if (/emploi|poste|offre|vacance/.test(message)) reply = "Toutes nos offres sont disponibles sur : https://www.grandlyon.com/services/nous-rejoindre/nos-offres-demploi.html";
  else if (/formation|se former/.test(message)) reply = "62% des agents sont formés chaque année...";
  else if (/mobilité/.test(message)) reply = "Nos conseillers RH accompagnent les agents souhaitant évoluer...";
  else if (/télétravail/.test(message)) reply = "Jusqu’à 2 jours de télétravail par semaine sont possibles...";
  else if (/semaine.*4 jours/.test(message)) reply = "Depuis 2023, les agents volontaires peuvent expérimenter la semaine de 4 jours.";
  else if (/vie pro.*vie perso|équilibre/.test(message)) reply = "La Métropole met en œuvre des dispositifs concrets...";
  else if (/valeurs|rse|responsabilité/.test(message)) reply = "Nous agissons pour l’inclusion, la diversité, l’égalité...";
  else if (/concours/.test(message)) reply = "Le concours est la voie classique pour devenir fonctionnaire territorial...";
  else if (/cdd|contrat/.test(message)) reply = "Des CDD sont possibles pour remplacement ou besoins ponctuels...";
  else if (/apprentissage|alternance/.test(message)) reply = "La Métropole propose des contrats d’apprentissage dans +10 domaines.";
  else if (/job d'été|emploi saisonnier/.test(message)) reply = "Des jobs d’été sont disponibles...";
  else if (/handicap|rqth/.test(message)) reply = "Les agents en situation de handicap bénéficient d’un accompagnement...";
  else if (/communes/.test(message)) reply = "La Métropole regroupe 58 communes.";
  else if (/habitants/.test(message)) reply = "La Métropole de Lyon compte environ 1,4 million d'habitants.";
  else if (/métiers/.test(message)) reply = "Plus de 250 métiers différents sont exercés dans la Métropole.";
  else if (/secteurs|domaines/.test(message)) reply = "Environnement, urbanisme, social, médico-social, RH, numérique...";
  else if (/restaurant|repas/.test(message)) reply = "Vous bénéficiez de titres-restaurant ou d’un restaurant collectif.";
  else if (/comité|loisirs/.test(message)) reply = "Vous avez accès à l’offre du COS (culture, loisirs, voyages...).";
  else if (/conciergerie/.test(message)) reply = "Des services de conciergerie sont accessibles selon le lieu de travail.";
  else if (/contact|rh|recrutement/.test(message)) reply = "Vous pouvez contacter le service RH à emploi@grandlyon.com.";

  const similar = findSimilarContext(userId, message);
  if (similar) {
    reply += `\n🔁 Vous m'aviez posé une question similaire plus tôt. Souhaitez-vous que nous approfondissions ce sujet ?`;
  } else if (/^(prendre\s*)?rendez[- ]?vous$|^rdv$|^réserver$|^disponibilités$|^créneaux$/.test(message.trim())) {
    reply = "Voici les créneaux disponibles : [EN ATTENTE DE CHARGEMENT].";
  } else if (/(rendez[- ]?vous|rdv|rencontrer.*rh)/.test(message)) {
    reply = "Souhaitez-vous réserver un créneau avec un conseiller RH ? Tapez **'rdv'** ou **'réserver'** pour continuer.";
  }

  if (!messageHistory[userId]) messageHistory[userId] = [];
  messageHistory[userId].push({ sender: 'user', text: message });

  // 🔍 Recherche dans les articles du règlement
  outer: for (const section of reglement) {
    for (const article of section.articles) {
      if (Array.isArray(article.questions) && article.questions.some(q => message.includes(q))) {
        reply = `${article.emoji} *${section.titre} - ${article.sous_titre}*\n${article.texte_complet}`;
        break outer;
      }
    }
  }

  userContexts[userId].push({ sender: 'user', text: message });
  userContexts[userId].push({ sender: 'bot', text: reply });

  if (userContexts[userId].length > 20) {
    userContexts[userId] = userContexts[userId].slice(-20);
  }

  messageHistory[userId].push({ sender: 'bot', text: reply });

  res.json({ reply });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
