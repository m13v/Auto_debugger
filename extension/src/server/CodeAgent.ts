import vm from "vm";
import type * as vscode from "vscode";

import Groq from "groq-sdk";
// import dotenv from "dotenv";
import type { CompletionCreateParams } from "groq-sdk/resources/chat";
import type { Message } from "@/Chat";
// dotenv.config();

const GROQ_API_KEY = "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"

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

enum GroqModels {
	Llama3_8b = "llama3-8b-8192",
	Llama3_70b = "llama3-70b-8192",
}

// console.log('process.env.GROQ_API_KEY', process.env.GROQ_API_KEY);

type postMessage = vscode.WebviewPanel["webview"]["postMessage"]

// interface AcceptanceCriteria {
// 	criteria: string;
// 	code: string;
// }

type ExecutionResult = {
	returnValue: any;
	stdout: string;
	stderr: string;
};

interface Program {
	code: string;
	result?: ExecutionResult;
	analysis?: string;
	status?: "complete" | "incomplete";
	/**
   * Reason for status
   */
  reason?: string;
}

interface Context {
	goal: string;
	scratchpad: string;
	// acceptanceCriterias: AcceptanceCriteria[];
	history: Program[];
}

export class CodeAgent {
	private postMessage: postMessage;
  private messages: Message[] = [];

  private persona = "You are an expert software engineer with knowledge of debugging best practices.";

	constructor({ postMessage }: { postMessage: postMessage }) {
		this.postMessage = postMessage;
	}

	sendMessage(message: any) {
		console.log("CodeAgent sending message:", message);
		this.postMessage(message);
	}

	public async onReceiveMessage(message: any) {
		console.log("CodeAgent received message:", message);

    switch (message.command) {
      case 'message': {
        const userMessage: Message = { type: 'user', text: message.text };
        this.messages.push(userMessage);

        // this.sendMessage({
        //   command: 'message',
        //   text: `${message.text} back!`
        // });

        const prompt = message.text;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: this.persona,
            },
            { role: "user", content: prompt },
          ],
          model: GroqModels.Llama3_8b,
          temperature: 0.5,
          max_tokens: 1024,
          top_p: 1,
        });

        const res = chatCompletion.choices[0].message.content;

        this.sendMessage({
          command: 'message',
          text: res
        });

        break;
      }
    }
	}
}

async function main() {
	let attempts = 0;

	// const chatCompletion = await groq.chat.completions.create({
	//     messages: [
	//         { role: 'system', content: 'You are an expert software engineer with knowledge of debugging best practices.' },
	//         { role: 'user', content: 'Explain the importance of low latency LLMs' }
	//     ],
	//     model: 'llama3-8b-8192',
	// });
	// console.log(chatCompletion.choices[0].message.content);

	// const code = await writeCode('Explain the importance of low latency LLMs')

	const context: Context = {
		// goal: "Print 2 ^ 32 to console",
		goal: `Write a function which can check whether the following string is valid or not.
- "abc" => true
- "abd" => false
- "aabbcc" => true
- "aaabbbccc" => true
- "aaabbbcccc" => false
- "aabbccdd" => true
- "aabbccdde" => false
- "aaaaabbbbbcccccdddddeeeee" => true

A string is valid if it has the same number of characters repeated in a sequence.
And the characters in the sequence should be in increasing order.
`,
		scratchpad: "",
		// acceptanceCriterias: [],
		history: [],
	};

	let done = false;
	while (!done && attempts < 1) {
		try {
			attempts++;

			// const context = await plan(initialContext);

			const program = await writeProgram(context);

			printBanner("Program");
			console.log(program.code);

			const result = await executeProgram(program);

			printBanner("Execution");
			console.log(result);

			const programWithResult: Program = {
				code: program.code,
				result,
			};
			context.history.push(programWithResult);

			// Reflect
			const reflection = await reflect(context);
			// console.log("reflection", reflection);
			printBanner("Reflection");
			console.log(reflection);

			context.scratchpad = reflection;

			// check if done
			done = await getTaskStatus(context);
			console.log("IsDone", done);

			// 1. Problem decomposition
			// -- rephrase problem statement
			// -- name root function
			// 2. Planning
			// -- acceptance criteria (AC)
			// -- code for AC
			// 3. Code writing - basic
			// 4. Code execution - check
			// 5. Reflection
			// -- recap of known issues
			// -- possible root causes for each issue
			// -- how to check assumptions
			// -- where to place breakpoints
			// 6. Repeat at #2
		} catch (error) {
			console.error(error);
		}
	}
}

function printBanner(title: string) {
	console.log(`\n\n${"=".repeat(20)} ${title} ${"=".repeat(20)}`);
}

// Note: cannot stream with tool calling

// async function plan(context: Context): Promise<Context> {
async function getTaskStatus(context: Context): Promise<boolean> {
	const prompt = `Given the task and analysis, determine whether the code is complete and satisfies the acceptance criteria. If not, what needs to be done to complete the code?

Must always call the "task_status" tool with your evaluation.
May call "ask_user" tool to ask the user critical questions.

Task:
${context.goal}

Analysis:
${context.scratchpad}
`;

	const taskStatusTool: CompletionCreateParams.Tool = {
		type: "function",
		function: {
			name: "task_status",
			description:
				"The code is complete and satisfies the acceptance criteria.",
			parameters: {
				type: "object",
				properties: {
					status: {
						type: "string",
						description: "The status of the task.",
						// enum: ["complete", "incomplete", "partial"], // TOOD
						enum: ["complete", "incomplete"],
					},
					reason: {
						type: "string",
						description:
							"The reason for the status. If complete, provide a brief summary of how the acceptance criteria were met. If incomplete, provide a precise and concise analysis of the missing criteria and what needs to be done to complete the code.",
					},
				},
				required: ["status", "reason"],
			},
		},
	};

	const askUserTool: CompletionCreateParams.Tool = {
		type: "function",
		function: {
			name: "ask_user",
			description: "Ask the user for more information.",
			parameters: {
				type: "object",
				properties: {
					question: {
						type: "string",
						description:
							"The question to ask the user. Be as precise, specific, clear, detailed as possible while remaining concise.",
					},
				},
			},
		},
	};

	const tools: CompletionCreateParams.Tool[] = [askUserTool];

	if (context.history.length > 0) {
		tools.push(taskStatusTool);
	} else {
		// TODO: unsupported, skip
		return Promise.resolve(true);
	}

	const chatCompletion = await groq.chat.completions.create({
		messages: [
			{
				role: "system",
				content:
					"You are an expert software engineer with knowledge of debugging best practices.",
			},
			{ role: "user", content: prompt },
		],
		// model: "llama3-8b-8192",
		model: GroqModels.Llama3_70b,
		//
		// Optional parameters
		//
		// Controls randomness: lowering results in less random completions.
		// As the temperature approaches zero, the model will become deterministic
		// and repetitive.
		temperature: 0.5,
		// The maximum number of tokens to generate. Requests can use up to
		// 2048 tokens shared between prompt and completion.
		max_tokens: 1024,
		// Controls diversity via nucleus sampling: 0.5 means half of all
		// likelihood-weighted options are considered.
		top_p: 1,
		// A stop sequence is a predefined or user-specified text string that
		// signals an AI to stop generating content, ensuring its responses
		// remain focused and concise. Examples include punctuation marks and
		// markers like "[end]".
		// stop: null,
		// If set, partial message deltas will be sent.
		// stream: true,
		tools,
	});

	const message = chatCompletion.choices[0].message;
	console.log("plan", JSON.stringify(message, null, 2));

	const { tool_calls: toolCalls = [] } = message;
	/*
    Example:
    [
        {
        "id": "call_5cm8",
        "type": "function",
        "function": {
            "name": "task_is_done",
            "arguments": "{}"
        }
        }
    ]
    */
	// loop through all tools
	const taskStatusToolCall = toolCalls.find((toolCall) => {
		return toolCall?.function?.name === "task_status";
	});

	if (!taskStatusToolCall) {
		throw new Error("task_status tool not called");
	}
	const isDone =
		JSON.parse(taskStatusToolCall?.function?.arguments || "{}")?.status ===
		"complete";

	return Promise.resolve(isDone);
}

/*
async function createRootFunctionSignature(context: Context): Promise<string> {
	const prompt = `What is the best JavaScript function signature (name and parameters)? Only output the function signature. Do not output any explanation or comments.

Task: ${context.goal}`;

	const chatCompletion = await groq.chat.completions.create({
		messages: [
			{
				role: "system",
				content:
					"You are an expert software engineer with knowledge of debugging best practices.",
			},
			{ role: "user", content: prompt },
		],
		// model: "llama3-8b-8192",
        model: GroqModels.Llama3_8b,
		//
		// Optional parameters
		//
		// Controls randomness: lowering results in less random completions.
		// As the temperature approaches zero, the model will become deterministic
		// and repetitive.
		temperature: 0.5,
		// The maximum number of tokens to generate. Requests can use up to
		// 2048 tokens shared between prompt and completion.
		max_tokens: 1024,
		// Controls diversity via nucleus sampling: 0.5 means half of all
		// likelihood-weighted options are considered.
		top_p: 1,
		// A stop sequence is a predefined or user-specified text string that
		// signals an AI to stop generating content, ensuring its responses
		// remain focused and concise. Examples include punctuation marks and
		// markers like "[end]".
		// stop: null,
		// If set, partial message deltas will be sent.
		// stream: true
	});

	const rawCode = chatCompletion.choices[0].message.content;

	let code = rawCode;
	if (code.startsWith("```")) {
		code = code.substring(code.indexOf("\n") + 1);
	}
	if (code.endsWith("```")) {
		code = code.substring(0, code.lastIndexOf("\n"));
	}

	return {
		code,
		result: undefined,
	};
}
*/

async function writeProgram(context: Context): Promise<Program> {
	const prompt = `Write a JavaScript/Nodejs program for the following task. Only output the code. Do not output any explanation or comments.

If the code is in a function, ensure the function is called at least once at the end of the code.
You can call the function multiple times, such as once for each test case.

Use 'console' statements for outputting debugging information.
Add clear labels to each console statement to identify the source of the output.

Assume the function must return a value if it is not a void function.

Task: ${context.goal}`;

	const chatCompletion = await groq.chat.completions.create({
		messages: [
			{
				role: "system",
				content:
					"You are an expert software engineer with knowledge of debugging best practices.",
			},
			{ role: "user", content: prompt },
		],
		// model: "llama3-8b-8192",
		model: GroqModels.Llama3_8b,
		//
		// Optional parameters
		//
		// Controls randomness: lowering results in less random completions.
		// As the temperature approaches zero, the model will become deterministic
		// and repetitive.
		temperature: 0.5,
		// The maximum number of tokens to generate. Requests can use up to
		// 2048 tokens shared between prompt and completion.
		max_tokens: 1024,
		// Controls diversity via nucleus sampling: 0.5 means half of all
		// likelihood-weighted options are considered.
		top_p: 1,
		// A stop sequence is a predefined or user-specified text string that
		// signals an AI to stop generating content, ensuring its responses
		// remain focused and concise. Examples include punctuation marks and
		// markers like "[end]".
		// stop: null,
		// If set, partial message deltas will be sent.
		// stream: true
	});

	const rawCode = chatCompletion.choices[0].message.content;

	let code = rawCode;
	if (code.startsWith("```")) {
		code = code.substring(code.indexOf("\n") + 1);
	}
	if (code.endsWith("```")) {
		code = code.substring(0, code.lastIndexOf("\n"));
	}

	// code = `console.log(Math.pow(2, 33));` // FIXME: fake a bug

	return {
		code,
		result: undefined,
	};

	// for await (const chunk of stream) {
	//     process.stdout.write(chunk.choices[0]?.delta?.content || '');
	// }
	// const result = await promise;
	// console.log(result);
}

function consoleArgsToString(arg: any): string {
	if (typeof arg === "string") {
		return arg;
	}
	return JSON.stringify(arg);
}

async function executeProgram(program: Program): Promise<ExecutionResult> {
	// use Node.js to run arbitary code in a sandbox

	const output: string[] = [];
	const errors: string[] = [];

	try {
		const sandbox = {
			console: {
				log: (...args: any[]) => {
					output.push(args.map(consoleArgsToString).join(" "));
				},
				error: (...args: any[]) => {
					errors.push(args.map(consoleArgsToString).join(" "));
				},
			},
		};

		const script = new vm.Script(program.code);
		const context = vm.createContext(sandbox);
		const result = script.runInContext(context);

		// console.log(result);
		return {
			stdout: output.join("\n"),
			stderr: errors.join("\n"),
			returnValue: result,
		};
	} catch (error: any) {
		console.error("Failed to execute code:", error);
		// return Promise.reject(new Error(`Failed with error: ${err}`));
		const errorMessage = error.message;
		errors.push(errorMessage);

		return {
			returnValue: undefined,
			stdout: output.join("\n"),
			stderr: errors.join("\n"),
		};
	}
}

async function reflect(context: Context) {
	const lastProgram = context.history[context.history.length - 1];

	if (!lastProgram) {
		throw new Error("No program to reflect on");
	}
	if (!lastProgram.code) {
		throw new Error("No code to reflect on");
	}
	if (!lastProgram.result) {
		throw new Error("No result to reflect on");
	}

	const prompt = `Analyze the results of the following task and the code. Did the code meet the acceptance criteria? If not, what went wrong? Do not try to fix the code, focus on identifying the issue(s) and possible root causes, if there are any. Think step by step. Start with observations before jumping to conclusions.

Task:
${context.goal}

Code:
\`\`\`javascript
${lastProgram.code}
\`\`\`

Return Value:
\`\`\`
${lastProgram.result.returnValue}
\`\`\`

Stdout:
\`\`\`
${lastProgram.result.stdout}
\`\`\`

Stderr:
\`\`\`
${lastProgram.result.stderr}
\`\`\`
`;

	console.log(prompt);

	const chatCompletion = await groq.chat.completions.create({
		messages: [
			{
				role: "system",
				content:
					"You are an expert software engineer with knowledge of debugging best practices.",
			},
			{ role: "user", content: prompt },
		],
		// model: "llama3-8b-8192",
		model: GroqModels.Llama3_70b,
		//
		// Optional parameters
		//
		// Controls randomness: lowering results in less random completions.
		// As the temperature approaches zero, the model will become deterministic
		// and repetitive.
		temperature: 0.5,
		// The maximum number of tokens to generate. Requests can use up to
		// 2048 tokens shared between prompt and completion.
		max_tokens: 1024,
		// Controls diversity via nucleus sampling: 0.5 means half of all
		// likelihood-weighted options are considered.
		top_p: 1,
		// A stop sequence is a predefined or user-specified text string that
		// signals an AI to stop generating content, ensuring its responses
		// remain focused and concise. Examples include punctuation marks and
		// markers like "[end]".
		// stop: null,
		// If set, partial message deltas will be sent.
		// stream: true
	});

	const res = chatCompletion.choices[0].message.content;

	return res;
}

main();
