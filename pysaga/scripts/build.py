import subprocess
import os
import platform

# This script is designed to be run from the root of the project directory.

# Define the name for our final executable
APP_NAME = "pysaga"
# The entry point for our Python application
ENTRY_POINT = os.path.join("src", "pysaga", "__main__.py")

def build():
    """
    Builds the Python application into a single executable using PyInstaller.
    """
    print("Starting PyInstaller build process...")

    # Determine the executable name based on the OS
    executable_name = APP_NAME
    if platform.system() == "Windows":
        executable_name += ".exe"

    # Define the PyInstaller command
    # For a full list of options, see the PyInstaller documentation.
    pyinstaller_command = [
        "pyinstaller",
        "--name", executable_name,
        "--onefile",          # Bundle everything into a single executable
        "--clean",            # Clean PyInstaller caches before building
        "--distpath", os.path.join("dist", "python"), # Output folder for the final executable
        "--workpath", "build_py", # Folder for temporary build files
        ENTRY_POINT
    ]

    print(f"Running command: {' '.join(pyinstaller_command)}")

    try:
        # Execute the command
        subprocess.run(pyinstaller_command, check=True, text=True, capture_output=True)
        print("\nPyInstaller build completed successfully!")
        print(f"Executable created at: {os.path.join('dist', 'python', executable_name)}")
    except subprocess.CalledProcessError as e:
        print("\n--- PyInstaller Build Failed ---")
        print(f"Return Code: {e.returncode}")
        print("\n--- STDOUT ---")
        print(e.stdout)
        print("\n--- STDERR ---")
        print(e.stderr)
        print("------------------------------")
        
if __name__ == "__main__":
    build()