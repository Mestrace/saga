import logging
import json
from importlib import metadata

APP_CONTEXT = {}

def handle_version(payload: dict) -> dict:
    """
    Handles the 'version' command. Returns the application version
    and logs the first 100 characters of the received payload for testing.
    
    Args:
        payload (dict): The data sent along with the command.
        
    Returns:
        dict: A structured response object.
    """
    payload_str = json.dumps(payload)
    logging.info(f"Received payload for 'version' command (first 100 chars): {payload_str[:100]}")

    try:
        app_version = metadata.version("pysaga")
    except metadata.PackageNotFoundError:
        app_version = "0.0.0-dev"

    response_data = {
        "application": "pysaga",
        "version": app_version
    }
    
    return {"status": "success", "data": response_data}