from openai import OpenAI
from typing_extensions import override
from openai import AssistantEventHandler

def run_code_interpreter(content: str):
    client = OpenAI()

    my_assistant = client.beta.assistants.create(
        instructions="You are a python code interpreter. When given code, you run the code to see if it compiles, functions as expected, and produces results relevant to user prompt. If it does not you iterate over logs until it runs as expected",
        name="Python interpreter",
        tools=[{"type": "code_interpreter"}],
        model="gpt-4o-2024-05-13",
    )
    print(f"\nAssistant created:", my_assistant)

    thread = client.beta.threads.create()
    print(f"\nThread created:", thread)

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=content
    )
    print("Message created:", message)

    class EventHandler(AssistantEventHandler):    
        @override
        def on_text_created(self, text) -> None:
            print(f"\nassistant > ", end="", flush=True)
          
        @override
        def on_text_delta(self, delta, snapshot):
            print(delta.value, end="", flush=True)
          
        def on_tool_call_created(self, tool_call):
            print(f"\nassistant > {tool_call.type}\n", flush=True)
      
        def on_tool_call_delta(self, delta, snapshot):
            if delta.type == 'code_interpreter':
                if delta.code_interpreter.input:
                    print(delta.code_interpreter.input, end="", flush=True)
                if delta.code_interpreter.outputs:
                    print(f"\n\noutput >", flush=True)
                    for output in delta.code_interpreter.outputs:
                        if output.type == "logs":
                            print(f"\n{output.logs}", flush=True)

    print("Starting response stream...")
    with client.beta.threads.runs.stream(
        thread_id=thread.id,
        assistant_id=my_assistant.id,
        event_handler=EventHandler(),
    ) as stream:
        stream.until_done()
    print("Response stream completed.")

# Example usage
content = """
name = "Alice"
age = 30

# Function to greet a person
def greet(person_name):
    print(f"Hello, {person_name}!")

# Conditional statement
if age > 18:
    print(f"{name} is an adult.")
else:
    print(f"{name} is not an adult.")

# Loop to print numbers from 1 to 5
for i in range(1, 6):
    print(i)

# Calling the function
greet(name)
"""

run_code_interpreter(content)