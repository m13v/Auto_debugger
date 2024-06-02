from openai import OpenAI
from typing_extensions import override
from openai import AssistantEventHandler
import sys  # Import sys to access command-line arguments

from openai_client import openai_client_instance

def run_code_interpreter(content: str):
    # print("Entered run_code_interpreter function")
    client = openai_client_instance
    # print("client:", client)
    my_assistant = client.beta.assistants.create(
        instructions="""
        You are a code interpreter. Write commands to obtain all necessary keys, list commands to run all necessary installations, details the code to execute.
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
        ### Sample Terminal Output (don't repeat code, only show expected terminal outputs)
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
    # print("Message created:", message)

    response_text = ""

    # print(f"\nStarting response stream...")
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
                        # yield delta.text.value
            elif event.event == 'thread.message.created':
                if event.data.content:
                    for content in event.data.content:
                        if content.type == 'text':
                            response_text += content.text.value
                            print(content.text.value, end="", flush=True)
                            # yield content.text.value
            elif event.event == 'thread.run.completed':
                break
    # print("\nResponse stream completed.")

    model_response = response_text
    # yield my_assistant.id, thread.id, model_response
    print("my_assistant_id:", my_assistant.id)
    print("thread_id:", thread.id)
    return
    # return my_assistant.id, thread.id, model_response

# Implement a JavaScript function that counts the number of vowels in a given string. PLAINFORMAT

def main():
    # Check if a prompt was provided as a command-line argument
    if len(sys.argv) > 1:
        content = sys.argv[1] # Get the prompt from the command line
        # print(f"Prompt provided as command-line argument: {content}")
    else:
        content = """
        Write a Python script that uses AWS S3 to upload, download, and list objects in a specified bucket. The script should handle authentication and error handling
        """
    result = run_code_interpreter(content)
    # print(result)

if __name__ == '__main__':
    main()