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
								// Run Python code
							} else if (language === "js") {
								// Run JavaScript code
							} else {
								console.log("Unsupported language");
							}
						});
					}
				}