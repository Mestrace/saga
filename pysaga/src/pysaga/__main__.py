import sys
import json
import logging
from pysaga.handlers import handle_version


# Basic logging setup to help with debugging later
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stderr)

def main():
    logging.info("PySaga application started. Listening for commands on stdin.")
    
    while True:
        try:
            # 1. Read a command from stdin
            # readline() blocks until a line is received
            line = sys.stdin.readline()

            # If readline() returns an empty string, it means stdin has been closed
            # (e.g., the parent Electron process has exited).
            if not line:
                logging.info("Stdin closed. Exiting application.")
                break
            
            # 2. Parse the JSON command
            try:
                request = json.loads(line)
                command = request.get("command")
                payload = request.get("payload", {})
                logging.info(f"Received command: '{command}'")

            except json.JSONDecodeError:
                logging.error(f"Failed to decode JSON from line: {line.strip()}")
                response = {"status": "error", "message": "Invalid JSON format."}
                continue
                
            # 3. Route the command to the appropriate handler
            response = {}
            if command == "version":
                response = handle_version(payload)
            else:
                logging.warning(f"Unknown command received: '{command}'")
                response = {"status": "error", "message": f"Unknown command: '{command}'"}

            # 4. Write the JSON response to stdout
            # Ensure the response is a single line terminated by a newline
            sys.stdout.write(json.dumps(response) + '\n')
            
            # Flush stdout to ensure the parent process receives the message immediately
            sys.stdout.flush()

        except KeyboardInterrupt:
            logging.info("KeyboardInterrupt received. Exiting.")
            break
        except Exception as e:
            # Catch any other unexpected errors to keep the loop alive
            logging.error(f"An unexpected error occurred in the main loop: {e}")
            # We might want to send an error response here too
            error_response = {"status": "error", "message": f"An unexpected error occurred: {e}"}
            sys.stdout.write(json.dumps(error_response) + '\n')
            sys.stdout.flush()


if __name__ == "__main__":
    main()