from e2b_code_interpreter import CodeInterpreter
from dotenv import load_dotenv
import os
import asyncio
import websockets
import sys

load_dotenv()

api_key = os.getenv("E2B_API_KEY")

def handle_stdout(output):
    print(output.line, file=sys.stdout)
    sys.stdout.flush()

def initialize_sandbox():
    interpreter = CodeInterpreter(api_key=api_key)
    print("WebSocket URL:", interpreter._rpc.url)
    return interpreter, interpreter._rpc.url

def exec_cell(interpreter, code):
    # Assuming _rpc or _connect_rpc is used to connect to the WebSocket
    print("WebSocket URL for exec_cell:", interpreter._rpc.url)
    
    # Your existing code to execute the cell
    result = interpreter.exec_cell(code)
    return result

async def connect_to_websocket(ws_url):
    async with websockets.connect(ws_url) as websocket:
        print("WebSocket connection established")
        try:
            async for message in websocket:
                print(f"Received message: {message}")
        except websockets.ConnectionClosed:
            print("WebSocket connection closed")

async def main():
    interpreter, ws_url = initialize_sandbox()
    listener_task = asyncio.create_task(connect_to_websocket(ws_url))
    await asyncio.sleep(2)
    interpreter.notebook.exec_cell(
        "print('Hello, World!')",
        on_stdout=handle_stdout,
        on_stderr=handle_stdout
    )
    await listener_task

asyncio.run(main())

