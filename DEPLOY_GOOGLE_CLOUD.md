# Google Cloud Run Deployment Guide: SFRT-Project

This guide outlines steps for building and deploying the SFRT React frontend to **Google Cloud Run** using Google **Artifact Registry** (recommended industry best practice).

---

## 1. Credentials Setup & Authentication

Log in and configure your target project:

```bash
gcloud auth login
gcloud config set project sfrt-auth
```

Enable the required APIs (Artifact Registry and Cloud Run):

```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

---

## 2. Artifact Registry Setup

Create a secure Docker repository in the `asia-southeast1` region:

```bash
gcloud artifacts repositories create sfrt-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Docker repository for SFRT application"
```

Configure your local Docker CLI to authenticate with the Artifact Registry:

```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

---

## 3. Container Build Compilation

Build the container image locally. Vite requires environment variables to be defined at compile-time. Replace the placeholders with your actual production credentials:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://gjsrlewvykcoltanklxg.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-supabase-anon-key" \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key" \
  -t asia-southeast1-docker.pkg.dev/sfrt-auth/sfrt-repo/sfrt-frontend:latest .
```

Push the compiled container image to your Artifact Registry repository:

```bash
docker push asia-southeast1-docker.pkg.dev/sfrt-auth/sfrt-repo/sfrt-frontend:latest
```

---

## 4. Deploy to Google Cloud Run

Deploy the container image to Cloud Run in region `asia-southeast1`:

```bash
gcloud run deploy sfrt-frontend \
  --image=asia-southeast1-docker.pkg.dev/sfrt-auth/sfrt-repo/sfrt-frontend:latest \
  --platform=managed \
  --region=asia-southeast1 \
  --allow-unauthenticated
```

---

## 5. Post-Deployment Verification Checklist

Perform these tests on the live production URL:

### 1. Login & Google OAuth Flow
- [ ] Access the landing page and click login.
- [ ] Verify redirects and session creation.
- [ ] Confirm authorized OAuth redirect URI contains the production domain.

### 2. Supabase Integration
- [ ] Check console logs for database connection errors.
- [ ] Confirm user profile loading and updates.

### 3. Google Maps API
- [ ] Verify map render and routing calculation services function.
- [ ] Restrict Google Maps API Key usage to referrer domains in GCP Console.

### 4. AI Assistant
- [ ] Test fleet status analysis queries.
- [ ] Confirm fallback to local data when Gemini is throttled.

### 5. Flow Testing
- [ ] Register vehicle -> Refuel flow -> Notifications verification.
