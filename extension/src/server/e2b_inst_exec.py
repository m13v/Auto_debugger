import logging
from e2b_code_interpreter import CodeInterpreter
from dotenv import load_dotenv
import os
import json
import re
import asyncio
import websockets
import sys

# Global variable to hold the WebSocket connection
# websocket_connection = None

# async def initialize_websocket():
#     global websocket_connection
#     uri = "ws://localhost:8766"
#     websocket_connection = await websockets.connect(uri)
#     print("WebSocket (8766) connection established")

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
api_key = os.getenv("E2B_API_KEY")

# Set up logging
# logging.basicConfig(level=logging.INFO, filename='app.log', filemode='w', format='%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def handle_stdout(output):
    print(output.line, file=sys.stdout)
    sys.stdout.flush()
    # logger.info(output.line)
    # global websocket_connection
    # message = output.line
    # if websocket_connection:
    #     websocket_connection.send(message)
    #     print(f"Sent message: {message}")
    # else:
    #     print("WebSocket (8766) connection not established")
    return output.line

def handle_stderr(output):
    print(output.line, file=sys.stdout)
    sys.stdout.flush()
    # logger.error(output.line)
    # global websocket_connection
    # message = output.line
    # if websocket_connection:
    #     websocket_connection.send(message)
    #     print(f"Sent message: {message}")
    # else:
    #     print("WebSocket (8766) connection not established")
    return output.line

def initialize_sandbox():
    interpreter = CodeInterpreter(api_key=api_key)
    return interpreter

# async def execute_code(sandbox, installation, script):
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

        # yield json.dumps(results, indent=4)
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
            # print("RESULTS:")
            # print(results)
            results["execution"]["result"] = "script execution did not return any output"
    # Filter logic
    if results.get("installation", {}).get("result") == "success":
        execution_result_filtered = results.get("execution", {}).get("result", {})
    else:
        execution_result_filtered = results.get("installation", {})
    print("EXECUTION_RESULT_FILTERED=",execution_result_filtered)
    # yield json.dumps(execution_result_filtered, indent=4)
    # return
    return json.dumps(execution_result_filtered, indent=4)

# async def prepare_script_execution(sandbox, model_response: str):
def prepare_script_execution(sandbox, model_response: str):
    # Run the WebSocket initialization
    # await initialize_websocket()

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

    # Extract sample terminal output
    # terminal_output_match = re.search(r'```plaintext(.*?)```', model_response, re.DOTALL)
    # terminal_output = terminal_output_match.group(1).strip() if terminal_output_match else ""

    model_response_without_code = re.sub(r'```(bash|python|plaintext).*?```', '', model_response, flags=re.DOTALL).strip()

    execution_result = ""

    # if script:
    #     # Call execute_code and stream the results
    #     async for interim_result in execute_code(sandbox, shell_commands, script):
    #         yield interim_result
    # else:
    #     print("Python blocks not found in the response.")
    #     yield None
    if script:
        # Call execute_code and add the results to the JSON
        # print("SHELL=", shell_commands)
        # print("SCRIPT=", script)
        execute_code(sandbox, shell_commands, script)
        # execution_result_filtered = execute_code(sandbox, shell_commands, script)
        # for interim_result in execute_code(sandbox, shell_commands, script):
        #     print("INTERIM_RESULT=", interim_result)
        #     yield interim_result
        # print("execution_result=", execution_result_filtered[:30], "...| model_response=", model_response[:30], "...|")
        # return execution_result_filtered, model_response_without_code
    else:
        print("Python blocks not found in the response.")
        # return None, model_response_without_code

def main():
    # print("subprocess started")
    # sandbox = sys.argv[1]  # Assuming the first argument is the sandbox
    model_response = sys.argv[1]  # Assuming the second argument is the model response
    sandbox = initialize_sandbox()
    # Execute the function
    execution_result_filtered = prepare_script_execution(sandbox, model_response)

    # Print the result so it can be captured by subprocess
    # print("execution_result_filtered=", json.dumps(execution_result_filtered))

    return execution_result_filtered

if __name__ == "__main__":
    main()

# if __name__ == "__main__":
#     # Example usage
#     installation = """
#     # Install boto3 package
#     %pip install boto3
#     """

#     script = """
#     import boto3
#     from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError

#     # AWS Credentials – hardcode here for demonstration purposes only
#     # It's recommended to use IAM roles or environment variables for security.
#     AWS_ACCESS_KEY = 'your-access-key'
#     AWS_SECRET_KEY = 'your-secret-key'
#     BUCKET_NAME = 'your-bucket-name'

#     # Initialize the S3 client
#     s3_client = boto3.client('s3', 
#                             aws_access_key_id=AWS_ACCESS_KEY,
#                             aws_secret_access_key=AWS_SECRET_KEY)

#     def upload_file(file_name, bucket, object_name=None):
#         \"\"\"Upload a file to an S3 bucket\"\"\"
#         try:
#             if object_name is None:
#                 object_name = file_name
#             s3_client.upload_file(file_name, bucket, object_name)
#             print(f"File {file_name} uploaded to {bucket}/{object_name}")
#         except FileNotFoundError:
#             print(f"The file {file_name} was not found")
#         except NoCredentialsError:
#             print("Credentials not available")
#         except ClientError as e:
#             print(f"ClientError: {e}")

#     def download_file(bucket, object_name, file_name):
#         \"\"\"Download a file from an S3 bucket\"\"\"
#         try:
#             s3_client.download_file(bucket, object_name, file_name)
#             print(f"File {file_name} downloaded from {bucket}/{object_name}")
#         except FileNotFoundError:
#             print(f"The file {file_name} was not found")
#         except NoCredentialsError:
#             print("Credentials not available")
#         except ClientError as e:
#             print(f"ClientError: {e}")

#     def list_files(bucket):
#         \"\"\"List files in an S3 bucket\"\"\"
#         try:
#             response = s3_client.list_objects_v2(Bucket=bucket)
#             if 'Contents' in response:
#                 for obj in response['Contents']:
#                     print(obj['Key'])
#             else:
#                 print(f"No files found in bucket {bucket}")
#         except NoCredentialsError:
#             print("Credentials not available")
#         except ClientError as e:
#             print(f"ClientError: {e}")

#     # Example usage:
#     # upload_file('test.txt', BUCKET_NAME)
#     # download_file(BUCKET_NAME, 'test.txt', 'downloaded_test.txt')
#     # list_files(BUCKET_NAME)
#     """
#     sandbox = initialize_sandbox()  
#     result = execute_code(sandbox, installation, script)
#     print(result)

