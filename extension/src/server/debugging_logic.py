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

async def send_iteration_data(prompt):
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        result, iteration_data = await auto_debugger(prompt, websocket)
        await websocket.send(json.dumps({"status": result, "iteration_data": iteration_data}))

async def auto_debugger(prompt, websocket):
# def auto_debugger(prompt):
    total_iterations = 10

    iteration_data = {
        "assistant_id": "",
        "thread_id": "",
        "first_model_response": "",
        "model_response_without_code": "",
        "execution_result_unfiltered": "",
        "execution_result_filtered": "",
        "iterations": []
    }

    async for interim_result in run_code_interpreter(prompt):
        iteration_data["first_model_response"] += str(interim_result)
        await websocket.send(json.dumps({"iteration_data": iteration_data}))

    # Collect the final result after the streaming is done
    final_result = await run_code_interpreter(prompt).__anext__()
    if len(final_result) == 3:
        assistant_id, thread_id, model_response = final_result
    else:
        assistant_id, thread_id = final_result[0], final_result[1]
        model_response = ""
        
    model_response_without_code = re.sub(r'```(bash|python|plaintext).*?```', '', model_response, flags=re.DOTALL).strip()

    if "```python" in iteration_data["first_model_response"]: 
        sandbox = initialize_sandbox()
        print("Entering PREPARE_SCRIPT_EXECUTION")
        # execution_result_filtered, model_response_without_code = json.dumps(prepare_script_execution(sandbox, model_response)) if 'execution_result_filtered' in locals() else None
        # for interim_result in prepare_script_execution(sandbox, model_response):
        #    # Process interim results
        #    print("Received interim result:", interim_result)
        async for interim_result2 in prepare_script_execution(sandbox, model_response):
            iteration_data["execution_result_unfiltered"] += str(interim_result2)
            await websocket.send(json.dumps({"iteration_data": iteration_data}))

    iteration_data = {
        "assistant_id": assistant_id,
        "thread_id": thread_id,
        "model_response_without_code": model_response_without_code,
        "execution_result_filtered": execution_result_filtered if 'execution_result_filtered' in locals() else None,
        "iterations": []
    }

    # await websocket.send(json.dumps({"iteration_data": iteration_data}))

    print("await websocket message sent")

    print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIRST EXECUTION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    if 'execution_result_filtered' in locals() and execution_result_filtered and execution_result_filtered != '""':
        for i in range(total_iterations):
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ITERATION %d STARTED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' % i)
            iteration_data["iterations"].append({
                "index": i
            })
            # Store iteration data

            result_evaluator = f"""
            We just ran the code that you generated, here is what we got from execution:
            "Execution Result" = {execution_result_filtered}
            Analyze results. IMPORTANT INSTRUCTIONS: You must respond with one paragraph
            """

            evaluation_result = short_model_response(result_evaluator, assistant_id, thread_id)
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! EVALUATION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            iteration_data["iterations"][-1].update({
                "evaluation_result": evaluation_result
            })
            if i > 0:
                compare_results1 = """
                Did we make progress compared to the last iteration? IMPORTANT INSTRUCTIONS: You must respond with one word: "yes" or "no".
                """
                comparison_results1 = short_model_response(compare_results1, assistant_id, thread_id)
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Did we make progress? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "made_progress": comparison_results1
                })
                compare_results2 = """
                Why none of the solutions worked? IMPORTANT INSTRUCTIONS: You must respond with one paragraph
                """
                comparison_results2 = short_model_response(compare_results2, assistant_id, thread_id)
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Why none of the solutions worked? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "why_none_of_the_solutions_worked": comparison_results2
                })
                compare_results3 = """
                Are we in a repetative loop based on the user "Prompt" and the "History of iterations"? IMPORTANT INSTRUCTIONS: You must respond with one word: "yes" or "no".
                """
                comparison_results3 = short_model_response(compare_results3, assistant_id, thread_id)
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Are we in a repetative loop? - DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "is_repetative_loop": comparison_results3
                })
                if "yes" in comparison_results3.lower():
                    return "repetative_loop", iteration_data
            decision_maker = """
            Based on the user "Prompt" and last interactions -> decide which of the following next steps is most feasible to take:
            1. Iterate further on the last iteration
            2. Generate a novel approach to user prompt
            3. Stop the iteration due to lack of progress
            4. Execution results meet expectations, we should stop the iteration
            IMPORTANT INSTRUCTIONS: You must respond with either of: "[1] iterate further", "[2] generate a novel approach", "[3] stop", or "[4] done".
            """
            decision_maker = short_model_response(decision_maker, assistant_id, thread_id)
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! DECISION MAKER DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            iteration_data["iterations"][-1].update({
                "decision_maker": decision_maker
            })
            if "[1]" in decision_maker.lower():
                new_instructions= "iterate further based on the recent interactions, break up the problem areas into smaller steps, add logs after each one"
            elif "[2]" in decision_maker.lower():
                new_instructions= "Come up with a novel approach to user prompt, different from what you have tried already"
            elif "[3]" in decision_maker.lower():
                return "stopped", iteration_data
            elif "[4]" in decision_maker.lower():
                return "done", iteration_data
            new_iteration_results= new_iteration(new_instructions, assistant_id, thread_id)
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEW ITERATION DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            iteration_data["iterations"][-1].update({
                "new_iteration_results": new_iteration_results
            })
            execution_result_filtered = json.dumps(prepare_script_execution(sandbox, new_iteration_results))
            if not execution_result_filtered or execution_result_filtered == '""':
                return "execution_stopped", iteration_data
            iteration_data["iterations"][-1].update({
                "execution_result_filtered": execution_result_filtered
            })
    print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ITERATION LOOP PASSED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    return "autodebugging finished", iteration_data

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else ""
    asyncio.run(send_iteration_data(prompt))

# prompt = """
# HI THERE
# """
# prompt = "Write a Python script that uses AWS S3 to upload, download, and list objects in a specified bucket. The script should handle authentication and error handling."

