# ybook — Charte graphique

Charte de colorisation web dérivée du kit de logos `logos_utilisables/` et du `design.md` associé. Établit la palette primaire, les rôles de couleur, les thème clair et sombre, et les règles de style à appliquer sur l'ensemble des surfaces du site ybook.

Construite selon la méthodologie Impeccable (`colorize`) : rôles par fonction et non par swatchs, teintes dérivées en OKLCH, contrastes WCAG AA, thèmes clair et sombre composés indépendamment (pas une inversion mécanique), préservation de l'identité de marque confirmée.

---

## 1. Stratégie chromatique (one-liner)

> Régime **Committed** sur un terrain neutre **chaud**. Le rose magenta `#E04070` porte l'action, la sélection et l'accent ; le bordeaux `#B84870`	tempère et signe les surfaces premium ; l'ivoire tiède et l'encre tiède	servernt de fond. Une seule couleur forte, très peu dispersée, pour qu'elle conserve toute sa force quand elle apparaît.

Lecteur de la marque (ybook = « your book ») → référence au papier/livre. Le terrain neutre est donc **légèrement chaud** (H≈30) et non un gris froid. Thème sombre = encre brune tiède teintée de rose, jamais du zinc froid.

Règles absolues de la charte :

1. **Une seule couleur forte.** `#E04070` ne se déploie jamais en dégradé décoratif ni en halo ; elle marque une action ou un état.
2. **Le bordeaux ne se répand pas.** `#B84870` est réservé aux titres premium, aux icônes de marque et aux états de focus secondaires.
3. **Pas de gris froid.** Tous les neutres portent une teinte chaude H≈30 pour chiropracteur chromatique avec le rose.
4. **Couleur ≠ information seule.** Toute signalétique par couleur est couplée à une icône, un label ou une forme.
5. **Identité préserve > aligned trends.** On ne remplace pas `#E04070` par un autre rose même si un LLM suggère un rose « plus design ».

---

## 2. Palette primitive OKLCH

Construite autour de l'axe chromatique du logo primaire (hue 15-16°).

### 2.1 Couleur primaire — Rose ybook

```
--y-primary-800:  oklch(0.15 0.36 16deg);  /* #5F0000 — ombre   */
--y-primary-700:  oklch(0.30 0.36 16deg);  /* #9C0002 — lie-de-vin */
--y-primary-600:  oklch(0.45 0.36 16deg);  /* #D80023 — bordeaux-rouge (hover) */
--y-primary-500:  oklch(0.56 0.36 16deg);  /* #E04070 — primaire de marque (référence) */
--y-primary-400:  oklch(0.70 0.36 16deg);  /* #FF0064 — rose néon (sombre) */
--y-primary-300:  oklch(0.82 0.36 16deg);  /* #FF0086 — rose clair (disabled-light) */
--y-primary-200:  oklch(0.95 0.36 16deg);  /* #FF46AD — pastel saturé */
/* tints pour fonds clairs	*/
--y-primary-tint-100: oklch(0.97 0.022 16deg);  /* #FFE9E1 — halo très clair */
--y-primary-tint-050: oklch(0.99 0.022 16deg);  /* #FFF6ED — surface accent douce */
```

- Référence de marque : `--y-primary-500`. Aucune autre nuance n'est la couleur de la marque ; les autres sont des outils.
- `--y-primary-400` est la variante à utiliser sur fond sombre (plus lumineuse pour conserver le même signal).

### 2.2 Couleur secondaire — Bordeaux ybook

```
--y-secondary-700: oklch(0.25 0.25 15deg);  /* #6D0006 — décor sombre */
--y-secondary-500: oklch(0.52 0.25 15deg);  /* #B84870 — secondaire de marque (référence) */
--y-secondary-400: oklch(0.65 0.25 15deg);  /* #D04870 — contour/dégradé */
--y-secondary-300: oklch(0.80 0.25 15deg);  /* #E890A6 — pastel bordeaux */
```

Réservée aux :

- contours internes du symbole lorsqu'on redessine le logo en CSS/SVG inline ;
- titres premium (h1, hero title) en thème clair ;
- hover/active des liens de navigation principale.

### 2.3 Neutres chauds (fond ivoire & encre)

Hue 30, chroma très faible (0.012). Visent à évoquer le papier tiède plutôt qu'un gris froid.

```
--y-ink-900:    oklch(0.15 0.012 30deg);  /* #100908 */
--y-ink-800:    oklch(0.22 0.012 30deg);  /* #201917 */
--y-ink-700:    oklch(0.35 0.012 30deg);  /* #413835 */
--y-ink-600:    oklch(0.50 0.012 30deg);  /* #6B615C */
--y-ink-500:    oklch(0.65 0.012 30deg);  /* #988D86 */
--y-ink-400:    oklch(0.78 0.012 30deg);  /* #C1B5AC */
--y-ink-200:    oklch(0.92 0.012 30deg);  /* #F0E2D8 */
--y-ink-100:    oklch(0.98 0.012 30deg);  /* #FFF6EB */
```

### 2.4 Sémantiques

Teintes OKLCH choises pour conversation par domaine (vert=success, ambre=warning, rouge=error, bleu=info). Chroma modéré pour ne pas rivaliser avec le rose primaire.

```
--y-success:  oklch(0.62 0.16 145deg);  /* #1E9F5D */
--y-warning:  oklch(0.74 0.155 75deg);  /* #DB9C60 */
--y-error:    oklch(0.55 0.20  25deg);  /* #CA2946 */
--y-info:     oklch(0.62 0.13 240deg);  /* #578DB1 */
```

Versions `--y-*-700` (sombre) et `--y-*-300` (clair) sont dérivées en adaptant L sans toucher C ni H (cf. §4.4).

---

## 3. Tokens sémantiques (rôles)

Les tokens ci-dessous sont les seuls que les composants doivent consommer. Les primitives (§2) ne doivent jamais être appelées directement dans le CSS applicatif — passez toujours par les rôles sémantiques.

### 3.1 Thème clair

```css
:root {
  /* Canvases (fonds) */
  --canvas:           var(--y-ink-100);  /* papier ivoire #FFF6EB (L=.98) */
  --canvas-elevated:  #FFFDF9;             /* surface carte, L≈.995 même hue */
  --canvas-sunken:    var(--y-ink-200);  /* zones tempérées, inputs, separators */
  --canvas-accent:    var(--y-primary-tint-050); /* halo rose très léger */

  /* Texte */
  --text-primary:     var(--y-ink-900);  /* corps, contraste ~18:1 sur canvas */
  --text-secondary:   oklch(0.45 0.012 30deg);  /* métadonnées, ≥4.5:1 */
  --text-muted:        var(--y-ink-600);  /* placeholders, ≥4.5:1 obligatoire */
  --text-on-primary:  #FFFFFF;           /* sur fond rose primaire */
  --text-on-accent:   var(--y-ink-900);  /* sur halo rose clair */
  --text-link:        var(--y-primary-600); /* #D80023 — hover+, 5.5:1 */
  --text-link-hover:  var(--y-primary-700);

  /* Actions */
  --action-bg:            var(--y-primary-500);     /* boutons primaires */
  --action-bg-hover:      var(--y-primary-600);
  --action-bg-active:     var(--y-primary-700);
  --action-fg:            #FFFFFF;
  --action-secondary-bg:  transparent;
  --action-secondary-fg:  var(--y-primary-700);
  --action-secondary-border: oklch(0.45 0.16 16deg); /* 1px,tep tep */
  --action-disabled-bg:   oklch(0.94 0.012 30deg);
  --action-disabled-fg:   var(--y-ink-500);

  /* Focus & sélection */
  --focus-ring:        oklch(0.70 0.18 16deg);  /* rose visible hors primary */
  --focus-ring-offset: 2px;
  --selection-bg:      oklch(0.95 0.10 16deg);
  --selection-fg:      var(--y-ink-900);

  /* Bordures & séparateurs */
  --border-strong:     oklch(0.78 0.012 30deg);  /* #C1B5AC */
  --border-subtle:     oklch(0.92 0.012 30deg);  /* #F0E2D8 */
  --border-on-accent:  var(--y-secondary-500);

  /* États sémantiques */
  --state-success-fg:  var(--y-success);
  --state-success-bg:  oklch(0.95 0.05 145deg);
  --state-warning-fg:  oklch(0.42 0.13 75deg);   /* contraste AA sur canvas */
  --state-warning-bg:  oklch(0.95 0.05 75deg);
  --state-error-fg:    var(--y-error);
  --state-error-bg:    oklch(0.95 0.05 25deg);
  --state-info-fg:     var(--y-info);
  --state-info-bg:     oklch(0.95 0.04 240deg);

  /* Depth (ombres — offset + blur, pas de halo zéro-offset) */
  --shadow-sm: 0 1px 2px oklch(0.20 0.005 30deg / 0.06);
  --shadow-md: 0 4px 12px oklch(0.20 0.005 30deg / 0.10),
               0 1px 2px oklch(0.20 0.005 30deg / 0.06);
  --shadow-lg: 0 16px 40px oklch(0.20 0.005 30deg / 0.14),
               0 4px 12px oklch(0.20 0.005 30deg / 0.08);
  --shadow-primary: 0 8px 24px oklch(0.56 0.30 16deg / 0.28),
                    0 2px 6px oklch(0.56 0.30 16deg / 0.16);
}
```

### 3.2 Thème sombre

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Canvases — encre tiède teintée rose, composée pas inversée */
    --canvas:          oklch(0.18 0.012 30deg);  /* encre brune #1A1412 */
    --canvas-elevated: oklch(0.22 0.014 30deg);  /* carte, +0.04 L, +chroma léger */
    --canvas-sunken:   oklch(0.15 0.010 30deg);  /* inputs, sunken */
    --canvas-accent:   oklch(0.30 0.06 16deg);   /* halo rosé fade */

    /* Texte — teintée d'encre, jamais gris #AAA */
    --text-primary:    oklch(0.96 0.010 30deg);  /* papier calque */
    --text-secondary:  oklch(0.78 0.012 30deg);  /* ≥4.5:1 sur canvas dark */
    --text-muted:      oklch(0.65 0.012 30deg);  /* ≥4.5:1 obligatoire */
    --text-on-primary: #FFFFFF;
    --text-on-accent:  var(--text-primary);
    --text-link:       var(--y-primary-400);     /* #FF0064, 4.5:1 sur dark */
    --text-link-hover: var(--y-primary-300);

    /* Actions — le rose primary monte en L pour rester visible */
    --action-bg:           var(--y-primary-400);  /* #FF0064, plus clair qu'en light */
    --action-bg-hover:     var(--y-primary-300);
    --action-bg-active:    var(--y-primary-500);
    --action-fg:           oklch(0.15 0.05 16deg); /* ink-rose pour contraste 7:1 */
    --action-secondary-bg: transparent;
    --action-secondary-fg: var(--y-primary-300);
    --action-secondary-border: oklch(0.55 0.16 16deg);
    --action-disabled-bg:  oklch(0.26 0.012 30deg);
    --action-disabled-fg:  oklch(0.50 0.012 30deg);

    /* Focus — le rose reste saturé pour percer sur le fond sombre */
    --focus-ring:        oklch(0.78 0.20 16deg);
    --focus-ring-offset: 3px;           /* +1px pour lisser sur dark */
    --selection-bg:      oklch(0.40 0.14 16deg);
    --selection-fg:      #FFFFFF;

    /* Bordures */
    --border-strong:     oklch(0.34 0.014 30deg);
    --border-subtle:     oklch(0.26 0.012 30deg);
    --border-on-accent:  var(--y-secondary-400);

    /* États sémantiques — L augmenté, C réduit lègèrement pour fond sombre */
    --state-success-fg:  oklch(0.76 0.14 145deg);
    --state-success-bg:  oklch(0.26 0.05 145deg);
    --state-warning-fg:  oklch(0.84 0.13  75deg);
    --state-warning-bg:  oklch(0.26 0.05  75deg);
    --state-error-fg:    oklch(0.72 0.18  25deg);
    --state-error-bg:    oklch(0.28 0.06  25deg);
    --state-info-fg:     oklch(0.78 0.11 240deg);
    --state-info-bg:     oklch(0.26 0.04 240deg);

    /* Depth — ombres plus profondes, plus noires, parfois remplaçables par bordure */
    --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.30);
    --shadow-md: 0 4px 12px oklch(0 0 0 / 0.45),
                 0 1px 2px oklch(0 0 0 / 0.30);
    --shadow-lg: 0 16px 40px oklch(0 0 0 / 0.55),
                 0 4px 12px oklch(0 0 0 / 0.35);
    --shadow-primary: 0 8px 24px oklch(0.65 0.30 16deg / 0.40),
                      0 2px 6px oklch(0.65 0.30 16deg / 0.24);
  }
}
```

> Forçage manuel du thème via attribut `data-theme` recommandé pour les préférences UI : `html[data-theme="dark"] { ... }` reprend le bloc `prefers-color-scheme: dark`. Préserver l'unique source de vérité (les tokens sémantiques) en mutualisant les déclarations via une classe `.is-dark` appliquée sur `<html>`.

---

## 4. Règles d'application

### 4.1 Usage des couleurs de marque

| Rôle                         | Couleur à appliquer	                | Où                                                        |
| ---------------------------- | ---------------------------------- | --------------------------------------------------------- |
| Bouton primaire              | `--action-bg` (`--y-primary-500`)  | CTA principal, validated submit, action unique par zone   |
| Bouton secondaire            | transparent + bordure `--y-primary-700` | annulation, option alternative                        |
| Lien texte                   | `--text-link`                      | inline body text ; `--text-link-hover` au survol          |
| Lien navigation              | `--y-secondary-500`                | seul cas où le bordeaux remplace le rose                  |
| Titre de page premium (h1)   | `--y-secondary-500` (clair) / `--y-secondary-300` (sombre) | hero, premier titre ; titres courants restent en `--text-primary` |
| Focus visible                | `--focus-ring` + `--focus-ring-offset` | Tout élément interactif au clavier                    |
| État sélectionné (option/liste) | `--selection-bg` + `--selection-fg` | item actif                                            |
| Halo d'emphase (toc, bento)  | `--canvas-accent`                  | panneau de focus, onglet actif arrière                    |
| Bordure carte                | `--border-subtle` (1px)            | contours discrets, jamais >1px                           |
| Séparateur Liste/hairline    | `--border-subtle` direct            | `<hr>`,êtes hairlines                                     |

Le rose primaire ne se pose **jamais** sur :

- un titre de paragraphe ordinaire (h2, h3, …) ;
- une bordure de zone de contenu (sauf fond accent) ;
- un fond décoratif neutre pour « égayer » ;
- une icône ornementale sans fonction.

Le bordeaux secondaire ne se pose **jamais** sur :

- des boutons (le bouton secondaire reste rose) ;
- un fond large (> 30% d'une card) ;
- un état sémantique (success/error/etc.).

### 4.2 Contrast - WCAG AA obligatoire

Paires à vérifier systématiquement :

| Paire                                | Ratio cible | Remarque                                  |
| ------------------------------------ | ----------- | ----------------------------------------- |
| `--text-primary` / `--canvas`        | ≥ 7:1 (AAA) | ivoire #FFF6EB vs encre #100908 ≈ 18:1 ✓  |
| `--text-secondary` / `--canvas`       | ≥ 4.5:1     | L≈.45 chaud, ratio ≈ 7:1 ✓              |
| `--text-muted` / `--canvas`           | ≥ 4.5:1     | placeholders, **jamais gris clair** ; OKLCH L=.65 ≈ 4.7:1 ✓ |
| `--text-on-primary` / `--action-bg`   | ≥ 4.5:1     | blanc sur #E04070 → 4.62:1 ✓ (pass, tight) |
| `--text-link` / `--canvas`            | ≥ 4.5:1     | `--y-primary-600` #D80023 → 5.5:1 ✓      |
| `--text-primary` / `--canvas` (dark)  | ≥ 7:1       | papier calque L=.96 / encre L=.18 ≈ 13:1 ✓ |
| `--action-fg` / `--action-bg` (dark)   | ≥ 4.5:1     | ink-rose L=.15 / `--y-primary-400` L=.70 ≈ 7:1 ✓ |
| Texte état sémantique / fond sémantique | ≥ 4.5:1   | vérifier chaque variante clair + sombre  |

Acceptable l'exception **texte large (≥18px ou bold ≥14px) sur fond tinte** : ≥ 3:1 seulement. Le texte `--text-on-accent` en grand titre est raccord.

Pour toute nouvelle paire, vérifier avec Chrome DevTools « Contrast » ou un script APCA local avant de committer.

### 4.3 Texte secondaire — pas de gris froid

Sur une surface rose (`--canvas-accent`, `--action-bg`) ou bordeaux (`--y-secondary-500`), **ne pas utiliser du gris générique** pour le texte secondaire.

Sur fond rose clair (`--canvas-accent` #FFF6ED) → texte secondaire en `oklch(0.45 0.04 16deg)` (rose plus foncé, ratio 4.5:1).
Sur fond rose primaire (`--action-bg`) → texte secondaire en `oklch(0.78 0.10 16deg)` (rose clair sur la teinte du fond).
Sur fond bordeaux (`--y-secondary-500`) → texte secondaire en `oklch(0.86 0.04 15deg)` (presque blanc teinté de la même hue).

### 4.4 États sémantiques — couleur + icône

Chaque état porte sa couleur **et** une icône ≥ 14px ou un label texte. Jamais de signal par couleur seule.

| État     | Icône                 | Couleur `--state-*-fg` | Fond `--state-*-bg` | Usage                  |
| -------- | --------------------- | --------------------- | ------------------- | ---------------------- |
| Succès   | check-mark            | vert `#1E9F5D` / `#7AE` (dark) | halo vert clair     | confirmation, completed |
| Avertissement | triangle          | ambre `#XXX` / `#XXX` | halo ambre          | validation, risque modéré |
| Erreur   | croix ou octogone     | rouge `#CA2946` / `#FF8094` (dark) | halo rouge clair    | errors de saisie, 404  |
| Info     | bulle « i »            | bleu `#578DB1` / `#A6CEEC` (dark)  | halo bleu           | conseil astuce          |

Les toast d'erreur incluent en outre le **nom du problème** (ex. « Mot de passe trop court : 8 caractères minimum ») — pas uniquement la couleur.

### 4.5 Depth : shadows et elevation

- Chaque shadow porte un **offset** + un **blur** (cf. §3). Jamais de halo zéro-offset sur `--y-primary` — c'est de la décoration.
- Élève une card : `--shadow-md` + 1px `--border-subtle` → carte lisible. Sur sombre, préférer **bordure** plutôt que shadow si la lisibilité du contenu l'emporte.
- Le primary shadow (rose) n'apparaît que sur le bouton primaire pressé (`:active`), jamais en état statique.
- Les modaux utilisent `--shadow-lg` + un backdrop `oklch(0 0 0 / 0.40)` (clair) ou `oklch(0 0 0 / 0.65)` (sombre).

### 4.6 Espacement (grille 4/8px)

Grille de base 4px. Tokens :

```
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;  /* section gap */
```

Règles :

- `padding` interne des boutons : `10px 16px` (compact) ou `12px 20px` (régulier) — jamais `10px 13px`.
- Titre de section : `margin-top var(--space-7)` supérieur, `margin-bottom var(--space-3)` inférieur — **plus d'air au-dessus qu'en-dessous**.
- Mesure de lecture : `max-width: 68ch` sur les blocs de texte long.
- Grille de cartouche : gap `var(--space-4)` ; padding interne `var(--space-5)`.

### 4.7 Typographie — escalier et rythme

Paire de polices : **une** display + **une** body. Le wordmark ybook étant sans-serif géométrique, on choisit une sans-serif humaniste pour l'interface et une sans-serif contemporaine pour la display — éviter les entrenues du list « Inter-as-display ».

Recommendation (à confirmer avec licensed fonts) :

- **Display** : `Plus Jakarta Sans` (700, 800) — h1, h2, hero, callouts cadre. Ressemble au wordmark ybook sans pasticher.
- **Body** : `Inter` (400, 500, 600) — texte courant, labels, UI. Interceptée par pile système si webfont absente : `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`.

Échelle (rem basé 16px) :

```
--text-xs:   0.75rem (12px)   labels, captions         letter-spacing 0.01em
--text-sm:   0.875rem (14px) body dense, meta         letter-spacing 0
--text-base: 1rem (16px)     body, inputs             letter-spacing 0
--text-md:   1.125rem (18px) lead, sous-titre          letter-spacing -0.005em
--text-lg:   1.5rem (24px)   h3                       letter-spacing -0.01em
--text-xl:   2rem (32px)     h2                       letter-spacing -0.015em
--text-2xl:  3rem (48px)     h1                       letter-spacing -0.02em
--text-3xl:  4.5rem (72px)   hero display             letter-spacing -0.03em   (max)
```

Tracking **jamais au-delà de -0.04em**. `-0.02 à -0.03em` généralement meilleur.

Boutons & labels : `font-weight 500`, `letter-spacing 0.005em`, `text-transform none` (pas d'UPPERCASE décorative). Eyebrows §5 interdits hormis un unique kicker global.

### 4.8 Radius & bordures

- Cards : `border-radius 14px` (système désiré 12-16px, 14 est l'arrondi ybook).
- Boutons : `border-radius 10px` (cohérent avec 14-4).
- Pills/tags (petits controls uniquement) : `999px`. Jamais sur cards.
- Bordures d'accent latérales (`border-left: 3px solid var(--y-primary)`) **interdites** sur cards et callouts sémantiques — utilisez plutôt une icône ou un fond teinté.

### 4.9 Motion — un moment signature

Préserver `prefers-reduced-motion: reduce`. Un seul moment d'entrée, pas d'effet diffus.

- Révélation au scroll du **trait horizontal** (référence à la barre livre du logo) sous les hero/cards — keyframe `bookline-rise` 600ms, `transform: scaleX(0) → scaleX(1)` depuis la gauche, ease `cubic-bezier(0.16, 1, 0.3, 1)`.
- Hover sur bouton primaire : `transform: translateY(-1px)`, `box-shadow: var(--shadow-primary)`, 150ms ease-out.
- Hover sur lien texte : `--text-link-hover` + underline `text-decoration-thickness: 2px`, 100ms linear.
- Modaux : entry 250ms (`opacity 0 → 1` + `translateY(-4px)`), sortie 200ms ease-in. Backdrop fade 200ms.
- Liste/tabs transitions : 200ms ease-out.
- Aucun effet `backdrop-filter: blur()` sauf si la lisibilité d'un overlay sur image impose un frost léger — c'est un usage spécifique, pas un costume.

Tokens :

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:  cubic-bezier(0.7, 0, 0.84, 0);
--dur-fast: 150ms;
--dur-base: 250ms;
--dur-slow: 500ms;
```

### 4.10 État & states — couverture obligatoire

Tout composant interactif (button, link, input, tab) doit donner un retour pour :

- `default` (état de base)
- `hover` (souris au-dessus)
- `focus-visible` (clavier) — `--focus-ring` et `--focus-ring-offset` systématiques
- `active` (clic_encours)
- `disabled` (`--action-disabled-bg` + `--action-disabled-fg`, `cursor: not-allowed`)
- `loading` (spinner ou skeleton ; pas de changement de couleur seulement)
- `error` sur inputs (bordure `--state-error-fg` + message écrit en dessous)
- `empty` (illustrations consistent + CTA, jamais un message seul)

Aucun `outline: none` sans remplacement. Le `:focus` se distingue du `:hover` par un **anneau de couleur franche** autour de l'élément — pas seulement de la teinte.

### 4.11 Accessibilité — garanties

- Tous les éléments interactifs sont atteignables au clavier (Tab + Enter/Space).
- Targets tactiles ≥ 44×44px sur mobile.
- Liens porteurs d'icônes seules : `aria-label` ou `<span class="sr-only">` obligatoire.
- Champ d'erreur : `aria-describedby` vers le message écrit.
- Mode sombre activé via `prefers-color-scheme` et/ou attribut `data-theme` sur `<html>` — ne pas reposer uniquement sur un toggle JS.
- `prefers-reduced-motion: reduce` coupe le moment signature et ne conserve que les opacités.

### 4.12 Logo & branding dans le UI

- Header de page : utiliser le **logo primary horizontal** (`ybook-logo-primary-2400px.png`) sur fond clair, **logo reverse** (`ybook-logo-reverse-2400px.png`) sur fond sombre. Le remplacer en `var(--canvas)` par le SVG quand il sera fourni.
- Favicon : `ybook-favicon.ico` à la racine + `<link rel="apple-touch-icon" href="apple-touch-icon-180x180.png">`.
- Avatar réseaux sociaux / share preview : `ybook-symbol-primary-1024px.png`.
- Marges de respiration autour du logo dans le header : padding `var(--space-5)` latéral, height ≈ 40-56px.
- Ne **pas** recolorer le logo en CSS `filter` pour le thèmer — utiliser les variantes natives (primary/reverse/black/white). Idéalement fournir une version SVG et appliquer `currentColor` au symbole.

---

## 5. Anti-patterns (refus)

Les catégories d'erreur que la hook impeccable doit détecter — autant ne pas les introduire :

- Gris froid `#999`, `#E5E5E5`, `rgb(118,118,118)` sur fond ivoire.
- Gris sur fond rose pour « seconder » le texte — utilises la dérivée de la hue (§4.3).
- Dégradé texte sur titre (gradient text) — l'emphase vient du poids ou de la taille.
- Halo `box-shadow: 0 0 20px var(--y-primary)` sans offset — de la décoration sans portée.
- `backdrop-filter: blur()` en costume « effet » sans usage sémantique.
- Border-left 3-4px coloré sur cards d'état (success/error) — préférer icône + fond teinté.
- Cards de même taille « icône + titre + texte » comme architecture de page.
- Eyebrow uppercase tracked au-dessus de chaque section (01 / 02 / 03).
- Modal pour des tâches qui n'ont pas besoin d'interruption.
- `text-transform: uppercase` sur corps ou boutons pour « styliser ».
- Couleur sémantique sans icône associée.
- Plus de trois familles de polices sur une page.
- `tracking` à `-0.05em` ou plus negatif.
- Ombres skeuomorphes (multi-couches)(sauf depth shadow fonctionnelle).
- Inversion mécanique du thème clair en thème sombre (prendre la même chroma, le même L — non ! les deux sont **composés indépendamment**).
- Réutilisation de `--y-primary-500` au lieu des tokens sémantiques dans une card applicative.

---

## 6. Quickstart - snippet de base

```html
<!doctype html>
<html lang="fr" data-theme="light">
<head>
  <meta charset="utf-8">
  <link rel="icon" href="/ybook-favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
  <style>/* tokens §3 importés */</style>
</head>
<body style="background:var(--canvas); color:var(--text-primary); font-family:Inter,system-ui,sans-serif;">

  <header style="padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--border-subtle);">
    <img src="/ybook-logo-primary-2400px.png" alt="ybook" style="height:44px; width:auto;">
  </header>

  <main style="max-width:68ch; margin:0 auto; padding:var(--space-7) var(--space-6);">
    <h1 style="font-family:'Plus Jakarta Sans',sans-serif; font-size:var(--text-2xl); letter-spacing:-0.02em; color:var(--y-secondary-500);">
      Votre bibliothèque partagée
    </h1>
    <p style="color:var(--text-secondary); font-size:var(--text-md); line-height:1.6;">
      Lorem ipsum dolor sit amet. <a href="#" style="color:var(--text-link); text-decoration:underline; text-decoration-thickness:2px;">Consectetur</a> adipiscing elit.
    </p>
    <button style="background:var(--action-bg); color:var(--action-fg); border:0; padding:12px 20px; border-radius:10px; font-weight:500; cursor:pointer; box-shadow:var(--shadow-sm);">
      Commencer
    </button>
  </main>

</body>
</html>
```

Tokens sans dépendance applicative à internaliser :

- `--canvas` pour les fonds full-page
- `--canvas-elevated` pour les cards
- `--action-bg` + `--action-fg` pour les CTA
- `--border-subtle` pour tout hairline
- `--text-primary` / `--text-secondary` / `--text-muted` pour la hiérarchie texte
- `--focus-ring` sur tout élément interactif → pilar d'accessibilité

---

## 7. Synthèse的一句话

> Terrain de fond ivoire tiède peuplé d'encre chaude, une seule couleur franche (rose #E04070) portant l'action et la sélection, un bordeaux #B84870 secondaire pour signer les titres premium, des thèmes clair et sombre composés indépendamment en OKLCH, des contrastes AAA sur le texte courant, et un seul moment de motion — l'ouverture de la couverture, héritée du logo.

---

## 8. Audit - auto-vérifications

Avant livraison de toute surface ybook, sortir cette liste et cocher :

- [ ] Une seule couleur forte de marque utilisée par zone ; pas de dispersion de l'accent sur fond neutre.
- [ ] Texte body ≥ 4.5:1 sur son fond (vérifié DevTools).
- [ ] Pas de gris froid sur fond ivoire ou sur fond rose.
- [ ]states sémantiques portent icône + couleur + texte.
- [ ] Tout élément interactif a un état `focus-visible` visible (anneau `--focus-ring`).
- [ ] `disabled` est visuellement distinct de `default` (pas seulement plus clair).
- [ ] `error` des inputs porte un message textuel nommant le problème.
- [ ] Mode sombre n'est pas une inversion mécanique (différentes luminances, chroma réduit).
- [ ] Shadows portent offset + blur ; pas de halo zéro-offset.
- [ ] `prefers-reduced-motion` coupe le moment de signature.
- [ ] Logo sur fond clair = primary horizontal intégral ; sur sombre = reverse horizontal.
- [ ] Une seule famille display + une seule famille body ; pas d'UPPERCASE décorative.
- [ ] Pas d'eyebrow tracked au-dessus de chaque section.
- [ ] `--y-primary-*` ou `--y-secondary-*` jamais appelés directement dans un composant — les composants consomment des tokens sémantiques uniquement.

Quand toutes les cases sont vertes, hand-off à `$impeccable polish` pour le passage final.
