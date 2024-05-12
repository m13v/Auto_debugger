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

/*
type AssistantMessage = {
	type: "assistant";
  text: string;
  code: string;
	result?: ExecutionResult;
  analysis?: string;
  status?: "complete" | "incomplete";
  // Reason for status
  reason?: string;
}

type AssistantContext = {
  goal: string;
  scratchpad: string;
  history: AssistantMessage[];
  currentMessage?: AssistantMessage;
}

export const dummyAssistantContext: AssistantContext = {
  goal: "Complete the project documentation",
  scratchpad: "Remember to update the API section with the latest changes.",
  history: [
    {
      type: "assistant",
      text: "Reminder to review the deployment process.",
      code: "REM003",
      status: "incomplete",
      reason: "Pending review from the team lead",
      result: {
        returnValue: null,
        stdout: "Deployment process needs to be reviewed by the team lead.",
        stderr: ""
      }
    },
    {
      type: "assistant",
      text: "Here's the summary of the last meeting.",
      code: "SUM001",
      analysis: "Positive progress in the last sprint.",
      status: "complete"
    },
    {
      type: "assistant",
      text: "Draft for the upcoming presentation.",
      code: "DFT002",
      analysis: "Needs more detailed diagrams.",
      status: "incomplete",
      reason: "Lack of technical details",
      result: {
        returnValue: null,
        stdout: "Draft requires additional diagrams to effectively communicate the concepts.",
        stderr: "Missing data on recent market trends."
      }
    }
  ],
  currentMessage: {
    type: "assistant",
    text: "Reminder to review the deployment process.",
    code: "REM003",
    status: "incomplete",
    reason: "Pending review from the team lead",
    result: {
      returnValue: "ok",
      stdout: "Please ensure all team leads have reviewed the deployment steps.",
      stderr: ""
    }
  }
};
*/
