from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from resumer import Resumer
from models import Resume
import tempfile
import os

app = FastAPI(title="Resumer API", description="Resume tailoring API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize resumer once (loads embedding model)
resumer = Resumer()


# --- Request Models ---

class TailorRequest(BaseModel):
    resume: dict
    job_description: str
    exp_bullet_count: int = 7
    proj_bullet_count: int = 5
    tech_count: int = 5
    lang_count: int = 5


class ExportRequest(BaseModel):
    resume: dict
    template: str = "jake"  # "jake" or "mirage"


# --- Endpoints ---

@app.post("/tailor")
def tailor_resume(request: TailorRequest):
    """
    Tailor resume to job description.
    Returns the tailored resume as JSON.
    """
    try:
        resume = Resume(request.resume)
        tailored = resumer.tailor_resume(
            resume,
            request.job_description,
            request.exp_bullet_count,
            request.proj_bullet_count,
            request.tech_count,
            request.lang_count
        )
        return tailored.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/export/pdf")
def export_pdf(request: ExportRequest):
    """
    Export resume to PDF.
    Returns PDF bytes.
    """
    try:
        resume = Resume(request.resume)
        template_path = _get_template_path(request.template)
        
        # Generate PDF to temp file and return bytes
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            resumer.export_to_pdf(resume, template_path=template_path, output_path=tmp_path)
            with open(tmp_path, "rb") as f:
                pdf_bytes = f.read()
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=resume.pdf"}
            )
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/export/latex")
def export_latex(request: ExportRequest):
    """
    Export resume to LaTeX.
    Returns LaTeX string.
    """
    try:
        resume = Resume(request.resume)
        template_path = _get_template_path(request.template)
        latex_content = resumer.resume_to_latex_from_template(resume, template_path)
        return Response(
            content=latex_content,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=resume.tex"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/templates")
def list_templates():
    """List available templates."""
    return {"templates": ["jake", "mirage"]}


# --- Helpers ---

def _get_template_path(template_name: str) -> str:
    """Get full path to template file."""
    templates = {
        "jake": "../data/templates/jake_template.tex",
        "mirage": "../data/templates/mirage_template.tex",
    }
    if template_name not in templates:
        raise HTTPException(status_code=400, detail=f"Unknown template: {template_name}")
    return templates[template_name]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
