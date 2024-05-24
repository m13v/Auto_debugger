from openai_client import openai_client_instance

def short_model_response(new_instructions: str, assistant_id: str, thread_id: str):
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
        max_completion_tokens=100
    ) as stream:
        for event in stream:
            if event.event == 'thread.message.delta':
                for delta in event.data.delta.content:
                    if delta.type == 'text':
                        response_text += delta.text.value
                        print(delta.text.value, end="", flush=True)
            elif event.event == 'thread.message.created':
                if event.data.content:
                    for content in event.data.content:
                        if content.type == 'text':
                            response_text += content.text.value
                            print(content.text.value, end="", flush=True)
            elif event.event == 'thread.run.completed':
                break
    print("\nResponse stream completed.")

    return response_text