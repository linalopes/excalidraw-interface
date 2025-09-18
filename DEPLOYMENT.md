# Deployment Guide

## Deploy to Vercel (Recommended)

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import the `excalidraw-interface` repository

2. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy**:
   - Click "Deploy"
   - Your app will be available at `https://your-project-name.vercel.app`

## Deploy to Netlify

1. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in with your GitHub account
   - Click "New site from Git"
   - Select the `excalidraw-interface` repository

2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`

3. **Deploy**:
   - Click "Deploy site"
   - Your app will be available at `https://your-project-name.netlify.app`

## Deploy to GitHub Pages

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Source: "GitHub Actions"

2. **Create GitHub Action**:
   - Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. **Deploy**:
   - Push to main branch
   - Your app will be available at `https://linalopes.github.io/excalidraw-interface`

## Environment Variables

No environment variables are required for this project.

## Custom Domain

After deployment, you can configure a custom domain in your hosting platform's settings.
