import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  let reply = "Je suis désolé, je n'ai pas compris votre question. Pouvez-vous la reformuler ?";

  // ENTRETIEN
  if (/entretien|rdv|recruteur|face à face|oral/.test(message)) {
    reply = "Préparez-vous à parler de vos expériences concrètes, informez-vous sur la Métropole de Lyon, soyez clair, ponctuel et structuré dans vos réponses.";
  }

  // CV
  else if (/cv|curriculum/.test(message)) {
    reply = "Un bon CV dans la fonction publique doit être clair, précis et valoriser vos expériences en lien avec le poste visé.";
  }

  // LETTRE DE MOTIVATION
  else if (/lettre|motivation/.test(message)) {
    reply = "Votre lettre doit expliquer pourquoi vous souhaitez rejoindre la Métropole de Lyon et ce que vous pouvez apporter au service public local.";
  }

  // CONGÉS / ABSENCES
  else if (/congé|absence|rtt|maladie/.test(message)) {
    reply = "La gestion des congés se fait selon les règles de la fonction publique. Vous pouvez consulter le règlement interne ou contacter les RH.";
  }

  // GRILLE / STATUT / FONCTION PUBLIQUE
  else if (/grille|statut|catégorie|indice/.test(message)) {
    reply = "Les statuts et grilles indiciaires sont définis par la fonction publique territoriale. Vous pouvez consulter les documents officiels sur service-public.fr ou demander à un gestionnaire RH.";
  }

  // CARRIÈRE / MOBILITÉ
  else if (/mobilité|carrière|évolution|mutation/.test(message)) {
    reply = "La Métropole de Lyon accompagne la mobilité interne et les évolutions professionnelles via des dispositifs personnalisés.";
  }

  // MÉTIERS / OFFRES / EMPLOI
  else if (/poste|offre|emploi|recrute|recrutement|vacance/.test(message)) {
    reply = "Vous pouvez consulter toutes nos offres sur https://www.grandlyon.com. Nous recrutons sur de nombreux métiers territoriaux.";
  }

  // MÉTIERS SPÉCIFIQUES
  else if (/journaliste/.test(message)) {
    reply = "Le poste de journaliste à la Métropole concerne la rédaction et la diffusion d'informations publiques auprès des citoyens.";
  } else if (/juriste|droit/.test(message)) {
    reply = "Le juriste en droit public intervient sur les aspects légaux des actions menées par la Métropole.";
  } else if (/chef de projet numérique/.test(message)) {
    reply = "Ce métier consiste à développer des services digitaux pour améliorer la relation entre la Métropole et les citoyens.";
  } else if (/chargé.*mobilité/.test(message)) {
    reply = "Ce poste accompagne les agents dans leur évolution professionnelle et les mobilités internes.";
  } else if (/communication interne/.test(message)) {
    reply = "Ce rôle vise à animer les échanges et la cohésion au sein de l'organisation.";
  }

  // COLLECTIVITÉ / SPÉCIFICITÉ
  else if (/collectivité|métropole|lyon|territoriale/.test(message)) {
    reply = "La Métropole de Lyon est une collectivité territoriale unique, exerçant les compétences d’un département et d’une métropole.";
  }

  // ÉGALITÉ / DIVERSITÉ
  else if (/égalité|diversité|inclusion/.test(message)) {
    reply = "La Métropole de Lyon est engagée pour l'égalité professionnelle et territoriale, ainsi que pour la diversité dans ses équipes.";
  }

  // IMAGE / FONCTION PUBLIQUE
  else if (/image|valeur|service public/.test(message)) {
    reply = "La Métropole de Lyon valorise l’image RH en promouvant l’éthique, la transparence et le sens du service public.";
  }

  res.json({ reply });
});

app.listen(3000, () => {
  console.log("✅ Serveur enrichi prêt sur http://localhost:3000");
});
