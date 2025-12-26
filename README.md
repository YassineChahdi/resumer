# Resumer
Build tailored resume from data, balancing impressiveness and similarity to given job descriptions.


## Organization

### Data
- Store dynamic data in JSON file.
- Store static data with resume skeleton in a tex file.

### Relevance Engine
Select the best resume content for a given job description.

#### Experience and Projects
- Experience/project relevance is scored as a function of its bullets' scores.

#### Bullets
- Bullet relevance is scored as a function of its impressiveness and its similarity to the job description.
- Bullet impressiveness is subjectively attributed beforehand and independant of job description.
- Bullet similarity is calculated using Qwen3-Embedding-0.6B and depends on the job description.

#### Skills
- Skill is scored as a function of its similarity to the job description.


## Usage
Tailor resume to a given job description.

### Installation
```bash
pip install -r requirements.txt
```

#### MacOS
```bash
brew install texlive
```

#### Windows
```bash
choco install miktex
```

#### Linux
```bash
sudo apt-get install texlive
```

### Execution
```python
from resumer import Resumer

resumer = Resumer()
resume = resumer.load_resume(data_file_path="./data/my_data.json")

# Tailor resume to machine learning type job
with open("./data/job_desc_ML.txt", 'r') as f:
    job_desc_ml = f.read()
resumer.build_resume(resume, job_desc_ml)
resumer.export_to_pdf(resume, output_path="./data/resume_ml.pdf")

# Tailor resume to software engineering type job
with open("./data/job_desc_SWE.txt", 'r') as f:
    job_desc_swe = f.read()
resumer.build_resume(resume, job_desc_swe)
resumer.export_to_pdf(resume, output_path="./data/resume_swe.pdf")
```
