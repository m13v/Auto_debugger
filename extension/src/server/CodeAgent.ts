import vm from "vm";

import Groq from "groq-sdk";
import dotenv from "dotenv";
import type { CompletionCreateParams } from "groq-sdk/resources/chat";
import {
	type AutoDebugContext,
	GroqModels,
	type Message,
	type postMessage,
	type Program,
	type ExecutionResult,
} from "../view/app/model";

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const seed = 42;
const maxSteps = 10;

const groq = new Groq({
	apiKey: GROQ_API_KEY,
});

const fastModel = GroqModels.Llama3_70b;

function printBanner(title: string) {
	console.log(`\n\n${"=".repeat(20)} ${title} ${"=".repeat(20)}`);
}

export class CodeAgent {
	private postMessage: postMessage;
	private messages: Message[] = [];

	private persona =
		"You are an expert software engineer with knowledge of debugging best practices. You write JavaScript/Node.js code.";

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
			case "message": {
				const userMessage: Message = { type: "user", text: message.text };
				this.messages.push(userMessage);

				// this.sendMessage({
				//   command: 'message',
				//   text: `${message.text} back!`
				// });

				const prompt = message.text;

				/*
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

				*/
				const res = '';
				this.sendMessage({
					command: "message",
					text: res,
				});

				await this.codeGen(prompt);
				console.log("codeGen done");

				break;
			}
		}
	}

	async codeGen(goal: string) {
		// FIXME
		const _goal = `Write a function which can check whether the following string is valid or not.
- "a" => true
- "ab" => true
- "abc" => true
- "abd" => false
- "aabbcc" => true
- "aaabbbccc" => true
- "aaabbbcccc" => false
- "aabbccdd" => true
- "aabbccdde" => false
- "aaaaabbbbbcccccdddddeeeee" => true

A string is valid if it has the same number of each character repeated in a sequence.
And the characters in the sequence should be in incrementing alphabetical order.
`;
		/*
		const context: AutoDebugContext = {
			goal,
			scratchpad: "",
			history: [],
		};
		return new Promise<void>((resolve) => {
			let code = 0;
			const intervalId = setInterval(() => {
				code++;
        context.history.push({
          code: `console.log(Math.pow(2, ${code}));`,
        });

				this.sendMessage({
					command: "update-context",
					context,
				});
			}, 100);

			setTimeout(() => {
				clearInterval(intervalId);
				resolve();
			}, 10000);
		});
    */

		const onUpdateContext = (context: AutoDebugContext) => {
			this.sendMessage({
				command: "update-context",
				context,
			});
		};

		await this.startDebugging({ goal, onUpdateContext });
	}

	async startDebugging({
		goal,
		onUpdateContext,
	}: {
		goal: string;
		onUpdateContext: (context: AutoDebugContext) => void;
	}) {
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

		const context: AutoDebugContext = {
			// goal: "Print 2 ^ 32 to console",
			// 		goal: `Write a function which can check whether the following string is valid or not.
			// - "abc" => true
			// - "abd" => false
			// - "aabbcc" => true
			// - "aaabbbccc" => true
			// - "aaabbbcccc" => false
			// - "aabbccdd" => true
			// - "aabbccdde" => false
			// - "aaaaabbbbbcccccdddddeeeee" => true

			// A string is valid if it has the same number of characters repeated in a sequence.
			// And the characters in the sequence should be in increasing order.
			// `,
			goal,
			// scratchpad: "",
			// acceptanceCriterias: [],
			history: [],
		};

		let done = false;
		while (!done && attempts < maxSteps) {
			try {
				attempts++;

				const plan = await this.planProgram(context);

				console.log('Plan', plan)

				const program = await this.writeProgram(context, plan);

				printBanner("Program");
				console.log(program.code);

				const result = await this.executeProgram(program);

				printBanner("Execution");
				console.log(result);

				const programWithResult: Program = {
					plan,
					code: program.code,
					result,
				};
				context.history.push(programWithResult);
				onUpdateContext(context);

				// Reflect
				const reflection = await this.reflect(context);
				// console.log("reflection", reflection);
				printBanner("Reflection");
				console.log(reflection);

				programWithResult.analysis = reflection;
				// context.scratchpad = reflection;
				onUpdateContext(context);

				// check if done
				done = await this.getTaskStatus(context);
				console.log("IsDone", done);

				programWithResult.status = done ? "complete" : "incomplete";
				onUpdateContext(context);

				if (done) {
					break;
				}

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

	// Note: cannot stream with tool calling

	// async function plan(context: Context): Promise<Context> {
	async getTaskStatus(context: AutoDebugContext): Promise<boolean> {
		const lastHistoryItem = context.history[context.history.length - 1];
		const prompt = `Given the task and analysis, determine whether the code is complete and satisfies the acceptance criteria. If not, what needs to be done to complete the code?
Do not gold plate, only meet the acceptance criteria. Be precise and concise.

Must always call the "task_status" tool with your evaluation.
May call "ask_user" tool to ask the user critical questions.

Task:
${context.goal}

Code:
\`\`\`javascript
${lastHistoryItem.code}
\`\`\`

Analysis:
${lastHistoryItem.analysis}
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
					content: this.persona,
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
			seed,
		});

		const message = chatCompletion.choices[0].message;
		console.log("task status", JSON.stringify(message, null, 2));

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

	async planProgram(context: AutoDebugContext): Promise<string> {
		const prompt = `# Instructions
Think step by step how to solve the following task with code.
Write a precise, concise, and thoughtful plan for the implementation details of code.
Only output the plan. Do not output any code.

# Task
${context.goal}`;

		const messages: CompletionCreateParams.Message[] = [
			{
				role: "system",
				content: this.persona,
			},
			{ role: "user", content: prompt },
		];

// 		if (context.history.length > 0) {
// 			const lastProgram = context.history[context.history.length - 1];
// 			messages.push({
// 				role: "assistant",
// 				content: lastProgram.code,
// 			});
// 			messages.push({
// 				role: "user",
// 				content: `Result: ${lastProgram.result?.returnValue}
// Stdout: ${lastProgram.result?.stdout}
// Stderr: ${lastProgram.result?.stderr}

// -----

// Given this result, write an analysis of the code.
// `,
// 			});
// 			messages.push({
// 				role: "assistant",
// 				content: `Analysis:
// ${lastProgram.analysis}
// `,
// 			});
// 			messages.push({
// 				role: "user",
// 				content: `Write an improved version of the code to fix the bugs and meet the acceptance criteria of the task.
// Only output the code. Follow the instructions above.
// `,
// 			});
// 		}

		const chatCompletion = await groq.chat.completions.create({
			messages,
			// model: "llama3-8b-8192",
			// model: GroqModels.Llama3_8b,
			// model: GroqModels.Llama3_70b,
			model: fastModel,
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
			seed,
		});

		const plan = chatCompletion.choices[0].message.content;

		return plan
	}

	async writeProgram(context: AutoDebugContext, plan: string): Promise<Program> {
		const prompt = `# Instructions
Write a JavaScript/Nodejs program for the following task. Only output the code. Do not output any explanation or comments.

If the code is in a function, ensure the function is called at least once at the end of the code.
You can call the function multiple times, such as once for each test case.

Use 'console' statements for outputting debugging information.
Add clear labels to each console statement to identify the source of the output,
because you will not have line numbers to reference.
Recommend including input and expected output inside the console statements (not as comments)
to enable quick and easy debugging. Do not compute the expected output, hardcode it based off what is known.
Recommended format for test cases:
\`\`\`
console.log(\`Test Case #N. Input: INPUTs. Expected Output: EXPECTED\`)
console.log(callMyFunc(INPUTS))
// ... for each test case  
\`\`\`

Include additional console statements throughout code used for debugging and understanding control flow.

Assume the function must return a value if it is not a void function.

# Task
${context.goal}

${context.history.length === 0 ? `# Plan\n${plan}\n` : ''}
`.trim()

		const messages: CompletionCreateParams.Message[] = [
			{
				role: "system",
				content: this.persona,
			},
			{ role: "user", content: prompt },
		];

		if (context.history.length > 0) {
			const lastProgram = context.history[context.history.length - 1];
			messages.push({
				role: "assistant",
				content: lastProgram.code,
			});
			messages.push({
				role: "user",
				content: `Result: ${lastProgram.result?.returnValue}
Stdout: ${lastProgram.result?.stdout}
Stderr: ${lastProgram.result?.stderr}

-----

Given this result, write an analysis of the code.
`,
			});
			messages.push({
				role: "assistant",
				content: `Analysis of current code:
${lastProgram.analysis}

# Plan for next code improvement
${plan}
`,
			});
			messages.push({
				role: "user",
				content: `Write an improved version of the code to fix the bugs and meet the acceptance criteria of the task.
Only output the code. Follow the instructions above.
`.trim(),
			});
		}

		const chatCompletion = await groq.chat.completions.create({
			messages,
			// model: "llama3-8b-8192",
			// model: GroqModels.Llama3_8b,
			// model: GroqModels.Llama3_70b,
			model: fastModel,
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
			seed,
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
			plan,
			code,
			result: undefined,
		};

		// for await (const chunk of stream) {
		//     process.stdout.write(chunk.choices[0]?.delta?.content || '');
		// }
		// const result = await promise;
		// console.log(result);
	}

	async executeProgram(program: Program): Promise<ExecutionResult> {
		// use Node.js to run arbitary code in a sandbox
		function consoleArgsToString(arg: any): string {
			if (typeof arg === "string") {
				return arg;
			}
			return JSON.stringify(arg);
		}
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

	async reflect(context: AutoDebugContext) {
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

		const prompt = `Analyze the results of executing the following code to implement the task.
Did the code meet the acceptance criteria? Do not gold plate, only meet the acceptance criteria. Be precise and concise.
If not, what went wrong? What worked and should be repeated? What did not work? Focus on identifying the issue(s) and possible root causes, if there are any. Think step by step. Start with observations before jumping to conclusions.
Do not output any code. Only output the analysis.

Task:
${context.goal}

Code:
\`\`\`javascript
${lastProgram.code}
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
		// Return Value:
		// \`\`\`
		// ${lastProgram.result.returnValue}
		// \`\`\`

		console.log(prompt);

		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: this.persona,
				},
				{ role: "user", content: prompt },
			],
			// model: "llama3-8b-8192",
			// model: GroqModels.Llama3_70b,
			model: fastModel,
			// model: GroqModels.Llama3_8b,
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
			seed,
		});

		const res = chatCompletion.choices[0].message.content;

		return res;
	}
}
