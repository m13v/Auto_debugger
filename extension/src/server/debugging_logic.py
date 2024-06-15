from run_code_interpreter_openai import run_code_interpreter
from short_model_response import short_model_response
from e2b_inst_exec import prepare_script_execution
from e2b_inst_exec import initialize_sandbox
from new_iteration import new_iteration
import asyncio
import websockets
import json
import sys
import re
import asyncio
import time
import logging
import os
import io
from contextlib import redirect_stdout
from contextlib import contextmanager
import subprocess

async def send_iteration_data(prompt):
    iteration_data = {
        "assistant_id": "",
        "thread_id": "",
        "first_model_response": "",
        "model_response_without_code": "",
        "execution_result_unfiltered": "",
        "execution_result_filtered": "",
        "iterations": []
    }
        # asyncio.create_task(receive_messages(uri2, iteration_data, websocket2))

    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        result, iteration_data = await auto_debugger(prompt, iteration_data, websocket) #websocket
        await websocket.send(json.dumps({"status": result, "iteration_data": iteration_data}))

async def auto_debugger(prompt, iteration_data, websocket): #websocket
# def auto_debugger(prompt):
    total_iterations = 10
    assistant_id = None  # Initialize to None or a default value
    thread_id = None     # Initialize to None or a default value

    process = subprocess.Popen(
        ["python3", "src/server/run_code_interpreter_openai.py", prompt],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if process.poll() is None:
        print("Subprocess has started and is running.")
    else:
        print("Subprocess may not have started or has already terminated.")
    # Initialize the unfiltered execution result
    iteration_data["first_model_response"] = ""

    # Stream the output line by line
    while True:
        line = process.stdout.readline()
        if not line:
            break
        if "my_assistant_id:" in line:
            assistant_id = line.split("my_assistant_id:")[1].strip()
            # Remove the my_assistant_id part from the line
            line = line.split("my_assistant_id:")[0]
        if "thread_id:" in line:
            thread_id = line.split("thread_id:")[1].strip()
            # Remove the thread_id part from the line
            line = line.split("thread_id:")[0]
        iteration_data["first_model_response"] += line   
        await websocket.send(json.dumps({"iteration_data": iteration_data}))
        print(f"Parent received: {line}", end='')

    # After the loop, you can now close stdout
    process.stdout.close()
    model_response=iteration_data["first_model_response"]        
    model_response_without_code = re.sub(r'```(bash|python|plaintext).*?```', '', model_response, flags=re.DOTALL).strip()
    
    if "```python" in iteration_data["first_model_response"]: 
        # sandbox = initialize_sandbox()
        print("Entering PREPARE_SCRIPT_EXECUTION")

        process = subprocess.Popen(
            ["python3", "src/server/e2b_inst_exec.py", model_response],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Initialize the unfiltered execution result
        iteration_data["execution_result_unfiltered"] = ""

        # Stream the output line by line
        while True:
            line = process.stdout.readline()
            if not line:
                break
            iteration_data["execution_result_unfiltered"] += line   
            if "EXECUTION_RESULT_FILTERED=" in line:
                execution_result_filtered = line.split("EXECUTION_RESULT_FILTERED=")[1].strip()
            await websocket.send(json.dumps({"iteration_data": iteration_data}))
            print(f"Parent received: {line}", end='')

        # After the loop, you can now close stdout
        process.stdout.close()

    iteration_data["assistant_id"] = assistant_id
    iteration_data["thread_id"] = thread_id
    iteration_data["model_response_without_code"] = model_response_without_code
    iteration_data["execution_result_filtered"] = execution_result_filtered if 'execution_result_filtered' in locals() else None

    await websocket.send(json.dumps({"iteration_data": iteration_data}))
    # print("await websocket message sent")

    print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIRST EXECUTION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    if 'execution_result_filtered' in locals() and execution_result_filtered and execution_result_filtered != '""':
        for i in range(total_iterations):
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ITERATION %d STARTED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' % i)
            iteration_data["iterations"].append({
                "index": i,
                "evaluation_result": "",
                "made_progress": "",
                "why_none_of_the_solutions_worked": "",
                "is_repetative_loop": "",
                "decision_maker": "",
                "new_iteration_results": "",
                "execution_result_unfiltered": "",
                "execution_result_filtered": "",
            })
            # Store iteration data

            result_evaluator = f"""
            We just ran the code that you generated, here is what we got from execution:
            "Execution Result" = {execution_result_filtered}
            Analyze results. IMPORTANT INSTRUCTIONS: You must respond with one paragraph
            """

            iteration_data = await short_model_response(result_evaluator, assistant_id, thread_id, websocket, iteration_data, "evaluation_result")
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! EVALUATION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            if i > 0:
                compare_results1 = """
                Did we make progress compared to the last iteration? IMPORTANT INSTRUCTIONS: You must respond with one word: "yes" or "no".
                """
                iteration_data = await short_model_response(compare_results1, assistant_id, thread_id, websocket, iteration_data, "made_progress")
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Did we make progress? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                compare_results2 = """
                Why none of the solutions worked? IMPORTANT INSTRUCTIONS: You must respond with one paragraph
                """
                iteration_data = await short_model_response(compare_results2, assistant_id, thread_id, websocket, iteration_data, "why_none_of_the_solutions_worked")
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Why none of the solutions worked? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                compare_results3 = """
                Are we in a repetative loop based on the user "Prompt" and the "History of iterations"? IMPORTANT INSTRUCTIONS: You must respond with one word: "yes" or "no".
                """
                iteration_data = await short_model_response(compare_results3, assistant_id, thread_id, websocket, iteration_data, "is_repetative_loop")
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Are we in a repetative loop? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                if "yes" in iteration_data["iterations"][-1]["is_repetative_loop"].lower():
                    return "repetative_loop", iteration_data
            decision_maker = """
            Based on the user "Prompt" and last interactions -> decide which of the following next steps is most feasible to take:
            1. Iterate further on the last iteration
            2. Generate a novel approach to user prompt
            3. Stop the iteration due to lack of progress
            4. Execution results meet expectations, we should stop the iteration
            IMPORTANT INSTRUCTIONS: You must respond with either of: "[1] iterate further", "[2] generate a novel approach", "[3] stop", or "[4] done".
            """
            iteration_data = await short_model_response(decision_maker, assistant_id, thread_id, websocket, iteration_data, "decision_maker")
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DECISION MAKER DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            if "[1]" in iteration_data["iterations"][-1]["decision_maker"].lower():
                new_instructions= "iterate further based on the recent interactions, break up the problem areas into smaller steps, add logs after each one"
            elif "[2]" in iteration_data["iterations"][-1]["decision_maker"].lower():
                new_instructions= "Come up with a novel approach to user prompt, different from what you have tried already"
            elif "[3]" in iteration_data["iterations"][-1]["decision_maker"].lower():
                return "stopped", iteration_data
            elif "[4]" in iteration_data["iterations"][-1]["decision_maker"].lower():
                return "done", iteration_data
            iteration_data= await new_iteration(new_instructions, assistant_id, thread_id, websocket, iteration_data, "new_iteration_results")
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEW ITERATION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            if "```python" in iteration_data["iterations"][-1]["new_iteration_results"]: 
                print("Entering PREPARE_SCRIPT_EXECUTION")
                process = subprocess.Popen(
                    ["python3", "src/server/e2b_inst_exec.py", model_response],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                # Stream the output line by line
                while True:
                    line = process.stdout.readline()
                    if not line:
                        break
                    iteration_data["iterations"][-1]["execution_result_unfiltered"] += line
                    # iteration_data["execution_result_unfiltered"] += line   
                    if "***EXECUTION_RESULT_FILTERED***" in line:
                        execution_result_filtered = line.split("***EXECUTION_RESULT_FILTERED***")[1].strip()
                    await websocket.send(json.dumps({"iteration_data": iteration_data}))
                    print(f"Parent received: {line}", end='')

                # After the loop, you can now close stdout
                process.stdout.close()
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEW EXECUTION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

            if not execution_result_filtered or execution_result_filtered == '""':
                return "execution_stopped", iteration_data
            iteration_data["iterations"][-1].update({
                "execution_result_filtered": execution_result_filtered
            })
    print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ITERATION LOOP PASSED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    return "autodebugging finished", iteration_data

async def main(prompt):
    # Run the send_iteration_data coroutine
    await send_iteration_data(prompt)

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else ""
    asyncio.run(main(prompt))

# prompt = "Write a Python script that uses AWS S3 to upload, download, and list objects in a specified bucket. The script should handle authentication and error handling."
# Create a Python program to sort and print out the elements of an array of integers. [17, 41, 5, 22, 54, 6, 29, 3, 13]
