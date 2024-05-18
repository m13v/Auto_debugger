import vm from "vm";
import { OpenAI } from "openai";
import ChatCompletionTool from "openai"
import Groq from "groq-sdk";
import type { CompletionCreateParams } from "groq-sdk/resources/chat";
import {
	type AutoDebugContext,
	GroqModels,
	type Message,
	type postMessage,
	type Program,
	type ExecutionResult,
} from "../view/app/model";
import dotenv from 'dotenv';
import * as vscode from 'vscode';

dotenv.config();

const OPENAI_API_KEY = vscode.workspace.getConfiguration().get<string>('yourExtension.apiKey');
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''

const seed = 42;
const maxSteps = 10;

const groq = new Groq({
	apiKey: GROQ_API_KEY,
});

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
});

const GPTmodel = 'gpt-4o-2024-05-13';
const Groqmodel = GroqModels.Llama3_70b;
const fastModel = GPTmodel;


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
	
				const prompt = message.text;
	
				const checkIfGenCode: ChatCompletionTool = {
					type: "function",
					function: {
						name: "check_if_gen_code",
						description: "Determine whether we need to generate code based on the user prompt.",
						parameters: {
							type: "object",
							properties: {
								status: {
									type: "string",
									description: "The status of the task.",
									enum: ["yes", "no"],
								},
							},
							required: ["status"],
						},
					},
				};

				// Check if we need to generate code
				const checkPrompt = `Determine whether we need to generate code based on the user prompt: "${prompt}"`;
				const checkCompletion = await openai.chat.completions.create({
					messages: [
						{
							role: "system",
							content: this.persona,
						},
						{ role: "user", content: checkPrompt },
					],
					model: fastModel,
					temperature: 0.5,
					max_tokens: 1024,
					top_p: 1,
					tools: [checkIfGenCode],
					seed,
				});
	
				const checkMessage = checkCompletion.choices[0].message;
				const { tool_calls: toolCalls = [] } = checkMessage;
				const checkToolCall = toolCalls.find((toolCall) => {
					return toolCall?.function?.name === "check_if_gen_code";
				});
	
				if (!checkToolCall) {
					throw new Error("check_if_gen_code tool not called");
				}
	
				const shouldGenCode = JSON.parse(checkToolCall?.function?.arguments || "{}")?.status === "yes";
	
				if (shouldGenCode) {
					const prompt = message.text;

					const res = '';
					this.sendMessage({
						command: "message",
						text: res,
					});

					await this.codeGen(prompt);
					console.log("codeGen done");
				} else {
					// Generate a response using the model
					const responseCompletion = await openai.chat.completions.create({
						messages: [
							{
								role: "system",
								content: this.persona,
							},
							{ role: "user", content: prompt },
						],
						model: fastModel,
						temperature: 0.5,
						max_tokens: 1024,
						top_p: 1,
						seed,
					});
	
					const responseMessage = responseCompletion.choices[0].message.content;
					let isCodeGen = false; // Set the value of isCodeGen

					this.sendMessage({
						command: "message",
						text: responseMessage,
						meta: {
							isCodeGen: isCodeGen, // Pass the value of isCodeGen as a separate object
						},
					});
				}
	
				break;
			}
		}
	}

	async codeGen(goal: string) {
		let isCodeGen = true; // Set the value of isCodeGen
		const onUpdateContext = (context: AutoDebugContext) => {
			this.sendMessage({
				command: "update-context",
				context,
				meta: {
					isCodeGen: isCodeGen, // Pass the value of isCodeGen as a separate object
				},
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

		const context: AutoDebugContext = {
			goal,
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

		const taskStatusTool: ChatCompletionTool = {
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
		// const askUserTool: CompletionCreateParams.Tool = {
		const askUserTool: ChatCompletionTool = {
			type: 'function',
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
		// const tools: CompletionCreateParams.Tool[] = [askUserTool];
		const tools: ChatCompletionTool[] = [askUserTool];

		if (context.history.length > 0) {
			tools.push(taskStatusTool);
		} else {
			// TODO: unsupported, skip
			return Promise.resolve(true);
		}

		// const chatCompletion = await groq.chat.completions.create({
		const chatCompletion = await openai.chat.completions.create({
			messages: [
				{
					role: "system",
					content: this.persona,
				},
				{ role: "user", content: prompt },
			],
			model: fastModel,
			temperature: 0.5,
			max_tokens: 1024,
			top_p: 1,
			// tools,
			tools: tools,
			seed,
		});

		const message = chatCompletion.choices[0].message;
		console.log("task status", JSON.stringify(message, null, 2));

		const { tool_calls: toolCalls = [] } = message;
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


		const chatCompletion = await openai.chat.completions.create({
			messages,
			model: fastModel,
			temperature: 0.5,
			max_tokens: 1024,
			top_p: 1,
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

		const chatCompletion = await openai.chat.completions.create({
			messages,
			model: fastModel,
			temperature: 0.5,
			max_tokens: 1024,
			top_p: 1,
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
		console.log(prompt);

		const chatCompletion = await openai.chat.completions.create({
			messages: [
				{
					role: "system",
					content: this.persona,
				},
				{ role: "user", content: prompt },
			],
			model: fastModel,
			temperature: 0.5,
			max_tokens: 1024,
			top_p: 1,
			seed,
		});

		const res = chatCompletion.choices[0].message.content;

		return res;
	}
}
