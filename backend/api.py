from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from resumer import Resumer
from models import Resume
import tempfile
import os
from dotenv import load_dotenv

load_dotenv()

# Optional Supabase import - gracefully degrade if not configured
try:
    from supabase_client import get_supabase, verify_jwt
    SUPABASE_ENABLED = True
except ImportError:
    SUPABASE_ENABLED = False
    get_supabase = None
    verify_jwt = None

app = FastAPI(title="Resumer API", description="Resume tailoring API")

# CORS configuration - use ALLOWED_ORIGINS env var in production (comma-separated)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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


class SaveResumeRequest(BaseModel):
    name: str = "Untitled Resume"
    resume_type: str = "general"  # "general" or "tech"
    full_resume: dict
    tailored_resume: Optional[dict] = None


class UpdateResumeRequest(BaseModel):
    name: Optional[str] = None
    resume_type: Optional[str] = None  # "general" or "tech"
    full_resume: Optional[dict] = None
    tailored_resume: Optional[dict] = None


# --- Auth Dependency ---

async def get_current_user(authorization: str = Header(None)) -> dict:
    """Extract and verify user from Authorization header."""
    if not SUPABASE_ENABLED:
        raise HTTPException(status_code=503, detail="Supabase not configured. Install supabase package and set credentials.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.replace("Bearer ", "")
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


# --- Endpoints ---

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "service": "resumer-api"}


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


# --- Resume CRUD Endpoints (Auth Required) ---

@app.get("/resumes")
async def list_resumes(user: dict = Depends(get_current_user)):
    """List all resumes for the authenticated user."""
    try:
        supabase = get_supabase()
        result = supabase.table("resumes").select("id, name, created_at, updated_at").eq("user_id", user["id"]).order("updated_at", desc=True).execute()
        return {"resumes": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/resumes")
async def save_resume(request: SaveResumeRequest, user: dict = Depends(get_current_user)):
    """Save a new resume."""
    try:
        supabase = get_supabase()
        result = supabase.table("resumes").insert({
            "user_id": user["id"],
            "name": request.name,
            "resume_type": request.resume_type,
            "full_resume": request.full_resume,
            "tailored_resume": request.tailored_resume
        }).execute()
        return {"resume": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/resumes/{resume_id}")
async def get_resume(resume_id: str, user: dict = Depends(get_current_user)):
    """Get a specific resume by ID."""
    try:
        supabase = get_supabase()
        result = supabase.table("resumes").select("*").eq("id", resume_id).eq("user_id", user["id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        return {"resume": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/resumes/{resume_id}")
async def update_resume(resume_id: str, request: UpdateResumeRequest, user: dict = Depends(get_current_user)):
    """Update an existing resume."""
    try:
        supabase = get_supabase()
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        update_data["updated_at"] = "now()"
        result = supabase.table("resumes").update(update_data).eq("id", resume_id).eq("user_id", user["id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        return {"resume": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, user: dict = Depends(get_current_user)):
    """Delete a resume."""
    try:
        supabase = get_supabase()
        result = supabase.table("resumes").delete().eq("id", resume_id).eq("user_id", user["id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Helpers ---

def _get_template_path(template_name: str) -> str:
    """Get full path to template file."""
    # Template directory relative to this file (backend/api.py)
    # backend/../data/templates/ -> data/templates/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level from backend/ to root, then into data/templates
    default_templates_dir = os.path.join(base_dir, "..", "data", "templates")
    # For Docker or explicit override:
    templates_dir = os.getenv("TEMPLATES_DIR", default_templates_dir)
    templates = {
        "jake": f"{templates_dir}/jake_template.tex",
        "mirage": f"{templates_dir}/mirage_template.tex",
    }
    if template_name not in templates:
        raise HTTPException(status_code=400, detail=f"Unknown template: {template_name}")
    return templates[template_name]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
