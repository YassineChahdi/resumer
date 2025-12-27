# Resumer
Build tailored resumes from structured data, balancing impressiveness and similarity to job descriptions.

## How Scoring Works

1. **Bullets** are scored by combining:
   - `impressiveness` — subjectively assigned beforehand (0-1)
   - `similarity` — computed via embeddings against the job description (0-1)
   - Formula: `score = sim * 0.4 + imp * 0.6`

2. **Experience/Projects** aggregate their bullets' scores

3. **Skills** are scored by keyword matching against the job description

4. Content is **sorted by score** and **trimmed** to fit the resume

## Templates

| Template | Description |
|----------|-------------|
| `jake_template.tex` | Classic ATS-friendly format |
| `mirage_template.tex` | Clean modern design |

## Data Format

Resume data is stored in JSON. See [`data/data.json`](data/data.json) for the full schema.

```json
{
  "full_name": "Jane Doe",
  "contacts": { "email": "...", "phone": "...", "github": "...", "linkedin": "..." },
  "education": [{ "est_name": "...", "degree": "...", "gpa": 3.8, "year": "..." }],
  "experience": [{
    "employer": "...",
    "title": "...",
    "bullets": [{ "text": "...", "impressiveness": 0.8 }]
  }],
  "projects": [{ "title": "...", "languages": ["Python"], "bullets": [...] }],
  "technologies": [{ "text": "Docker" }],
  "languages": [{ "text": "Python" }]
}
```

## Installation

**Requirements:** Python 3.10+, pdflatex

```bash
# Install LaTeX (macOS)
./setup_tex.sh

# Install Python dependencies
pip install -r requirements.txt
```

## Quick Start

```python
from resumer import Resumer

resumer = Resumer()
resume = resumer.load_resume("./data/data.json")

# Tailor resume to machine learning type job in Jake's resume format
with open("./data/job_desc_ML.txt", 'r') as f:
    job_desc_ml = f.read()
resume = resumer.tailor_resume(resume, job_desc_ml)
resumer.export_to_pdf(resume, template_path="./data/jake.tex", output_path="./data/resume_ml.pdf")

# Tailor resume to software engineering type job in Mirage resume format
with open("./data/job_desc_SWE.txt", 'r') as f:
    job_desc_swe = f.read()
resume = resumer.tailor_resume(resume, job_desc_swe)
resumer.export_to_pdf(resume, template_path="./data/mirage_template.tex", output_path="./data/resume_swe.pdf")
```

## Export Methods

```python
resumer.export_to_pdf(resume, template_path="...", output_path="...")
resumer.export_to_latex(resume, template_path="...", output_path="...")
resumer.export_to_json(resume, output_path="...")
```
