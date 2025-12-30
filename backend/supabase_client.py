"""
Supabase client initialization.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

supabase: Client | None = None

def get_supabase() -> Client:
    """Get or create Supabase client (service role for backend)."""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.")
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return supabase


def verify_jwt(token: str) -> dict | None:
    """
    Verify a Supabase JWT and return the user info.
    Returns None if invalid.
    """
    try:
        client = get_supabase()
        # Use the token to get user info
        user_response = client.auth.get_user(token)
        if user_response and user_response.user:
            return {"id": str(user_response.user.id), "email": user_response.user.email}
        return None
    except Exception:
        return None
