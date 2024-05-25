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
import { spawn } from 'child_process';
import WebSocket from 'ws'; // @ts-ignore

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

// async function detectLanguage(code: string): Promise<string> {
// 	const guessLang = new GuessLang();
// 	const result = await guessLang.runModel(code);
// 	if (result && result.length > 0) {
// 		return result[0].languageId;
// 	}
// 	return "Unknown";
// }

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

				const promptMessage = prompt;

				const responseMessage = "test message from server (1)";

				this.sendMessage({
				  command: "message",
				  text: responseMessage,
				} as any);
				const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'], cwd: require('path').resolve(__dirname, '../../') });
				// const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'], cwd: path.resolve(__dirname, '../../') });
				// const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'], cwd: __dirname });
				// const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'] });
				process.stdout.on('data', (data) => {
					console.log(`stdout: ${data.toString()}`);
					this.sendMessage({
					  command: "message",
					  text: data.toString(),
					});
				  });
				  
				  process.stderr.on('data', (data) => {
					console.error(`stderr: ${data.toString()}`);
					this.sendMessage({
					  command: "message",
					  text: data.toString(),
					});
				  });
				  
				  process.on('close', (code) => {
					console.log(`Process exited with code ${code}`);
					this.sendMessage({
					  command: "message",
					  text: `Process exited with code ${code}`,
					});
				  });

				// const wss = new WebSocket.Server({ port: 8080, clientTracking: true });
				// console.log("wss", wss.clients);
				
				// wss.on('connection', function connection(ws) {
				//   console.log('New client connected');
				//   ws.send('Hello, client!'); // Send a message to the client upon connection
				
				//   ws.on('message', (message) => {
				// 	console.log(`Received message: ${message}`);
				// 	ws.send(`Echo: ${message}`);
				// });
				
				//   const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'] });
				  
				//   ws.send(`Process started successfully with PID: ${process.pid}`);
				
				//   process.stdout.on('data', (data) => {
				// 	console.log(`stdout: ${data.toString()}`);
				// 	ws.send('stdout');
				// 	ws.send(JSON.stringify({ type: 'log', data: data.toString() }));
				//   });
				  
				//   process.stderr.on('data', (data) => {
				// 	console.error(`stderr: ${data.toString()}`);
				// 	ws.send('stderr');
				// 	ws.send(JSON.stringify({ type: 'log', data: data.toString() }));
				//   });
				  
				//   process.on('close', (code) => {
				// 	console.log(`Process exited with code ${code}`);
				// 	ws.send(JSON.stringify({ type: 'log', data: `Process exited with code ${code}` }));
				//   });
				
				// });
				
				// var ws = new WebSocket('ws://localhost:8080');
				// ws.onopen = function() {
				//   console.log('WebSocket connection established');
				//   ws.send('Hello, server!');
				// };
				
				// ws.onmessage = function(event) {
				//   console.log('Message from server:', event.data);
  
				// };
				
				// wss.on('listening', () => {
				//   console.log('WebSocket server is listening on port 8080');
				// });
				
				// wss.on('error', (error) => {
				//   console.error('WebSocket server error:', error);
				// });
				// console.log('WebSocket server created');
			}
		}
	}
}

