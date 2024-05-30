import asyncio

async def fetch_data():
    print("Start fetching data...")
    await asyncio.sleep(2)  # Simulate an I/O-bound operation
    print("Data fetched!")
    return "Some data"

async def main():
    result = await fetch_data()
    print(result)

# Run the main coroutine
asyncio.run(main())