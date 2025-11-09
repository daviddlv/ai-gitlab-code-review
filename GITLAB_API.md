# GitLab API Reference

Ce document détaille les endpoints GitLab utilisés par l'application et leurs paramètres.

## 📝 Commentaire global (Notes API)

### Endpoint

```
POST /projects/:id/merge_requests/:merge_request_iid/notes
```

### Documentation officielle

https://docs.gitlab.com/ee/api/notes.html#create-new-merge-request-note

### Paramètres

```json
{
  "body": "Le texte du commentaire en markdown"
}
```

### Exemple de requête

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "body": "# AI Code Review\n\nLGTM! Good work."
  }' \
  "https://gitlab.com/api/v4/projects/12345/merge_requests/42/notes"
```

### Réponse (200 OK)

```json
{
  "id": 301,
  "body": "# AI Code Review\n\nLGTM! Good work.",
  "author": {
    "id": 1,
    "username": "ai-bot"
  },
  "created_at": "2025-11-07T10:00:00Z",
  "noteable_type": "MergeRequest"
}
```

### Cas d'usage

- Mode `global` : Unique commentaire avec toute la review
- Mode `hybrid` : Résumé général après les commentaires inline
- Mode `structured` : Résumé extrait du JSON

---

## 💬 Commentaire inline (Discussions API)

### Endpoint

```
POST /projects/:id/merge_requests/:merge_request_iid/discussions
```

### Documentation officielle

https://docs.gitlab.com/ee/api/discussions.html#create-new-merge-request-thread

### Paramètres

```json
{
  "body": "Le texte du commentaire",
  "position": {
    "base_sha": "sha-du-commit-base",
    "head_sha": "sha-du-commit-head",
    "start_sha": "sha-du-commit-start",
    "position_type": "text",
    "new_path": "chemin/vers/fichier.ts",
    "new_line": 42
  }
}
```

### Paramètres de position

#### Pour un commentaire sur une ligne ajoutée/modifiée

```json
{
  "position": {
    "base_sha": "abc123",
    "head_sha": "def456",
    "start_sha": "abc123",
    "position_type": "text",
    "new_path": "src/file.ts",
    "new_line": 42
  }
}
```

#### Pour un commentaire sur une ligne supprimée

```json
{
  "position": {
    "base_sha": "abc123",
    "head_sha": "def456",
    "start_sha": "abc123",
    "position_type": "text",
    "old_path": "src/file.ts",
    "old_line": 42
  }
}
```

### Exemple de requête

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "body": "Consider adding null check here",
    "position": {
      "base_sha": "6104942438c14ec7bd21c6cd5bd995272b3faff6",
      "head_sha": "3c4e111fcba8c2bc83b5f54ffa21f7e9dd6f79d5",
      "start_sha": "6104942438c14ec7bd21c6cd5bd995272b3faff6",
      "position_type": "text",
      "new_path": "src/auth/middleware.ts",
      "new_line": 42
    }
  }' \
  "https://gitlab.com/api/v4/projects/12345/merge_requests/42/discussions"
```

### Réponse (201 Created)

```json
{
  "id": "abc123",
  "individual_note": false,
  "notes": [
    {
      "id": 401,
      "type": "DiffNote",
      "body": "Consider adding null check here",
      "position": {
        "base_sha": "6104942438c14ec7bd21c6cd5bd995272b3faff6",
        "head_sha": "3c4e111fcba8c2bc83b5f54ffa21f7e9dd6f79d5",
        "new_path": "src/auth/middleware.ts",
        "new_line": 42,
        "line_range": {
          "start": { "line_code": "...", "type": "new", "new_line": 42 },
          "end": { "line_code": "...", "type": "new", "new_line": 42 }
        }
      }
    }
  ]
}
```

### Cas d'usage

- Mode `inline` : Tous les commentaires sont postés via cet endpoint
- Mode `hybrid` : Commentaires spécifiques sur le code
- Mode `structured` : Commentaires extraits du JSON

---

## 🔍 Récupération du diff (Compare API)

### Endpoint

```
GET /projects/:id/repository/compare?from=:branch1&to=:branch2&unidiff=true
```

### Documentation officielle

https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits

### Paramètres

- `from` : Branche de base (target)
- `to` : Branche source
- `unidiff` : Format unifié du diff (true)

### Exemple de requête

```bash
curl --header "PRIVATE-TOKEN: <token>" \
  "https://gitlab.com/api/v4/projects/12345/repository/compare?from=main&to=feature-branch&unidiff=true"
```

### Réponse (200 OK)

```json
{
  "commit": {
    "id": "3c4e111fcba8c2bc83b5f54ffa21f7e9dd6f79d5",
    "short_id": "3c4e111f",
    "parent_ids": ["6104942438c14ec7bd21c6cd5bd995272b3faff6"]
  },
  "commits": [
    {
      "id": "3c4e111fcba8c2bc83b5f54ffa21f7e9dd6f79d5",
      "message": "Add authentication"
    }
  ],
  "diffs": [
    {
      "old_path": "src/auth/middleware.ts",
      "new_path": "src/auth/middleware.ts",
      "diff": "@@ -39,6 +39,10 @@ export function authenticate(req, res, next) {\n+  if (!user) {\n+    throw new Error('User not found');\n+  }\n   return next();\n }"
    }
  ],
  "compare_timeout": false,
  "compare_same_ref": false
}
```

### Usage dans l'application

Cette API est utilisée pour :

1. Récupérer les modifications de la MR
2. Extraire les commits SHAs (pour les commentaires inline)
3. Générer le contexte pour l'IA

---

## 🗂️ Récupération du fichier avant modification (File API)

### Endpoint

```
GET /projects/:id/repository/files/:file_path/raw?ref=:branch
```

### Documentation officielle

https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository

### Paramètres

- `file_path` : Chemin du fichier (URL encoded)
- `ref` : Branche ou commit SHA

### Exemple de requête

```bash
curl --header "PRIVATE-TOKEN: <token>" \
  "https://gitlab.com/api/v4/projects/12345/repository/files/src%2Fauth%2Fmiddleware.ts/raw?ref=main"
```

### Réponse (200 OK)

```typescript
// Contenu brut du fichier
export function authenticate(req, res, next) {
  const token = req.headers.authorization;
  // ...
}
```

### Usage dans l'application

Utilisé pour fournir le contexte complet du fichier à l'IA avant les modifications.

---

## ✅ Approbation de la MR (Approve API)

### Endpoint

```
POST /projects/:id/merge_requests/:merge_request_iid/approve
```

### Documentation officielle

https://docs.gitlab.com/ee/api/merge_request_approvals.html#approve-merge-request

### Exemple de requête

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  "https://gitlab.com/api/v4/projects/12345/merge_requests/42/approve"
```

### Réponse (200 OK)

```json
{
  "id": 42,
  "iid": 42,
  "project_id": 12345,
  "approved": true,
  "approved_by": [
    {
      "user": {
        "id": 1,
        "username": "ai-bot"
      }
    }
  ]
}
```

### Usage dans l'application

Utilisé pour approuver automatiquement la MR si l'IA ne détecte aucun problème critique.

---

## 🔑 Authentification

Toutes les requêtes utilisent un **Personal Access Token** avec le scope `api`.

### Header requis

```http
PRIVATE-TOKEN: <votre-token>
```

### Création du token

1. GitLab → Settings → Access Tokens
2. Name: `AI Code Review Bot`
3. Scopes: `api`, `read_api`, `write_repository`
4. Expiration: 90 jours ou plus

---

## 🚨 Codes d'erreur courants

### 400 Bad Request

- Position de diff invalide
- SHAs de commits incorrects
- Ligne en dehors du diff

**Solution** : Vérifier que les SHAs correspondent au diff actuel

### 401 Unauthorized

- Token invalide ou expiré
- Token manquant

**Solution** : Vérifier la variable `GITLAB_TOKEN`

### 403 Forbidden

- Token sans les permissions nécessaires
- Bot n'a pas accès au projet

**Solution** : Ajouter le bot comme membre du projet

### 404 Not Found

- Projet inexistant
- MR inexistante
- Fichier non trouvé

**Solution** : Vérifier les IDs du projet et de la MR

### 422 Unprocessable Entity

- Position de diff obsolète
- Ligne déjà modifiée

**Solution** : Récupérer les derniers commits SHAs

---

## 📊 Limites et quotas

### Rate limiting

- GitLab.com : 300 requêtes/minute par IP
- Self-hosted : Configurable

### Taille des commentaires

- Maximum : 1 000 000 caractères
- Recommandé : < 10 000 caractères

### Nombre de discussions

- Pas de limite officielle
- Recommandé : < 100 commentaires inline par MR

---

## 🔧 Debugging

### Activer les logs détaillés

```typescript
console.log("Posting inline comment:", {
  url: discussionsUrl.toString(),
  mergeRequestIid,
  baseSha,
  headSha,
  file: comment.file,
  line: comment.line,
});
```

### Vérifier la réponse d'erreur

```typescript
if (!response.ok) {
  const errorBody = await response.text();
  console.error("GitLab API error:", {
    status: response.status,
    statusText: response.statusText,
    body: errorBody,
  });
}
```

### Tester avec curl

Utilisez les exemples ci-dessus pour tester manuellement les endpoints.

---

## 📚 Ressources

- [GitLab API Documentation](https://docs.gitlab.com/ee/api/)
- [Discussions API](https://docs.gitlab.com/ee/api/discussions.html)
- [Notes API](https://docs.gitlab.com/ee/api/notes.html)
- [Repository Compare API](https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits)
- [Authentication](https://docs.gitlab.com/ee/api/index.html#authentication)
