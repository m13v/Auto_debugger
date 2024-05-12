import React, { useCallback, useState, useEffect } from "react";
import { AvatarImage, AvatarFallback, Avatar } from "./components/ui/avatar";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { monokaiDimmed } from "@uiw/codemirror-theme-monokai-dimmed";
import { EditorView } from "@codemirror/view";

import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import type { AutoDebugContext, Message, UserMessage } from "./model";

type ChatProps = {
	messages: Message[];
	onSendMessage: (message: string) => void;
};

const customFontSizeTheme = EditorView.theme({
	"&": {
		fontSize: "12px", // Set your desired font size here
	},
	".cm-content": {
		fontFamily: "monospace", // Optional: Set the font family if needed
	},
});

export default function Chat({
	messages: chatMessages,
	onSendMessage,
}: ChatProps) {
	const [input, setInput] = useState<string>("");
	// const [chatMessages, setChatMessages] = useState<Message[]>(messages);
	const [counter, setCounter] = useState(0);
	// const [startDateTime, setStartDateTime] = useState<Date | null>(null);

	useEffect(() => {
		setCounter(0);
		const interval = setInterval(() => {
			setCounter((prevCounter) => prevCounter + 0.1);
		}, 100);

		return () => clearInterval(interval);
	}, []);

	const onSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!input.trim()) return;
			const newUserMessage: UserMessage = { type: "user", text: input };
			// setChatMessages([...chatMessages, newUserMessage]);
			onSendMessage(newUserMessage.text); // Pass only the text of the new message
			setInput("");

			// setStartDateTime(new Date());
		},
		[input, chatMessages, onSendMessage],
	);

	return (
		<div className="flex h-screen w-full flex-col bg-[#1e1e1e]">
			{" "}
			{/* Changed background color */}
			{/* Header and other components remain unchanged */}
			<div className="flex-1 overflow-auto p-4">
				{chatMessages.map((message, index) => {
					let lastHistoryItem: any;
					if ("context" in message && message?.context?.history && message.context.history.length > 0) {
						lastHistoryItem =
							message.context.history[message.context.history.length - 1];
					}
					// const timeDiff = startDateTime ? new Date().getTime() - startDateTime.getTime() : 0;
					return (
						<div
							key={index}
							className={`flex ${
								message.type === "user" ? "justify-end" : "items-start"
							} gap-3 mb-2`}
						>
							{message.type === "assistant" && (
								<>
									<Avatar className="h-8 w-8">
										<AvatarImage alt="Assistant" src="/avatar.jpg" />
										<AvatarFallback>AI</AvatarFallback>
									</Avatar>
								</>
							)}
							<div className="max-w-[75%] space-y-2">
								{message.type === "assistant" && (
									<>
										<div className="flex items-center text-white mb-1">
											{/* <span>Thinking [{timeDiff.toFixed(1)} sec]</span> */}
											{counter > 0 && <span>Thinking [{counter.toFixed(1)} sec]</span>}
											{lastHistoryItem && 'status' in lastHistoryItem && (
												<span className="ml-4">
													Status: {lastHistoryItem.status}
												</span>
											)}
										</div>
									</>
								)}

								<div
									className={`rounded-lg ${
										message.type === "user" ? "bg-blue-500" : "bg-gray-900"
									} p-1 text-white`}
								>
									<pre className="whitespace-pre-wrap">{message.text}</pre>

									{message.type === "assistant" && message.context && (
										<ShowAutoDebugging context={message.context} />
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
			<div className="border-t border-gray-200 bg-gray-900 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
				{" "}
				{/* Adjusted footer background */}
				<form onSubmit={onSubmit}>
					<div className="flex items-center gap-2">
						{/*
						<Input
							className="flex-1 bg-[#1e1e1e] focus:outline-none text-white" // Set background color to match the chat area
							placeholder="Type your message..."
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
						/>
						*/}
						<Textarea
							className="flex-1 bg-[#1e1e1e] focus:outline-none text-white" // Set background color to match the chat area
							placeholder="Type your message..."
							// type="text"
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

function ShowAutoDebugging({
	context,
}: { context: AutoDebugContext }): React.ReactNode {
	const { history } = context;
	const [historyIndex, setHistoryIndex] = useState<number>(-1);
	// const lastHistoryItem = history[history.length - 1];
	const lastHistoryItem =
		history[historyIndex < 0 ? history.length - 1 : historyIndex];
	const newCode = lastHistoryItem.code;

	return (
		<div>
			<CodeMirror
				value={newCode}
				height="600px"
				extensions={[
					javascript({ jsx: true }),
					EditorView.lineWrapping,
					customFontSizeTheme,
				]}
				theme={monokaiDimmed}
			/>

			<div className="flex justify-between items-center mt-4">
				<span className="text-white mx-4 flex-1 text-right">
					Step:{" "}
					{historyIndex < 0 ? history.length : history.length - historyIndex} of{" "}
					{history.length}
				</span>
				<div className="flex">
					<button
						onClick={() => setHistoryIndex((prev) => Math.max(prev - 1, 0))} // Decrement index, stop at 0
						className="bg-blue-300 hover:bg-blue-400 text-gray-800 font-bold py-1 px-2 rounded-l"
						style={{ marginRight: "8px" }}
					>
						&lt;
					</button>
					<button
						onClick={() =>
							setHistoryIndex((prev) => Math.min(prev + 1, history.length - 1))
						} // Increment index, stop at max index
						className="bg-blue-300 hover:bg-blue-400 text-gray-800 font-bold py-1 px-2 rounded-r"
					>
						&gt;
					</button>
				</div>
			</div>

			{/* <pre className="whitespace-pre-wrap">
				{lastHistoryItem.result?.stdout}
			</pre>
			<pre className="whitespace-pre-wrap">
				{lastHistoryItem.result?.stderr}
			</pre> */}

			<pre className="whitespace-pre-wrap">{lastHistoryItem.plan}</pre>

			{lastHistoryItem.result && (
				<div
					className="mt-2 p-2 bg-gray-800 text-white rounded"
					style={{ fontSize: "12px" }}
				>
					<div>
						<strong>Terminal:</strong>
						<pre
							className="whitespace-pre-wrap"
							style={{ fontWeight: "normal" }}
						>
							{lastHistoryItem.result.stdout}
						</pre>
					</div>
					{lastHistoryItem.result.stderr && (
						<div>
							<strong>Errors:</strong>
							<pre
								className="whitespace-pre-wrap"
								style={{ fontWeight: "normal" }}
							>
								{lastHistoryItem.result.stderr}
							</pre>
						</div>
					)}
				</div>
			)}

			<pre className="whitespace-pre-wrap">{lastHistoryItem.analysis}</pre>
			<div>
				{lastHistoryItem.status} - {lastHistoryItem.reason}
			</div>
			{/* <pre>
      {JSON.stringify(lastHistoryItem, null, 2)}
    </pre> */}
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
