from openai import OpenAI
from typing_extensions import override
from openai import AssistantEventHandler

from openai_client import openai_client_instance

def run_code_interpreter(content: str):
    client = openai_client_instance

    my_assistant = client.beta.assistants.create(
        instructions="""
        You are a code interpreter. Write commands to obtain all necessary keys, list commands to run all necessary installations, details the code to execute, show output.
        When given code, you run the code to see if it compiles, functions as expected, and produces results relevant to user prompt. If it does not you iterate over logs until it runs as expected.
        Explicitly hard-code all keys in the script.
        Structure return results in the following format: 
        Response description,
        ```bash
        # <command>
        # <command>
        # <command>
        ```
        ```<programming language> (for example python or javascript)
        # <code>
        # <code>
        # <code>
        ```
        ### Sample Terminal Output
        ```plaintext
        # <output>
        # <output>
        # <output>
        ```
        """,
        name="Code interpreter",
        tools=[{"type": "code_interpreter"}],
        model="gpt-4o-2024-05-13",
    )

    thread = client.beta.threads.create()

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=content
    )
    print("Message created:", message)

    response_text = ""

    print(f"\nStarting response stream...")
    with client.beta.threads.runs.stream(
        thread_id=thread.id,
        assistant_id=my_assistant.id,
    ) as stream:
        for event in stream:
            # print(f"Event received: {event}")
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

    model_response = response_text
    
    return my_assistant.id, thread.id, model_response
# Example usage
# content = """
# Write a Python script that uses AWS S3 to upload, download, and list objects in a specified bucket. The script should handle authentication and error handling
# """

# result = run_code_interpreter(content)
# print(result)

# Write a Python script that uses AWS S3 to upload, download, and list objects in a specified bucket. The script should handle authentication and error handling
# Implement a JavaScript function that counts the number of vowels in a given string. PLAINFORMAT

