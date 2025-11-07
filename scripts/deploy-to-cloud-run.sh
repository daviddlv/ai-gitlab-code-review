#!/bin/bash

# Helper script to deploy to Google Cloud Run manually
# Usage: ./scripts/deploy-to-cloud-run.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AI GitLab Code Review - Cloud Run Deployment${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first:${NC}"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get configuration
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter region [europe-west1]: " REGION
REGION=${REGION:-europe-west1}
read -p "Enter service name [ai-gitlab-code-review]: " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-ai-gitlab-code-review}
read -p "Enter AI Model [claude-sonnet-4-5]: " AI_MODEL
AI_MODEL=${AI_MODEL:-claude-sonnet-4-5}
read -p "Enter Comment Mode [structured]: " COMMENT_MODE
COMMENT_MODE=${COMMENT_MODE:-structured}

echo -e "\n${YELLOW}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  AI Model: $AI_MODEL"
echo "  Comment Mode: $COMMENT_MODE"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Set project
echo -e "\n${YELLOW}🔧 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Build image
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME:$(git rev-parse --short HEAD)"
IMAGE_LATEST="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME:latest"

echo -e "\n${YELLOW}🏗️  Building Docker image for linux/amd64...${NC}"
docker buildx build --platform linux/amd64 -t $IMAGE_NAME -t $IMAGE_LATEST .

# Configure docker auth
echo -e "\n${YELLOW}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker $REGION-docker.pkg.dev

# Push image
echo -e "\n${YELLOW}📦 Pushing Docker image...${NC}"
docker push $IMAGE_NAME
docker push $IMAGE_LATEST

# Deploy to Cloud Run
echo -e "\n${YELLOW}🚢 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "GITLAB_URL=https://gitlab.com/api/v4" \
  --set-env-vars "AI_MODEL=$AI_MODEL" \
  --set-env-vars "COMMENT_MODE=$COMMENT_MODE" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest" \
  --set-secrets "GITLAB_TOKEN=GITLAB_TOKEN:latest"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Configure GitLab webhook: $SERVICE_URL/gitlab-webhook"
echo "2. Add your GITLAB_TOKEN as the webhook secret"
echo "3. Select 'Merge request events' in webhook settings"
echo ""
