# Changelog

Toutes les modifications notables du projet seront documentées dans ce fichier.

## [2.0.0] - 2025-11-07

### 🎉 Nouvelles fonctionnalités majeures

#### Modes de commentaires simplifiés
Ajout de 2 modes pour poster les reviews IA sur GitLab :

- **`global`** (défaut) : Commentaire unique avec toute la review
- **`structured`** : Format JSON avec commentaires inline + résumé

Configuration via variable d'environnement `COMMENT_MODE`.

#### Commentaires inline sur le code
- Utilisation de l'API GitLab Discussions pour créer des threads sur des lignes spécifiques
- Parsing JSON simple et fiable avec `JSON.parse()`
- Support des commentaires sur lignes ajoutées/modifiées/supprimées
- Extraction automatique des commits SHAs depuis le webhook

#### Format JSON structuré
- L'IA génère un JSON avec deux champs : `summary` et `inline_comments`
- Parsing simple et fiable (pas de regex complexes)
- Fallback automatique sur commentaire global si JSON invalide
- Flexible : permet inline seul, résumé seul, ou les deux

### 📝 Améliorations

#### Prompt système enrichi
- Instructions strictes pour générer un JSON valide
- Format clair avec exemples pour l'IA
- Règles explicites (pas de trailing commas, quotes correctes, etc.)

#### Gestion d'erreurs améliorée
- Messages d'erreur détaillés pour les API GitLab
- HTTP status codes et response bodies dans les logs
- Debug logs pour les requêtes API
- Fallback automatique vers commentaire global si :
  - JSON invalide
  - SHAs de commits manquants
  - Erreur de parsing

#### Logs GCP améliorés
- Ajout du champ `severity` pour GCP Cloud Logging
- Utilisation correcte de la syntaxe `{ err }` pour Pino
- Capture complète des stack traces

### 📚 Documentation

Nouveaux fichiers de documentation :

- **COMMENT_MODES.md** : Guide complet des 2 modes (simplifié et clair)
- **EXAMPLES.md** : Exemples de sorties pour chaque mode
- **GITLAB_API.md** : Référence complète de l'API GitLab utilisée
- **ARCHITECTURE.md** : Diagrammes de flux et architecture technique

Documentation mise à jour :
- README.md : Mention des 2 modes
- .env.sample : Variable COMMENT_MODE avec explications
- Exemples d'utilisation pour chaque mode

### 🔧 Technique

#### Nouveaux types TypeScript
```typescript
// Types pour commentaires inline
interface InlineComment {
  file: string
  line: number
  comment: string
  isOldFile?: boolean
}

interface InlineCommentPosition {
  base_sha: string
  head_sha: string
  start_sha: string
  position_type: 'text'
  new_path: string
  new_line: number
  old_path?: string
  old_line?: number
}

interface StructuredReview {
  summary: string
  inline_comments: InlineComment[]
}

type CommentMode = 'global' | 'structured'
```

#### Nouvelles fonctions
- `postInlineComments()` : Poster des commentaires inline via API Discussions
- `parseStructuredResponse()` : Parser JSON structuré avec fallback
- Prompt adaptatif selon le mode dans `buildPrompt()`

#### Extraction des commits SHAs
- Récupération automatique depuis `webhook.last_commit.id`
- Extraction depuis `changes.commit.id` et `changes.commits[0].parent_ids[0]`
- Propagation des SHAs dans `WebhookHandlerResult`

### 🐛 Corrections de bugs

- Fix : Erreurs TypeScript sur les types implicites `any`
- Fix : Parsing JSON robuste avec gestion des erreurs et fallback
- Fix : Gestion correcte des commentaires sur lignes supprimées (`old_path`/`old_line`)

### ⚙️ Compatibilité

- ✅ Rétrocompatibilité totale : Mode `global` par défaut
- ✅ Pas de breaking changes : Fonctionne avec les webhooks existants
- ✅ Fallback automatique si SHAs manquants ou JSON invalide
- ✅ Compatible avec toutes les versions de GitLab supportant l'API Discussions

### 🧪 Tests

- Validation des parsing JSON
- Tests de compilation TypeScript réussis
- Fallback automatique testé

### 💡 Simplification vs version initiale

La version initiale supportait 4 modes (`global`, `inline`, `hybrid`, `structured`).  
Nous avons simplifié à **2 modes seulement** pour ces raisons :

**Pourquoi ?**
1. **Parsing JSON > Parsing regex** : `JSON.parse()` est simple, rapide, et fiable
2. **Un format structuré suffit** : Peut faire inline seul, résumé seul, ou les deux
3. **Moins de code = moins de bugs** : Maintenance simplifiée
4. **Meilleure DX** : Un seul format à apprendre, comportement prévisible

---

## [1.0.0] - 2025-10-XX

### Fonctionnalités initiales

- Support de 3 providers IA : Anthropic Claude, OpenAI, Google Gemini
- 68 modèles IA disponibles
- Review automatique des merge requests GitLab
- Commentaires en markdown
- Approbation automatique des MR sans problèmes critiques
- Déploiement Docker
- Logs structurés avec Pino
- Webhook GitLab pour événements MR

---

## Notes de migration

### De 1.x vers 2.0

Aucune action requise ! La version 2.0 est 100% rétrocompatible.

Pour activer le mode structuré :
1. Ajoutez `COMMENT_MODE=structured` dans votre `.env`
2. Redéployez l'application
3. Testez avec une nouvelle MR

Le mode par défaut reste `global` (comportement identique à la v1.x).


- **`global`** (défaut) : Commentaire unique avec toute la review
- **`inline`** : Commentaires directement sur les lignes de code concernées
- **`hybrid`** : Commentaires inline + résumé global
- **`structured`** : Format JSON avec séparation stricte summary/inline_comments

Configuration via variable d'environnement `COMMENT_MODE`.

#### Commentaires inline sur le code
- Utilisation de l'API GitLab Discussions pour créer des threads sur des lignes spécifiques
- Parsing automatique des patterns dans les réponses IA
- Support des commentaires sur lignes ajoutées/modifiées/supprimées
- Extraction automatique des commits SHAs depuis le webhook

#### Parsing intelligent des réponses IA
- Détection de patterns multiples : 
  - `In \`file.ts\` line 42: comment`
  - `file.ts:42: comment`
  - `- \`file.ts:42\` - comment`
- Parsing JSON structuré avec fallback sur parsing de patterns
- Séparation automatique résumé/commentaires inline

### 📝 Améliorations

#### Prompt système enrichi
- Instructions adaptées selon le mode sélectionné
- Format de sortie clair pour l'IA selon le mode
- Meilleure séparation entre observations générales et problèmes spécifiques

#### Gestion d'erreurs améliorée
- Messages d'erreur détaillés pour les API GitLab
- HTTP status codes et response bodies dans les logs
- Debug logs pour les requêtes API
- Fallback automatique vers commentaire global si SHAs manquants

#### Logs GCP améliorés
- Ajout du champ `severity` pour GCP Cloud Logging
- Utilisation correcte de la syntaxe `{ err }` pour Pino
- Capture complète des stack traces

### 📚 Documentation

Nouveaux fichiers de documentation :

- **COMMENT_MODES.md** : Guide complet des 4 modes de commentaires
- **EXAMPLES.md** : Exemples de sorties pour chaque mode
- **GITLAB_API.md** : Référence complète de l'API GitLab utilisée
- **scripts/test-inline-parsing.js** : Script de test pour le parsing

Documentation mise à jour :
- README.md : Mention des modes de commentaires
- .env.sample : Variable COMMENT_MODE avec explications
- Exemples d'utilisation pour chaque mode

### 🔧 Technique

#### Nouveaux types TypeScript
```typescript
// Types pour commentaires inline
interface InlineComment {
  file: string
  line: number
  comment: string
  isOldFile?: boolean
}

interface InlineCommentPosition {
  base_sha: string
  head_sha: string
  start_sha: string
  position_type: 'text'
  new_path: string
  new_line: number
  old_path?: string
  old_line?: number
}

interface StructuredReview {
  summary: string
  inline_comments: InlineComment[]
}

type CommentMode = 'global' | 'inline' | 'hybrid' | 'structured'
```

#### Nouvelles fonctions
- `postInlineComments()` : Poster des commentaires inline via API Discussions
- `parseInlineComments()` : Extraire commentaires inline des patterns texte
- `parseStructuredResponse()` : Parser JSON structuré avec fallback
- Prompt adaptatif selon le mode dans `buildPrompt()`

#### Extraction des commits SHAs
- Récupération automatique depuis `webhook.last_commit.id`
- Extraction depuis `changes.commit.id` et `changes.commits[0].parent_ids[0]`
- Propagation des SHAs dans `WebhookHandlerResult`

### 🐛 Corrections de bugs

- Fix : Erreurs TypeScript sur les types implicites `any`
- Fix : Parsing JSON robuste avec gestion des erreurs
- Fix : Gestion correcte des commentaires sur lignes supprimées (`old_path`/`old_line`)

### ⚙️ Compatibilité

- ✅ Rétrocompatibilité totale : Mode `global` par défaut
- ✅ Pas de breaking changes : Fonctionne avec les webhooks existants
- ✅ Fallback automatique si SHAs manquants
- ✅ Compatible avec toutes les versions de GitLab supportant l'API Discussions

### 🧪 Tests

- Script de test pour le parsing : `scripts/test-inline-parsing.js`
- Validation des 3 modes de parsing
- Tests de compilation TypeScript réussis

---

## [1.0.0] - 2025-10-XX

### Fonctionnalités initiales

- Support de 3 providers IA : Anthropic Claude, OpenAI, Google Gemini
- 68 modèles IA disponibles
- Review automatique des merge requests GitLab
- Commentaires en markdown
- Approbation automatique des MR sans problèmes critiques
- Déploiement Docker
- Logs structurés avec Pino
- Webhook GitLab pour événements MR

---

## Notes de migration

### De 1.x vers 2.0

Aucune action requise ! La version 2.0 est 100% rétrocompatible.

Pour activer les nouveaux modes :
1. Ajoutez `COMMENT_MODE=hybrid` dans votre `.env`
2. Redéployez l'application
3. Testez avec une nouvelle MR

Le mode par défaut reste `global` (comportement identique à la v1.x).
