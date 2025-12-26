# Resumer
Build tailored resume from data, balancing impressiveness and similarity to given job descriptions.


## Organization

### Data
- Store dynamic data in JSON file.
- Store static data with resume skeleton in a tex file.

### Relevance Engine
Select the best resume content for a given job description.

#### Bullets
- Bullet relevance is scored as a function of its impressiveness and its similarity to the job description.
- Bullet impressiveness is subjectively attributed beforehand and independant of job description.
- Bullet similarity is calculated using Qwen3-Embedding-0.6B and depends on the job description.

#### Experience and Projects
- Experience/project relevance is scored as a function of its bullets' scores.

#### Skills
- Skill is scored as a function of its similarity to the job description.


## Usage
Build tailored resumes for different job descriptions.

```python
from resumer import Resumer

resumer = Resumer()

# Tailor resume to machine learning type job
with open("./data/job_desc_ML.txt", 'r') as f:
    job_desc_ml = f.read()

resumer.build_resume(job_desc_ml)
resumer.export_to_latex(output_path="./data/resume_ml.tex")

# Tailor resume to software engineering type job
with open("./data/job_desc_SWE.txt", 'r') as f:
    job_desc_swe = f.read()

resumer.build_resume(job_desc_swe)
resumer.export_to_latex(output_path="./data/resume_swe.tex")
```
