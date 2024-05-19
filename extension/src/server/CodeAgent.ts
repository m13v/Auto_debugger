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
import { GuessLang } from 'guesslang-js';
import { exec } from 'child_process';

dotenv.config();

const OPENAI_API_KEY = vscode.workspace.getConfiguration().get<string>('yourExtension.apiKey');
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''

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

async function detectLanguage(code: string): Promise<string> {
	const guessLang = new GuessLang();
	const result = await guessLang.runModel(code);
	if (result && result.length > 0) {
		return result[0].languageId;
	}
	return "Unknown";
}

export class CodeAgent {
	private postMessage: postMessage;
	private messages: Message[] = [];

	private persona =
		"You are an expert software engineer assistant";

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
	
				const checkCompletion = await openai.chat.completions.create({
					messages: [
						{
							role: "system",
							content: this.persona,
						},
						{ role: "user", content: prompt },
					],
					model: fastModel,
				});
	
				const checkMessage = checkCompletion.choices[0].message;
				const response = checkMessage.content;
				this.sendMessage({
					command: "message",
					text: response,
				});
				const codeSnippets = checkMessage.content?.match(/```(.*?)```/gs);
			 
				
				if (codeSnippets) {
					for (const snippet of codeSnippets) {
						let code = snippet;
						if (code.startsWith("```")) {
							code = code.substring(code.indexOf("\n") + 1);
						}
						if (code.endsWith("```")) {
							code = code.substring(0, code.lastIndexOf("\n"));
						}
						// Detect the language of the code snippet
						detectLanguage(code).then(language => {
							console.log(`Detected language: ${language}`);
							// Run the code snippet in the interpreter based on the detected language
							if (language === "py") {
								const assistant = await openai.beta.assistants.create({
									instructions: `You are a python code interpreter. When given code, you run the code to see if it compiles, functions as expected, and produces results relevant to user prompt: ${prompt}. If it does not you iterate over logs until it runs as expected`,
									model: fastModel,
									tools: [{ "type": "code_interpreter" }],
								});
								const thread = await openai.beta.threads.create()
								const message = await openai.beta.threads.messages.create(
									thread.id,
									{
										role: "user",
										content: code,
									},
								);
								// We use the stream SDK helper to create a run with
								// streaming. The SDK provides helpful event listeners to handle 
								// the streamed response.

								const run = openai.beta.threads.runs.stream(thread.id, {
									assistant_id: assistant.id
								})
									.on('textCreated', (text) => process.stdout.write('\nassistant > '))
									.on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
									.on('toolCallCreated', (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
									.on('toolCallDelta', (toolCallDelta, snapshot) => {
										if (toolCallDelta.type === 'code_interpreter') {
											if (toolCallDelta.code_interpreter.input) {
												process.stdout.write(toolCallDelta.code_interpreter.input);
											}
											if (toolCallDelta.code_interpreter.outputs) {
												process.stdout.write("\noutput >\n");
												toolCallDelta.code_interpreter.outputs.forEach(output => {
													if (output.type === "logs") {
														process.stdout.write(`\n${output.logs}\n`);
													}
												});
											}
										}
									})
									.on('error', (error) => {
										console.error('Error:', error);
									});
									.on('end', () => {
										this.sendMessage({
											command: "message",
											text: `Execution completed for code: ${run}`,
										});
									});
							} else if (language === "js") {
								console.log("We do not run js yet");
								this.sendMessage({
									command: "message",
									text: "JavaScript execution is not supported yet.",
								});
							} else {
								console.log("Unsupported language");
								this.sendMessage({
									command: "message",
									text: "Unsupported language detected.",
								});
							}
						});
					}
				}
			}
		}
	}
}

