import type * as vscode from "vscode";

export interface IConfig {
  name: string;
  description: string;
  users: IUser[];
}
export interface IUser {
  name: string;
  active: boolean;
  roles: string[];
}

export interface ICommand {
  action: CommandAction;
  content: IConfig;
}

export enum CommandAction {
  Save
}

export interface IMessage {
  type: string;
  content: any;
}


export enum GroqModels {
	Llama3_8b = "llama3-8b-8192",
	Llama3_70b = "llama3-70b-8192",
}

// console.log('process.env.GROQ_API_KEY', process.env.GROQ_API_KEY);

export type postMessage = vscode.WebviewPanel["webview"]["postMessage"];

// interface AcceptanceCriteria {
// 	criteria: string;
// 	code: string;
// }

export type ExecutionResult = {
	returnValue: any;
	stdout: string;
	stderr: string;
};

export interface Program {
	code: string;
	result?: ExecutionResult;
	analysis?: string;
	status?: "complete" | "incomplete";
	/**
	 * Reason for status
	 */
	reason?: string;
}

export interface AutoDebugContext {
	goal: string;
	scratchpad: string;
	// acceptanceCriterias: AcceptanceCriteria[];
	history: Program[];
}

export type Message = UserMessage | AssistantMessage;

export type UserMessage = {
	type: "user";
	text: string;
};

export type AssistantMessage = {
	type: "assistant";
	text: string;
  /**
   * All auto debugger context
   */
	context?: AutoDebugContext;
};

