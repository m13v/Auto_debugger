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
	Save,
}

export interface IMessage {
	type: string;
	content: any;
}

export enum GroqModels {
	Llama3_8b = "llama3-8b-8192",
	Llama3_70b = "llama3-70b-8192",
}

export type postMessage = vscode.WebviewPanel["webview"]["postMessage"];

export type ExecutionResult = {
	returnValue: any;
	stdout: string;
	stderr: string;
};

export type isCodeGen = boolean; // or a more complex type if needed

export interface Program {
	plan: string;
	code: string;
	result?: ExecutionResult;
	analysis?: string;
	status?: "complete" | "incomplete";
	reason?: string;
}

export interface AutoDebugContext {
	goal: string;
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
	iteration_data?: IterationData;
	context?: AutoDebugContext;
	meta?: {
		isCodeGen: isCodeGen;
	};
};

export interface Iteration {
    index?: number;
    evaluation_result?: string;
    made_progress?: string;
    why_none_of_the_solutions_worked?: string;
    is_repetative_loop?: string;
    decision_maker?: string;
    new_iteration_results?: string;
    execution_result_filtered?: string;
}

export interface IterationData {
    assistant_id?: string;
    thread_id?: string;
    first_model_response?: string;
    model_response_without_code?: string;
    execution_result_unfiltered?: string;
    execution_result_filtered?: string;
    iterations?: Iteration[];
}