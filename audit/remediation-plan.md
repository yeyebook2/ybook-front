# Plan d'Action & Feuille de Route de Remédiation — YéYéBook Frontend
**Responsable d'Exécution :** Architecte Principal & Équipe de Sous-Agents  
**Principe Directeur :** Sécurité d'abord, intégrité transactionnelle, chirurgie minimale (Ponytail ladder), préservation de l'UI approuvée, preuves par tests reproductibles.

---

## 1. Découpage en Phases Opérationnelles

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE A : Protection de l'Existant & Cartographie des Risques                   │
│   • Vérification stricte de l'état Git non validé (dashboard.api.ts, EpubReader)│
│   • Enregistrement du registre de remédiation                                    │
│   • Vérification de l'absence du skill 'build-it' et utilisation des autres     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE B : Sécurité Bloquante 1 — Validation du Retour Paiement (/checkout/retour)│
│   • Élimination de la confiance dans ?status=approved                            │
│   • Obligation de confirmation serveur via confirmPaymentApi(id)                │
│   • Distinction des états : confirmé, en attente, refusé, erreur réseau          │
│   • Protection du panier : vidage UNIQUEMENT sur succès certifié par le serveur  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE C : Sécurité Bloquante 2 — Sessions et Rafraîchissement Silencieux        │
│   • Intercepteur HTTP centralisé sur les codes 401                               │
│   • File d'attente atomique pour refreshSession() (évite les boucles infinies)   │
│   • Replay transparent des requêtes utilisateur après rafraîchissement           │
│   • Déconnexion propre et redirection en cas de session définitivement expirée   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE D : Chaîne Logistique & Durcissement HTTP                                 │
│   • Résolution des CVEs Next.js et overrides de @xmldom/xmldom                   │
│   • Configuration des en-têtes de sécurité dans next.config.mjs (CSP, HSTS, etc.)│
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE E : Intégrité Métier & Formulaires                                        │
│   • Raccordement complet du champ 'language' (AdminBookEditor, DTOs, API)        │
│   • Ajout du débouncing sur les recherches catalogue et admin                    │
│   • Préservation des statuts de lecture et de la progression ePub                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE F : Architecture & Typage TypeScript                                      │
│   • Élimination ciblée des casts 'as any' critiques                              │
│   • Chargement dynamique (next/dynamic) pour l'espace d'administration           │
│   • Nettoyage des artefacts morts démontrés inutilisés (src/main.tsx)            │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE G : Suite de Tests Approfondie (Vitest)                                   │
│   • Installation et configuration de Vitest                                      │
│   • Écriture des suites de tests unitaires, d'intégration et de sécurité         │
│   • Tests de propriétés et paramétrés sur les calculs sensibles                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE H : Garde-fous CI/CD & Vérification Finale                                 │
│   • Workflow GitHub Actions (.github/workflows/ci.yml)                          │
│   • Revue indépendante par le sous-agent Release Auditor                         │
│   • Actualisation de tous les rapports et formulation du verdict final           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dépendances et Ordre d'Exécution

1. **Phase A -> Phase B :** Aucune modification de code tant que l'existant n'est pas sauvegardé.
2. **Phase B -> Phase C :** La sécurité monétaire passe avant la session.
3. **Phase C -> Phase D :** Le réseau et la session doivent être stabilisés avant la manipulation de packages.
4. **Phase D -> Phase E & F :** Le socle durci permet d'ajuster les formulaires et les composants.
5. **Phase G & H :** Validation systématique par tests et revue indépendante avant toute conclusion.
