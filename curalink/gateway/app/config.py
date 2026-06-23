import os

SPRING_SERVICE_URL = os.getenv("SPRING_SERVICE_URL", "http://localhost:8081").rstrip("/")
GATEWAY_HOST = os.getenv("GATEWAY_HOST", "0.0.0.0")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", "8080"))
