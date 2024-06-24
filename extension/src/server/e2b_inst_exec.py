import logging
from e2b_code_interpreter import CodeInterpreter
from dotenv import load_dotenv
import os
import json
import re
import asyncio
import websockets
import sys

load_dotenv()
api_key = os.getenv("E2B_API_KEY")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def handle_stdout(output):
    print(output.line, file=sys.stdout)
    sys.stdout.flush()
    return output.line

def handle_stderr(output):
    print(output.line, file=sys.stdout)
    sys.stdout.flush()
    return output.line

def initialize_sandbox():
    interpreter = CodeInterpreter(api_key=api_key)
    return interpreter

def execute_code(sandbox, installation, script):
    results = {
        "installation": {"on_stdout": [], "on_stderr": [], "result": None},
        "execution": {"on_stdout": [], "on_stderr": [], "result": None}
    }

    # Execute the installation
    installation_execution = sandbox.notebook.exec_cell(
        installation,
        on_stdout=lambda output: results["installation"]["on_stdout"].append(handle_stdout(output)),
        on_stderr=lambda output: results["installation"]["on_stderr"].append(handle_stderr(output))
    )

    # Check for installation errors
    if installation_execution.error:
        results["installation"]["result"] = {
            "error": f"{installation_execution.error.name}: {installation_execution.error.value}",
            "traceback": installation_execution.error.traceback
        }
    else:
        results["installation"]["result"] = "success"

        # Execute the script if installation was successful
        script_execution = sandbox.notebook.exec_cell(
            script,
            on_stdout=lambda output: results["execution"]["on_stdout"].append(handle_stdout(output)),
            on_stderr=lambda output: results["execution"]["on_stderr"].append(handle_stderr(output))
        )

        # Check for script errors
        if script_execution.error:
            results["execution"]["result"] = {
                "error": f"{script_execution.error.name}: {script_execution.error.value}",
                "traceback": script_execution.error.traceback
            }
        # Check for results
        elif script_execution.results:
            results["execution"]["result"] = [
                {
                    "is_main_result": result.is_main_result,
                    "text": result.text,
                    "formats": result.formats()
                }
                for result in script_execution.results
            ]
        # Check for logs if no results
        elif script_execution.logs.stdout or script_execution.logs.stderr:
            results["execution"]["result"] = {
                "stdout": script_execution.logs.stdout,
                "stderr": script_execution.logs.stderr
            }
        else:
            results["execution"]["result"] = "script execution did not return any output"
    # Filter logic
    if results.get("installation", {}).get("result") == "success":
        execution_result_filtered = results.get("execution", {}).get("result", {})
    else:
        execution_result_filtered = results.get("installation", {})
    print("EXECUTION_RESULT_FILTERED=",execution_result_filtered)
    return json.dumps(execution_result_filtered, indent=4)

def prepare_script_execution(sandbox, model_response: str):
    shell_commands_match = re.search(r'```bash(.*?)```', model_response, re.DOTALL)
    if shell_commands_match:
        shell_commands = shell_commands_match.group(1).strip()
        shell_commands = "\n".join([f"%pip {cmd.strip()[5:]}" if cmd.strip().startswith("# pip") else f"{cmd.strip()}" if cmd.strip().startswith("#") else f"%{cmd.strip()}" for cmd in shell_commands.split('\n')])
    else:
        shell_commands = ""

    # Extract script
    script = ""
    script_match = re.search(r'```python(.*?)```', model_response, re.DOTALL)
    print("script_match=", script_match)
    if script_match:
        script = script_match.group(1).strip()

    model_response_without_code = re.sub(r'```(bash|python|plaintext).*?```', '', model_response, flags=re.DOTALL).strip()

    execution_result = ""

    if script:
        # Call execute_code and add the results to the JSON
        execute_code(sandbox, shell_commands, script)
    else:
        print("Python blocks not found in the response.")

def main():
    model_response = sys.argv[1]  # Assuming the second argument is the model response
    sandbox = initialize_sandbox()
    # Execute the function
    execution_result_filtered = prepare_script_execution(sandbox, model_response)

    return execution_result_filtered

if __name__ == "__main__":
    main()
