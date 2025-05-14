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

// 💬 Historique (fictif pour le moment)
app.get('/history/:userId', (req, res) => {
  const userId = req.params.userId;
const messages = messageHistory[userId] || [];
res.json({ messages });
});

// 🤖 Chat principal
app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  const userId = req.body.userId;

  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?";

  // Politesse
  if (/bonjour|salut/.test(message)) {
    reply = "Bonjour ! Comment puis-je vous aider concernant la Métropole de Lyon ?";
  } else if (/merci/.test(message)) {
    reply = "Avec plaisir ! N'hésitez pas à poser d'autres questions.";
  } else if (/au revoir|à bientôt/.test(message)) {
    reply = "Au revoir et à bientôt !";
  } else if (/ça va|ca va/.test(message)) {
    reply = "Je vais bien, merci ! Et vous, comment puis-je vous aider ?";

  // Recrutement / Processus
  } else if (/candidature|recrutement|postuler|embauche/.test(message)) {
    reply = "Vous pouvez postuler via https://www.grandlyon.com. La procédure comprend : sélection du CV/lettre, entretien(s), tests éventuels, visite médicale, vérification du casier judiciaire, puis embauche officielle.";

  // CV / Lettre de motivation
  } else if (/cv|curriculum/.test(message)) {
    reply = "Un bon CV doit être clair, concis et valoriser vos expériences pertinentes. Privilégiez les expériences en lien avec le service public.";
  } else if (/lettre|motivation/.test(message)) {
    reply = "Votre lettre doit exprimer votre intérêt pour les missions publiques et la Métropole de Lyon. Expliquez pourquoi vous êtes un bon candidat pour le poste.";

  // Entretien
  } else if (/entretien|oral|recruteur|face à face/.test(message)) {
    reply = "Préparez des exemples concrets, informez-vous sur la Métropole, ses missions et ses engagements. Soyez prêt à parler de vos valeurs et de votre parcours.";

  // Offres d'emploi
  } else if (/emploi|poste|offre|vacance/.test(message)) {
    reply = "Toutes nos offres sont disponibles sur : https://www.grandlyon.com/services/nous-rejoindre/nos-offres-demploi.html";

  // Formation / Mobilité
  } else if (/formation|se former/.test(message)) {
    reply = "62% des agents sont formés chaque année. Formations internes variées pour progresser et évoluer professionnellement.";
  } else if (/mobilité/.test(message)) {
    reply = "Nos conseillers RH accompagnent les agents souhaitant changer de poste, construire un nouveau projet ou évoluer.";

  // Conditions de travail / QVT
  } else if (/télétravail/.test(message)) {
    reply = "Jusqu’à 2 jours de télétravail par semaine sont possibles pour les postes éligibles.";
  } else if (/semaine.*4 jours/.test(message)) {
    reply = "Depuis 2023, les agents volontaires peuvent expérimenter la semaine de 4 jours.";
  } else if (/vie pro.*vie perso|équilibre/.test(message)) {
    reply = "La Métropole met en œuvre des dispositifs concrets : charte de déconnexion, parentalité, nomadisme, télétravail, etc.";

  // RSE / Valeurs
  } else if (/valeurs|rse|responsabilité/.test(message)) {
    reply = "Nous agissons pour l’inclusion, la diversité, l’égalité femmes-hommes, le handicap, et l’écologie. En savoir plus sur notre RSE : https://www.grandlyon.com/";

  // Concours / CDD / Contrats
  } else if (/concours/.test(message)) {
    reply = "Le concours est la voie classique pour devenir fonctionnaire territorial. Infos : A+ sur https://www.cnfpt.fr, autres catégories sur https://www.cdg69.fr";
  } else if (/cdd|contrat/.test(message)) {
    reply = "Des CDD sont possibles pour remplacement, besoins ponctuels ou postes spécifiques. Certains débouchent sur titularisation après concours.";

  // Apprentissage / Job d'été
  } else if (/apprentissage|alternance/.test(message)) {
    reply = "Oui, la Métropole propose des contrats d’apprentissage du CAP au Bac+5, dans +10 domaines. Plus d'infos sur le site officiel.";
  } else if (/job d'été|emploi saisonnier/.test(message)) {
    reply = "Des jobs d’été sont disponibles (propreté, administratif, enfance). Conditions : +18 ans, étudiant, ou suivi par mission locale/RSA/RSJ.";

  // Handicap / RQTH
  } else if (/handicap|rqth/.test(message)) {
    reply = "Les agents en situation de handicap bénéficient d’un accompagnement individualisé, aménagements, aides techniques, titularisation possible sans concours avec RQTH.";

  // Infos générales
  } else if (/communes/.test(message)) {
    reply = "La Métropole regroupe 58 communes.";
  } else if (/habitants/.test(message)) {
    reply = "La Métropole de Lyon compte environ 1,4 million d'habitants.";
  } else if (/métiers/.test(message)) {
    reply = "Plus de 250 métiers différents sont exercés dans la Métropole, dans des domaines variés.";
  } else if (/secteurs|domaines/.test(message)) {
    reply = "Environnement, urbanisme, social, médico-social, RH, numérique, culture, sport, développement économique, mobilité...";

  // Vie au travail / Avantages
  } else if (/restaurant|repas/.test(message)) {
    reply = "Selon les sites, vous bénéficiez de titres-restaurant ou d’un restaurant collectif.";
  } else if (/comité|loisirs/.test(message)) {
    reply = "Vous avez accès à l’offre du COS (culture, loisirs, voyages, billetterie).";
  } else if (/conciergerie/.test(message)) {
    reply = "Des services de conciergerie sont accessibles selon le lieu de travail.";

  // RH / Contact
  } else if (/contact|rh|recrutement/.test(message)) {
    reply = "Vous pouvez contacter le service RH à emploi@grandlyon.com ou envoyer un courrier : Métropole de Lyon - DRH - 20 rue du Lac - CS 33569 - 69505 Lyon Cedex 3";
  }

  // ✅ Ajouter ce bloc ici :
  if (!messageHistory[userId]) {
    messageHistory[userId] = [];
  }
  messageHistory[userId].push({ sender: 'user', text: message });
  messageHistory[userId].push({ sender: 'bot', text: reply });

  res.json({ reply });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
