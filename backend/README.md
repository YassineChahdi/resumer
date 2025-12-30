---
title: Resumer API
emoji: 📄
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Resumer API

FastAPI backend for resume tailoring and PDF generation.

## Endpoints
- `GET /health` - Health check
- `POST /tailor` - Tailor resume to job description
- `POST /export/pdf` - Export to PDF
- `POST /export/latex` - Export to LaTeX
