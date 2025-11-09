# Déploiement sur Google Cloud Run

Ce projet est configuré pour être déployé automatiquement sur Google Cloud Run via GitHub Actions.

## Prérequis

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID de votre projet (PROJECT_ID)

### 2. Activer les APIs nécessaires

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 3. Créer un compte de service

```bash
# Créer le compte de service
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account"

# Obtenir l'email du compte de service
SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:GitHub Actions Service Account" \
  --format='value(email)')

# Donner les permissions nécessaires
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Créer et télécharger la clé JSON
gcloud iam service-accounts keys create key.json \
  --iam-account="${SA_EMAIL}"
```

### 4. Créer un Artifact Registry

```bash
gcloud artifacts repositories create ai-gitlab-code-review \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Docker repository for AI GitLab Code Review"
```

### 5. Créer les secrets dans Google Secret Manager

```bash
# ANTHROPIC_API_KEY
echo -n "votre_clé_anthropic" | gcloud secrets create ANTHROPIC_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# OPENAI_API_KEY
echo -n "votre_clé_openai" | gcloud secrets create OPENAI_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# GITLAB_TOKEN
echo -n "votre_token_gitlab" | gcloud secrets create GITLAB_TOKEN \
  --data-file=- \
  --replication-policy="automatic"

# Donner accès au compte de service Cloud Run aux secrets
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GITLAB_TOKEN \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

### 6. Configurer les secrets GitHub

Dans votre repository GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez :

1. **GCP_PROJECT_ID**: Votre ID de projet Google Cloud
2. **GCP_SA_KEY**: Le contenu du fichier `key.json` créé précédemment
3. **GITLAB_URL**: `https://gitlab.com/api/v4`
4. **AI_MODEL**: Le modèle à utiliser (ex: `claude-3-5-sonnet-20241022` ou `gpt-4o`)

## Déploiement

### Déploiement automatique

Le déploiement se fait automatiquement via GitHub Actions sur les branches :

- `main`
- `feat/claude-ai`

À chaque push sur ces branches, l'application est automatiquement déployée.

### Déploiement manuel

Vous pouvez aussi déclencher un déploiement manuellement depuis l'onglet "Actions" de GitHub.

### Déploiement local (pour tester)

```bash
# Authentification
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build et push de l'image (IMPORTANT: utiliser --platform linux/amd64)
IMAGE_NAME="europe-west1-docker.pkg.dev/YOUR_PROJECT_ID/ai-gitlab-code-review/ai-gitlab-code-review:latest"
docker buildx build --platform linux/amd64 -t $IMAGE_NAME .
docker push $IMAGE_NAME

# Déployer sur Cloud Run
gcloud run deploy ai-gitlab-code-review \
  --image $IMAGE_NAME \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "GITLAB_URL=https://gitlab.com/api/v4" \
  --set-env-vars "AI_MODEL=claude-3-5-sonnet-20241022" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest" \
  --set-secrets "GITLAB_TOKEN=GITLAB_TOKEN:latest"
```

## Configuration du webhook GitLab

Une fois déployé, vous obtiendrez une URL Cloud Run (ex: `https://ai-gitlab-code-review-xxx.run.app`).

1. Allez dans votre projet GitLab
2. **Settings > Webhooks**
3. Ajoutez l'URL: `https://votre-url.run.app/gitlab-webhook`
4. Sélectionnez les événements: **Merge request events**
5. Ajoutez le token dans le champ **Secret token** (utilisez la valeur de `GITLAB_TOKEN`)

## Monitoring et logs

```bash
# Voir les logs
gcloud run services logs read ai-gitlab-code-review \
  --region europe-west1 \
  --limit 50

# Voir le statut du service
gcloud run services describe ai-gitlab-code-review \
  --region europe-west1

# Voir les métriques dans la console
https://console.cloud.google.com/run
```

## Coûts estimés

Cloud Run facture uniquement lorsque votre service traite des requêtes :

- **Requests**: ~$0.40 par million de requêtes
- **CPU**: ~$0.00002400 par vCPU-seconde
- **Memory**: ~$0.00000250 par GiB-seconde

Pour un usage de code review (quelques requêtes par jour), le coût devrait être **< $1-2/mois**.

## Mise à jour des secrets

```bash
# Mettre à jour un secret
echo -n "nouvelle_valeur" | gcloud secrets versions add ANTHROPIC_API_KEY --data-file=-

# Le service utilisera automatiquement la dernière version
```

## Variables d'environnement disponibles

- `ANTHROPIC_API_KEY`: Clé API Anthropic (optionnel si utilise OpenAI)
- `OPENAI_API_KEY`: Clé API OpenAI (optionnel si utilise Claude)
- `GITLAB_TOKEN`: Token d'API GitLab
- `GITLAB_URL`: URL de l'API GitLab
- `AI_MODEL`: Modèle à utiliser
- `PORT`: Port d'écoute (défini automatiquement par Cloud Run à 8080)

## Troubleshooting

### Erreur: "Container manifest type must support amd64/linux"

Si vous obtenez cette erreur lors du déploiement:

```
ERROR: Cloud Run does not support image: Container manifest type 'application/vnd.oci.image.index.v1+json' must support amd64/linux.
```

**Solution**: Utilisez `docker buildx` avec `--platform linux/amd64`:

```bash
docker buildx build --platform linux/amd64 -t $IMAGE_NAME .
```

Cette erreur apparaît généralement sur Mac avec processeur Apple Silicon (M1/M2/M3) car Docker construit par défaut pour `linux/arm64`. Cloud Run nécessite des images `linux/amd64`.

### Erreur: "Default STARTUP TCP probe failed" / "DEADLINE_EXCEEDED"

Si vous obtenez cette erreur:

```
Default STARTUP TCP probe failed 1 time consecutively for container "ai-gitlab-code-review-1" on port 8080.
The instance was not started. Connection failed with status DEADLINE_EXCEEDED.
```

**Causes possibles**:

1. L'application n'écoute pas sur le bon port
2. L'application met trop de temps à démarrer
3. L'endpoint de health check ne répond pas

**Solutions**:

- Vérifiez que l'application écoute sur `$PORT` (Cloud Run le définit automatiquement)
- Le Dockerfile est configuré pour utiliser le port 8080 par défaut
- Vérifiez les logs: `gcloud run services logs read ai-gitlab-code-review --region europe-west1`
- Testez l'endpoint `/health` localement avant de déployer

### Le service ne démarre pas

```bash
# Vérifier les logs
gcloud run services logs read ai-gitlab-code-review --region europe-west1

# Vérifier les variables d'environnement
gcloud run services describe ai-gitlab-code-review --region europe-west1
```

### Problèmes de permissions

```bash
# Vérifier les permissions du compte de service
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA_EMAIL}"
```

### Image ne se build pas

```bash
# Tester le build localement
docker build -t test-image .
docker run -p 3000:3000 test-image
```
