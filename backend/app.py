import sys
import os

# Ensure backend/ is the root for module resolution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config import get_config
from routes.auth_routes import auth_bp

# ─────────────────────────────────────────
# Load environment variables
# ─────────────────────────────────────────
load_dotenv()


def create_app() -> Flask:
    """
    Application factory — creates and configures the Flask application.

    Steps:
    - Loads configuration from environment
    - Configures CORS
    - Registers all blueprints
    - Registers global error handlers
    - Adds a health check endpoint

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)

    # ── Load config ──────────────────────────────────────────
    config = get_config()
    app.config.from_object(config)

    # ── CORS ─────────────────────────────────────────────────
    CORS(
        app,
        resources={r"/api/*": {"origins": config.CORS_ORIGINS}},
        supports_credentials=True,
    )

    # ── Register Blueprints ──────────────────────────────────
    app.register_blueprint(auth_bp)

    # ── Health Check ─────────────────────────────────────────
    @app.route("/health", methods=["GET"])
    def health_check():
        """GET /health — Verify that the server is running."""
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Medical Diagnosis API is running.",
                    "status": "healthy",
                }
            ),
            200,
        )

    # ── 404 Handler ──────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "The requested endpoint does not exist.",
                }
            ),
            404,
        )

    # ── 405 Handler ──────────────────────────────────────────
    @app.errorhandler(405)
    def method_not_allowed(error):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "HTTP method not allowed on this endpoint.",
                }
            ),
            405,
        )

    # ── 500 Handler ──────────────────────────────────────────
    @app.errorhandler(500)
    def internal_server_error(error):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "An internal server error occurred. Please try again later.",
                }
            ),
            500,
        )

    # ── 400 Handler ──────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(error):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Bad request. Please check your input.",
                }
            ),
            400,
        )

    return app


# ─────────────────────────────────────────
# Application Entry Point
# ─────────────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    print(f"\n🏥 Medical Diagnosis API starting on http://127.0.0.1:{port}")
    print(f"   Environment : {os.getenv('FLASK_ENV', 'development')}")
    print(f"   Debug mode  : {debug}")
    print(f"   Health check: http://127.0.0.1:{port}/health\n")

    app.run(host="0.0.0.0", port=port, debug=debug)
