from supabase import create_client, Client
from config import get_config

_supabase_client: Client = None


def get_supabase_client() -> Client:
    """
    Returns a singleton Supabase client instance.
    Initializes the client on first call using environment configuration.
    """
    global _supabase_client

    if _supabase_client is None:
        config = get_config()
        url = config.SUPABASE_URL
        key = config.SUPABASE_KEY

        if not url or not key:
            raise EnvironmentError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables."
            )

        _supabase_client = create_client(url, key)

    return _supabase_client
