from run_code_interpreter_openai import run_code_interpreter
from short_model_response import short_model_response
from e2b_inst_exec import prepare_script_execution
from e2b_inst_exec import initialize_sandbox
from new_iteration import new_iteration
import json

def auto_debugger(prompt):
    total_iterations = 10
    iteration_data = []
    assistant_id, thread_id, model_response = run_code_interpreter(prompt)
    if "```python" in model_response:
        sandbox = initialize_sandbox()
        execution_result_filtered = json.dumps(prepare_script_execution(sandbox, model_response))

    iteration_data = {
        "assistant_id": assistant_id,
        "thread_id": thread_id,
        "first_model_response": model_response,
        "first_execution_result_filtered": execution_result_filtered if 'execution_result_filtered' in locals() else None,
        "iterations": []
    }
    print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIRST STEP DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    if 'execution_result_filtered' in locals() and execution_result_filtered and execution_result_filtered != '""':
        for i in range(total_iterations):
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ITERATION %d DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' % i)
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
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! COMPARISON 1 DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "comparison_results1": comparison_results1
                })
                compare_results2 = """
                Why none of the solutions worked? IMPORTANT INSTRUCTIONS: You must respond with one paragraph
                """
                comparison_results2 = short_model_response(compare_results2, assistant_id, thread_id)
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! COMPARISON 2 DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "comparison_results2": comparison_results2
                })
                compare_results3 = """
                Are we in a repetative loop based on the user "Prompt" and the "History of iterations"? IMPORTANT INSTRUCTIONS: You must respond with one word: "yes" or "no".
                """
                comparison_results3 = short_model_response(compare_results3, assistant_id, thread_id)
                print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! COMPARISON 3 DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                iteration_data["iterations"][-1].update({
                    "comparison_results3": comparison_results3
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
    return "autodebuggin finished", iteration_data

# prompt = """
# HI THERE
# """
# result, iteration_data = auto_debugger(prompt)
# print({k: str(v)[:10] for k, v in iteration_data.items()})
# print(result)