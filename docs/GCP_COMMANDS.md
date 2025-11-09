# Google Cloud Run - Quick Reference

## Initial Setup

### 1. Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Artifact Registry

```bash
export PROJECT_ID="your-project-id"
export REGION="europe-west1"
export SERVICE_NAME="ai-gitlab-code-review"

gcloud artifacts repositories create $SERVICE_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for AI GitLab Code Review"
```

### 3. Create Secrets

```bash
# Anthropic API Key
echo -n "your-anthropic-key" | gcloud secrets create ANTHROPIC_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# OpenAI API Key
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# GitLab Token
echo -n "your-gitlab-token" | gcloud secrets create GITLAB_TOKEN \
  --data-file=- \
  --replication-policy="automatic"
```

## Deployment Commands

### Quick Deploy (using helper script)

```bash
./scripts/deploy-to-cloud-run.sh
```

### Manual Deploy

```bash
# Build and push (force linux/amd64 for Cloud Run compatibility)
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME:latest"
docker buildx build --platform linux/amd64 -t $IMAGE_NAME .
docker push $IMAGE_NAME

# Deploy
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "GITLAB_URL=https://gitlab.com/api/v4,AI_MODEL=claude-3-5-sonnet-20241022" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,GITLAB_TOKEN=GITLAB_TOKEN:latest"
```

### Deploy with Cloud Build

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Service Management

### View Service Details

```bash
gcloud run services describe $SERVICE_NAME --region $REGION
```

### Get Service URL

```bash
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format='value(status.url)'
```

### Update Service (without rebuilding)

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars "AI_MODEL=gpt-4o"
```

### Update Traffic Split (for canary deployments)

```bash
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --to-revisions REVISION-001=50,REVISION-002=50
```

### Delete Service

```bash
gcloud run services delete $SERVICE_NAME --region $REGION
```

## Logs and Monitoring

### Stream Logs

```bash
gcloud run services logs tail $SERVICE_NAME --region $REGION
```

### Read Recent Logs

```bash
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --limit 100
```

### Filter Logs by Severity

```bash
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --log-filter='severity>=ERROR'
```

### View Metrics in Console

```bash
# Open in browser
open "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
```

## Secret Management

### Update a Secret

```bash
echo -n "new-value" | gcloud secrets versions add ANTHROPIC_API_KEY --data-file=-
```

### List Secret Versions

```bash
gcloud secrets versions list ANTHROPIC_API_KEY
```

### Access Secret Value

```bash
gcloud secrets versions access latest --secret="ANTHROPIC_API_KEY"
```

### Delete Old Secret Versions

```bash
gcloud secrets versions destroy 1 --secret="ANTHROPIC_API_KEY"
```

## Scaling and Performance

### Set Min/Max Instances

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --min-instances 1 \
  --max-instances 20
```

### Set CPU and Memory

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --cpu 2 \
  --memory 1Gi
```

### Set Timeout

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --timeout 600
```

### Set Concurrency

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --concurrency 100
```

## Testing

### Test Locally with Docker

```bash
# Build for the right platform
docker buildx build --platform linux/amd64 -t test-image .

# Run locally
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY="your-key" \
  -e GITLAB_TOKEN="your-token" \
  -e GITLAB_URL="https://gitlab.com/api/v4" \
  -e AI_MODEL="claude-3-5-sonnet-20241022" \
  test-image
```

### Test Health Endpoint

```bash
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
curl $SERVICE_URL/health
```

### Test Webhook Endpoint

```bash
curl -X POST $SERVICE_URL/gitlab-webhook \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: your-token" \
  -d @test-payload.json
```

## Troubleshooting

### Check Service Status

```bash
gcloud run services describe $SERVICE_NAME --region $REGION
```

### View Environment Variables

```bash
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format='value(spec.template.spec.containers[0].env)'
```

### Check IAM Permissions

```bash
gcloud run services get-iam-policy $SERVICE_NAME --region $REGION
```

### Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list --service $SERVICE_NAME --region $REGION

# Rollback
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --to-revisions PREVIOUS-REVISION=100
```

## Cost Optimization

### Set Scale-to-Zero

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --min-instances 0
```

### Use CPU Allocation (only allocate CPU during requests)

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --cpu-throttling
```

### Check Current Costs

```bash
# View in console
open "https://console.cloud.google.com/billing/reports?project=$PROJECT_ID"
```

## CI/CD Integration

### Trigger GitHub Actions Deploy

```bash
# Push to main or feat/claude-ai branch
git push origin main
```

### Manual GitHub Actions Trigger

Go to: https://github.com/YOUR_USERNAME/ai-gitlab-code-review/actions

## Useful Links

- Cloud Run Console: https://console.cloud.google.com/run
- Cloud Build History: https://console.cloud.google.com/cloud-build/builds
- Secret Manager: https://console.cloud.google.com/security/secret-manager
- Artifact Registry: https://console.cloud.google.com/artifacts
- Logs Explorer: https://console.cloud.google.com/logs
