import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/chat", (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous reformuler ?";

  if (/entretien|recruteur|rdv|rendez-vous/.test(userMessage)) {
    reply = "Préparez-vous à parler de vos expériences, soyez ponctuel et montrez votre motivation.";
  } else if (/cv|curriculum/.test(userMessage)) {
    reply = "Un bon CV doit être clair, structuré et adapté au poste visé.";
  } else if (/lettre|motivation/.test(userMessage)) {
    reply = "Une lettre de motivation doit être personnalisée et expliquer pourquoi vous postulez.";
  } else if (/soft skill|compétence relationnelle/.test(userMessage)) {
    reply = "Les soft skills recherchées incluent la communication, l’adaptabilité et le travail en équipe.";
  } else if (/offre|poste|emploi/.test(userMessage)) {
    reply = "Pour postuler à une offre, lisez bien l’annonce et adaptez votre CV et lettre en conséquence.";
  }

  res.json({ reply });
});

app.listen(3000, () => {
  console.log("✅ Serveur simulé prêt sur http://localhost:3000");
});
