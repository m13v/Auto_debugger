from openai_client import openai_client_instance
import json

async def new_iteration(new_instructions: str, assistant_id: str, thread_id: str, websocket, iteration_data: dict, parameter: int):
    client = openai_client_instance

    message = client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=new_instructions
    )

    response_text = ""

    print(f"\nStarting response stream...")
    with client.beta.threads.runs.stream(
        thread_id=thread_id,
        assistant_id=assistant_id,
    ) as stream:
        for event in stream:
            if event.event == 'thread.message.delta':
                for delta in event.data.delta.content:
                    if delta.type == 'text':
                        response_text += delta.text.value
                        print(delta.text.value, end="", flush=True)
                        # Stream to iteration_data and websocket
                        iteration_data["iterations"][-1][parameter] = response_text
                        await websocket.send(json.dumps({"iteration_data": iteration_data}))
            elif event.event == 'thread.message.created':
                if event.data.content:
                    for content in event.data.content:
                        if content.type == 'text':
                            response_text += content.text.value
                            print(content.text.value, end="", flush=True)
                            # Stream to iteration_data and websocket
                            iteration_data["iterations"][-1][parameter] = response_text
                            await websocket.send(json.dumps({"iteration_data": iteration_data}))
            elif event.event == 'thread.run.completed':
                break
    print("\nResponse stream completed.")

    return iteration_data