# AIfy Interiors - Deployment Guide

## Google Cloud Run Deployment

This guide covers deploying AIfy Interiors to Google Cloud Run with PostgreSQL on Cloud SQL.

---

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **GitHub repository** connected to Cloud Build
4. **Cloud SQL PostgreSQL instance** (microsaas-db)
5. **Firebase project** configured
6. **Stripe account** with products created
7. **OpenAI API key** with billing enabled

---

## Initial Setup

### 1. Enable Required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  containerregistry.googleapis.com
```

### 2. Set Project Variables

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
gcloud config set project $PROJECT_ID
```

---

## Secret Manager Configuration

Store all sensitive credentials in Secret Manager:

### 1. Database Connection

```bash
# Format: postgresql://USER:PASSWORD@/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
echo -n "postgresql://aifyinteriors_user:YOUR_PASSWORD@/aifyinteriors?host=/cloudsql/$PROJECT_ID:us-central1:microsaas-db" | \
  gcloud secrets create DATABASE_URL --data-file=-
```

### 2. OpenAI API Key

```bash
echo -n "sk-proj-..." | gcloud secrets create OPENAI_API_KEY --data-file=-
```

### 3. Stripe Keys

```bash
# Secret key
echo -n "sk_live_..." | gcloud secrets create STRIPE_SECRET_KEY --data-file=-

# Webhook secret
echo -n "whsec_..." | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-

# Price IDs
echo -n "price_..." | gcloud secrets create STRIPE_BASIC_PRICE_ID --data-file=-
echo -n "price_..." | gcloud secrets create STRIPE_PRO_PRICE_ID --data-file=-
```

### 4. Firebase Configuration

```bash
# Client config
echo -n "AIza..." | gcloud secrets create VITE_FIREBASE_API_KEY --data-file=-
echo -n "aifyinteriors.firebaseapp.com" | gcloud secrets create VITE_FIREBASE_AUTH_DOMAIN --data-file=-
echo -n "aifyinteriors" | gcloud secrets create VITE_FIREBASE_PROJECT_ID --data-file=-
echo -n "aifyinteriors.appspot.com" | gcloud secrets create VITE_FIREBASE_STORAGE_BUCKET --data-file=-
echo -n "123456789" | gcloud secrets create VITE_FIREBASE_MESSAGING_SENDER_ID --data-file=-
echo -n "1:123456789:web:abc123" | gcloud secrets create VITE_FIREBASE_APP_ID --data-file=-

# Service account key (JSON)
cat firebase-service-account.json | gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --data-file=-
```

### 5. Session Secret

```bash
openssl rand -base64 32 | gcloud secrets create SESSION_SECRET --data-file=-
```

### 6. Grant Cloud Run Access to Secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

for SECRET in DATABASE_URL OPENAI_API_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET \
              STRIPE_BASIC_PRICE_ID STRIPE_PRO_PRICE_ID SESSION_SECRET \
              VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_PROJECT_ID \
              VITE_FIREBASE_STORAGE_BUCKET VITE_FIREBASE_MESSAGING_SENDER_ID \
              VITE_FIREBASE_APP_ID FIREBASE_SERVICE_ACCOUNT_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Database Setup

### 1. Connect to Cloud SQL

```bash
gcloud sql connect microsaas-db --user=postgres
```

### 2. Create Database and User

```sql
CREATE DATABASE aifyinteriors;
CREATE USER aifyinteriors_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE aifyinteriors TO aifyinteriors_user;
```

### 3. Run Migrations

```bash
# Connect via Cloud SQL Proxy
cloud-sql-proxy microsaas-projects-2024:us-central1:microsaas-db &

# Run migrations
export DATABASE_URL="postgresql://aifyinteriors_user:PASSWORD@localhost:5432/aifyinteriors"
npm run db:push
```

### 4. Seed Initial Data

```bash
npm run seed
```

---

## Manual Deployment (First Time)

### 1. Build Docker Image

```bash
docker build -t gcr.io/$PROJECT_ID/aifyinteriors:latest .
```

### 2. Test Locally (Optional)

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e OPENAI_API_KEY="..." \
  -e STRIPE_SECRET_KEY="..." \
  gcr.io/$PROJECT_ID/aifyinteriors:latest
```

### 3. Push to Container Registry

```bash
docker push gcr.io/$PROJECT_ID/aifyinteriors:latest
```

### 4. Deploy to Cloud Run

```bash
gcloud run deploy aifyinteriors \
  --image gcr.io/$PROJECT_ID/aifyinteriors:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --set-cloudsql-instances=$PROJECT_ID:us-central1:microsaas-db \
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
```

---

## Automated CI/CD with Cloud Build

### 1. Connect GitHub Repository

```bash
# Navigate to Cloud Build in Google Cloud Console
# Connect your GitHub repository: akaash-nigam/msSaaS_aifyinteriors.com
# Create trigger for master branch
```

### 2. Create Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=msSaaS_aifyinteriors.com \
  --repo-owner=akaash-nigam \
  --branch-pattern="^master$" \
  --build-config=cloudbuild.yaml \
  --description="Deploy AIfy Interiors to Cloud Run on master push"
```

### 3. Verify Trigger

```bash
gcloud builds triggers list
```

### 4. Manual Trigger (Optional)

```bash
gcloud builds triggers run aifyinteriors-deploy --branch=master
```

---

## Domain Configuration

### 1. Map Custom Domain to Cloud Run

```bash
gcloud run domain-mappings create --service aifyinteriors --domain aifyinteriors.com --region us-central1
```

### 2. Update DNS Records

Add the following DNS records to your domain registrar:

```
Type: A
Name: @
Value: <IP from Cloud Run domain mapping>

Type: CNAME
Name: www
Value: ghs.googlehosted.com
```

### 3. Verify Domain Mapping

```bash
gcloud run domain-mappings describe --domain aifyinteriors.com --region us-central1
```

---

## Stripe Webhook Configuration

### 1. Get Cloud Run Service URL

```bash
gcloud run services describe aifyinteriors --region us-central1 --format="value(status.url)"
```

### 2. Configure Webhook in Stripe Dashboard

- Navigate to: https://dashboard.stripe.com/webhooks
- Click "Add endpoint"
- URL: `https://aifyinteriors.com/api/stripe/webhook`
- Events to listen to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Update Webhook Secret

```bash
# Copy webhook signing secret from Stripe
echo -n "whsec_..." | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-
```

---

## Monitoring and Logging

### 1. View Logs

```bash
gcloud run services logs read aifyinteriors --region us-central1 --limit 50
```

### 2. Real-time Logs

```bash
gcloud run services logs tail aifyinteriors --region us-central1
```

### 3. Monitor Metrics

```bash
# Open Cloud Run dashboard
gcloud run services describe aifyinteriors --region us-central1
```

### 4. Set Up Alerts

- Navigate to Cloud Monitoring
- Create alerts for:
  - Error rate > 5%
  - Response time > 2s (p95)
  - Memory usage > 80%
  - Request count spikes

---

## Cost Optimization

### 1. Current Configuration

- **Memory**: 1Gi ($0.00000250/GB-second)
- **CPU**: 1 vCPU ($0.00002400/vCPU-second)
- **Min instances**: 0 (scale to zero when idle)
- **Max instances**: 10
- **Timeout**: 300s (5 minutes)

### 2. Estimated Costs (Low Traffic)

- Cloud Run: ~$5-10/month (with scale to zero)
- Cloud SQL: ~$20/month (db-f1-micro)
- OpenAI DALL-E 3: $0.08 per HD image generation
- Stripe: 2.9% + $0.30 per transaction
- Total: ~$30-50/month + usage-based AI costs

### 3. Scale to Production

```bash
# Increase resources for production traffic
gcloud run services update aifyinteriors \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 50
```

---

## Health Checks

### 1. Service Health

```bash
curl https://aifyinteriors.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-13T..."
}
```

### 2. Database Health

```bash
curl https://aifyinteriors.com/api/health/db
```

---

## Rollback Procedure

### 1. List Revisions

```bash
gcloud run revisions list --service aifyinteriors --region us-central1
```

### 2. Rollback to Previous Revision

```bash
gcloud run services update-traffic aifyinteriors \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

---

## Troubleshooting

### Issue: Service won't start

```bash
# Check logs
gcloud run services logs read aifyinteriors --region us-central1 --limit 100

# Common issues:
# - Missing secrets
# - Database connection failure
# - Port mismatch (must use PORT env var)
```

### Issue: Database connection errors

```bash
# Verify Cloud SQL connection
gcloud sql instances describe microsaas-db

# Check IAM permissions
gcloud projects get-iam-policy $PROJECT_ID
```

### Issue: Build failures

```bash
# Check build logs
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

---

## Security Checklist

- [x] All secrets stored in Secret Manager (not environment variables)
- [x] Cloud SQL uses private IP (no public IP exposure)
- [x] Container runs as non-root user (nodejs:1001)
- [x] HTTPS enforced (Cloud Run default)
- [x] Firebase Auth tokens verified on every request
- [x] Rate limiting implemented (via middleware)
- [x] Input validation with Zod schemas
- [x] SQL injection prevention (Drizzle ORM parameterized queries)
- [x] CORS configured for allowed origins only
- [x] Stripe webhook signature verification

---

## Next Steps After Deployment

1. **Test end-to-end flow**:
   - Sign up with Google/email
   - Generate a design
   - Subscribe to Basic tier
   - Generate unlimited designs
   - Cancel subscription

2. **Monitor initial traffic**:
   - Watch error rates
   - Check DALL-E API costs
   - Verify webhook events

3. **Optimize performance**:
   - Enable CDN for static assets
   - Implement image compression
   - Add caching layer (Redis)

4. **Marketing setup**:
   - Configure Google Analytics
   - Set up email marketing (SendGrid)
   - Create social media accounts

---

## Support

For deployment issues:
- Check logs: `gcloud run services logs read aifyinteriors --region us-central1`
- Review Cloud Build: https://console.cloud.google.com/cloud-build
- Contact: support@aifyinteriors.com
