#!/bin/bash

# AIfy Interiors - Manual Deployment Script for Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-"microsaas-projects-2024"}
REGION="us-central1"
SERVICE_NAME="aifyinteriors"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${GREEN}🚀 Deploying AIfy Interiors to Google Cloud Run${NC}"
echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Step 1: Set project
echo -e "${GREEN}📋 Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Step 2: Build Docker image
echo -e "${GREEN}🔨 Building Docker image...${NC}"
docker build -t $IMAGE_NAME:latest .

# Step 3: Push to Container Registry
echo -e "${GREEN}📤 Pushing image to GCR...${NC}"
docker push $IMAGE_NAME:latest

# Step 4: Deploy to Cloud Run
echo -e "${GREEN}🌐 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --set-cloudsql-instances=$PROJECT_ID:$REGION:microsaas-db \
  --set-env-vars=NODE_ENV=production \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest \
  --set-secrets=OPENAI_API_KEY=OPENAI_API_KEY:latest \
  --set-secrets=STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest \
  --set-secrets=STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest \
  --set-secrets=SESSION_SECRET=SESSION_SECRET:latest \
  --set-secrets=VITE_FIREBASE_API_KEY=VITE_FIREBASE_API_KEY:latest \
  --set-secrets=VITE_FIREBASE_AUTH_DOMAIN=VITE_FIREBASE_AUTH_DOMAIN:latest \
  --set-secrets=VITE_FIREBASE_PROJECT_ID=VITE_FIREBASE_PROJECT_ID:latest \
  --set-secrets=VITE_FIREBASE_STORAGE_BUCKET=VITE_FIREBASE_STORAGE_BUCKET:latest \
  --set-secrets=VITE_FIREBASE_MESSAGING_SENDER_ID=VITE_FIREBASE_MESSAGING_SENDER_ID:latest \
  --set-secrets=VITE_FIREBASE_APP_ID=VITE_FIREBASE_APP_ID:latest \
  --set-secrets=FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest \
  --set-secrets=STRIPE_BASIC_PRICE_ID=STRIPE_BASIC_PRICE_ID:latest \
  --set-secrets=STRIPE_PRO_PRICE_ID=STRIPE_PRO_PRICE_ID:latest

# Step 5: Get service URL
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
echo -e "${GREEN}🌍 Service URL: $SERVICE_URL${NC}"

# Step 6: Test health endpoint
echo ""
echo -e "${GREEN}🏥 Testing health endpoint...${NC}"
sleep 5  # Wait for service to be ready
curl -f $SERVICE_URL/api/health || echo -e "${RED}❌ Health check failed${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure Stripe webhook: $SERVICE_URL/api/stripe/webhook"
echo "2. Update Firebase authorized domains: $SERVICE_URL"
echo "3. Run database migrations if needed"
echo "4. Seed initial data: npm run seed"
