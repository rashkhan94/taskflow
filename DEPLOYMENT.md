# Deployment Guide for TaskFlow

This guide explains how to deploy TaskFlow to **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

## Prerequisites
- GitHub Account
- Vercel Account
- Render Account
- MongoDB Atlas Account

---

## Step 1: Database (MongoDB Atlas)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **New Cluster** (Shared/Free tier is fine).
3.  **Database Access**: Create a database user (e.g., `taskflow_user`) and password.
4.  **Network Access**: Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) to enable Render connection.
5.  **Get Connection String**:
    - Click **Connect** > **Drivers**.
    - Copy the string (e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).
    - Replace `<password>` with your actual password.

---

## Step 2: Push Code to GitHub
1.  Create a new repository on GitHub (e.g., `taskflow`).
2.  Push your local code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
    git branch -M main
    git push -u origin main
    ```

---

## Step 3: Backend Deployment (Render)
1.  Log in to [Render](https://render.com).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    - **Name**: `taskflow-api`
    - **Root Directory**: `server`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node src/server.js`
5.  **Environment Variables**:
    - Key: `MONGODB_URI`, Value: (Your Atlas Connection String)
    - Key: `JWT_SECRET`, Value: (A long random string)
    - Key: `NODE_ENV`, Value: `production`
    - Key: `CLIENT_URL`, Value: `https://your-frontend.vercel.app` (Add later)
6.  Click **Create Web Service**.
7.  Copy the **Service URL** (e.g., `https://taskflow-api.onrender.com`).

---

## Step 4: Frontend Deployment (Vercel)
1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New...** > **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset**: Vite
    - **Root Directory**: `client` (Important!)
5.  **Environment Variables**:
    - Key: `VITE_API_URL`, Value: (Your Render Backend URL, e.g., `https://taskflow-api.onrender.com`)
6.  Click **Deploy**.

---

## Step 5: Final Configuration
1.  Once Frontend is deployed, copy its URL (e.g., `https://taskflow-frontend.vercel.app`).
2.  Go back to **Render** > **Environment**.
3.  Update/Add `CLIENT_URL` with your Vercel URL.
4.  **Redeploy** the backend (manual deploy might be needed after env var change).

## 🎉 Done!
Your application is now live.
