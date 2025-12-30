# Resumer
Resume building sandbox with AI-powered tailoring to job descriptions.

## Installation

**Requirements:** Python 3.10+, pdflatex

```bash
./setup_tex.sh # Install LaTeX
pip install -r backend/requirements.txt
```

## Quick Start

```bash
./launch.sh
```

## Tailoring logic

1. **Bullets** scored as a function of similarity and impressiveness.
2. **Experience/Projects** aggregate bullet scores.
3. **Skills** scored by keyword matching.
4. Content **sorted by score** and **trimmed** to fit.

## User Accounts (Optional)

Optionally sign in to persist your resume data across sessions. Without an account, data is stored locally in your browser. Logged-in users can:
- Save and load resumes.
- Delete their data at any time

## Templates

| Template | Description |
|----------|-------------|
| `jake` | Classic ATS-friendly format |
| `mirage` | Clean modern design |

## Data Format

```json
{
  "full_name": "Jane Doe",
  "contacts": { "email": "...", "github": "...", "linkedin": "..." },
  "education": [{ "est_name": "...", "degree": "...", "gpa": 3.8, "year": "..." }],
  "experience": [{ "employer": "...", "title": "...", "bullets": [{ "text": "...", "impressiveness": 0.8 }] }],
  "projects": [{ "title": "...", "languages": ["Python"], "bullets": [...] }],
  "technologies": [{ "text": "Docker" }],
  "languages": [{ "text": "Python" }]
}
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /tailor` | Tailor resume to job description |
| `POST /export/pdf` | Export to PDF |
| `POST /export/latex` | Export to LaTeX |
| `GET /templates` | List available templates |
| `GET /resumes` | List saved resumes (auth) |
| `POST /resumes` | Save resume (auth) |
| `DELETE /resumes/{id}` | Delete resume (auth) |
