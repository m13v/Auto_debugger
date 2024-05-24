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
c	
