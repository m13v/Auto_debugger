import React, { useCallback, useState } from "react";
import { AvatarImage, AvatarFallback, Avatar } from "./components/ui/avatar";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { monokaiDimmed } from '@uiw/codemirror-theme-monokai-dimmed';

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export type Message = UserMessage | AssistantMessage;

type UserMessage = {
	type: "user";
	text: string;
};

type ExecutionResult = {
	returnValue: any;
	stdout: string;
	stderr: string;
};

type AssistantMessage = {
	type: "assistant";
  text: string;
  code: string;
	result?: ExecutionResult;
  analysis?: string;
  status?: "complete" | "incomplete";
  /**
   * Reason for status
   */
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

// type AssistantMessage = {
// 	type: "assistant";
// 	text: string;
// 	code: string;
// };

type ChatProps = {
	messages: Message[];
	onSendMessage: (message: string) => void;
};

export default function Chat({ messages: chatMessages, onSendMessage }: ChatProps) {
	const [input, setInput] = useState<string>("");
	// const [chatMessages, setChatMessages] = useState<Message[]>(messages);

	const onSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!input.trim()) return;
			const newUserMessage: UserMessage = { type: "user", text: input };
			// setChatMessages([...chatMessages, newUserMessage]);
			onSendMessage(newUserMessage.text); // Pass only the text of the new message
			setInput("");
		},
		[input, chatMessages, onSendMessage],
	);

	return (
		<div className="flex h-screen w-full flex-col bg-[#1e1e1e]"> {/* Changed background color */}
			{/* Header and other components remain unchanged */}
			<div className="flex-1 overflow-auto p-4">
				{chatMessages.map((message, index) => (
					<div
						key={index}
						className={`flex ${
							message.type === "user" ? "justify-end" : "items-start"
						} gap-3 mb-2`} {/* Reduced margin-bottom */}
            >
            {message.type === "assistant" && (
              <>
                <div className="status-display mb-1 text-sm text-gray-500">
                  {message.status ? `Status: ${message.status}` : "No status"}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage alt="Assistant" src="/avatar.jpg" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </>
            )}
						<div className="max-w-[75%] space-y-2">
							<div
								className={`rounded-lg ${
									message.type === "user" ? "bg-blue-500" : "bg-gray-900"
								} p-1 text-white`}
							>
								<p>{message.text}</p>

                {'code' in message && (
                  <>
                    <CodeMirror value={message.code} height="200px"
                      extensions={[javascript({ jsx: true })]}
                      theme={monokaiDimmed}
                    // onChange={onChange}
                    />
                    {'result' in message && (
                      <div className="mt-2 p-2 bg-gray-800 text-white rounded">
                        <p><strong>Output:</strong> {message.result.stdout}</p>
                        {message.result.stderr && (
                          <p><strong>Error:</strong> {message.result.stderr}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="border-t border-gray-200 bg-gray-900 px-4 py-3 dark:border-gray-800 dark:bg-gray-950"> {/* Adjusted footer background */}
				<form onSubmit={onSubmit}>
					<div className="flex items-center gap-2">
						<Input
              className="flex-1 bg-[#1e1e1e] focus:outline-none text-white" // Set background color to match the chat area
							placeholder="Type your message..."
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
						/>
						<Button
							className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
							size="icon"
							type="submit"
							variant="ghost"
						>
							<SendIcon className="h-5 w-5" />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function SendIcon(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m22 2-7 20-4-9-9-4Z" />
			<path d="M22 2 11 13" />
		</svg>
	);
}
