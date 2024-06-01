import asyncio
import websockets
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

async def handler(websocket, path):
    logging.info(f"New connection from {path}")
    try:
        async for message in websocket:
            logging.info(f"Received message: {message}")
            await websocket.send(f"Echo: {message}")
    except websockets.ConnectionClosed as e:
        logging.info(f"Connection closed: {e}")

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        logging.info("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())