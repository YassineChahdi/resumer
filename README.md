# Resumer

## Goal
Build tailored resume from data, balancing impressiveness and similarity for given job descriptions.


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
Get resume metrics for job description from data file.

```python
from resumer import Resumer

with open("path/to/job_description", 'r') as f:
    job_desc = f.read()

resumer = Resumer(data_file_path="path/to/data_file")
resumer.populate_resume_metrics(job_desc)

print(resumer.resume)
```
