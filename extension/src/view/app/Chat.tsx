import React, { useCallback, useState, useEffect, useRef } from "react";
import { AvatarImage, AvatarFallback, Avatar } from "./components/ui/avatar";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { monokaiDimmed } from "@uiw/codemirror-theme-monokai-dimmed";
import { EditorView } from "@codemirror/view";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import { llamaImage } from './llama.jpg';
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import type { AutoDebugContext, Message, UserMessage, isCodeGen } from "./model";
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/monokai.css'; // Import the Monokai theme
import Terminal from 'terminal-in-react';

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
    const [logs, setLogs] = useState<string[]>([]);
	const inputRef = useRef<HTMLTextAreaElement>(null); // Create a ref for the input element
	const [counter, setCounter] = useState(0);
    const [isActive, setIsActive] = useState(true); // State to control the interval
	const [historyIndex, setHistoryIndex] = useState<number>(-1);
	const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);

    const modelResponseStyle = {
        marginBottom: '20px',
    };

	const terminalStyle = {
		backgroundColor: '#333',
		color: '#fff',
		padding: '10px',
		fontFamily: "'Courier New', Courier, monospace",
		whiteSpace: 'pre-wrap',
	};

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus(); // Automatically focus the input when the component mounts
		}
	}, []);

	useEffect(() => {
        console.log("Chat messages updated:", chatMessages); // Log chat messages

        if (!isActive) {
            return; // If not active, do nothing (effectively pausing the interval)
        }

		const interval = setInterval(() => {
			setCounter((prevCounter) => prevCounter + 0.1);
	
			// Check the status of the last history item and stop the interval if complete
			const lastHistoryItem = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].context?.history?.slice(-1)[0] : null;
			if (lastHistoryItem && lastHistoryItem.status === 'complete') {
				console.log("Last History Item Status:", lastHistoryItem.status);
				setIsActive(false); // Stop the interval by setting isActive to false
				clearInterval(interval); // Clear the interval immediately
			}
		}, 100);

        return () => clearInterval(interval);
    }, [chatMessages, isActive]); // Include isActive in the dependency array

    const onSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!input.trim()) return;
            const newUserMessage: UserMessage = { type: "user", text: input };
            onSendMessage(newUserMessage.text); // Pass only the text of the new message
            setInput("");
            setCounter(() => 0);
            setIsActive(true); // Optionally reset the interval when sending a message
			setCurrentMessageIndex(chatMessages.length); // Set the current message index to the new message
		},
		[input, onSendMessage, chatMessages.length]
    );

  const formRef = useRef<HTMLFormElement>(null);

	return (
		<div className="flex h-screen w-full flex-col bg-[#1e1e1e]">
			<div className="flex-1 overflow-auto p-4">
				{chatMessages.map((message, index) => {
					// console.log("Message object:", message);
					// const firstModelResponse = message.iteration_data?.first_model_response ?? "Default response if undefined";
					// if (firstModelResponse !== "Default response if undefined") {
					// 	console.log("iteration_data:", message.iteration_data);
					// 	console.log("first_model_response=", firstModelResponse);
					// } else {
					// 	console.log("iteration_data:", message.iteration_data);
					// 	console.log("first_model_response is undefined", message.iteration_data?.assistant_id, message.iteration_data?.first_model_response);
					// }						
					let lastHistoryItem: any;
					let status: string = 'debugging...';
					if ("context" in message && message?.context?.history && message.context.history.length > 0) {
						lastHistoryItem =
							message.context.history[message.context.history.length - 1];
						status = lastHistoryItem?.status ?? 'debugging...';
					}
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
										{message.meta?.isCodeGen && (
											<div className="flex items-center text-white mb-1">
												{index === (currentMessageIndex+1) && counter > 0 && <span>Thinking [{counter.toFixed(1)} sec]</span>}
												{status && (
													<span className="ml-4">
														Status: {status === 'complete' ? `Complete ✅` : status}
													</span>
												)}
												<span className="text-white mx-4 flex-1 text-right">
													Step:{" "}
													{historyIndex < 0 ? history.length : (historyIndex + 1)} of{" "}
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
										)}
									</>
								)}

								<div
									className={`rounded-lg ${
										message.type === "user" ? "bg-blue-500" : "bg-gray-900"
									} p-1 text-white`}
								>
									{message.type === "user" && (
										<pre className="whitespace-pre-wrap">{message.text || ""}</pre>
									)}
									{message.type === "assistant" && message.iteration_data && (
										<>
											{/* Render the first model response */}
											<div style={modelResponseStyle}>
												{/* <ReactMarkdown 
													className="whitespace-pre-wrap"
													components={{
														code({ node, inline, className, children, ...props }) {
															const match = /language-(\w+)/.exec(className || '');
															return !inline && match ? (
																<SyntaxHighlighter
																	style={dark}
																	language={match[1]}
																	PreTag="div"
																	{...props}
																>
																	{String(children).replace(/\n$/, '')}
																</SyntaxHighlighter>
															) : (
																<code className={className} {...props}>
																	{children}
																</code>
															);
														}
													}}
												> */}
										        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
													{message.iteration_data.first_model_response || ""}
												</ReactMarkdown>
											</div>

											{/* Render the execution result unfiltered as terminal output */}
                                            <div style={terminalStyle}>
                                                <Terminal
                                                    color='green'
                                                    backgroundColor='black'
                                                    barColor='black'
                                                    style={{ fontWeight: "bold", fontSize: "1em" }}
                                                    commands={{
                                                        'show-log': () => message.iteration_data.execution_result_unfiltered || "",
                                                    }}
                                                    description={{
                                                        'show-log': 'Shows the execution log',
                                                    }}
                                                    msg={message.iteration_data.execution_result_unfiltered || ""}
                                                />
                                            </div>
										</>
									)}
									{/* {message.type === "assistant" && message.context && (
										<ShowAutoDebugging context={message.context} />
									)} */}
								</div>
							</div>
						</div>
					);
				})}
			</div>
			<div className="border-t border-gray-200 bg-gray-900 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
				{" "}
				{/* Adjusted footer background */}
				<form ref={formRef} onSubmit={onSubmit}>
					<div className="flex items-center gap-2">
						<Textarea
							className="flex-1 bg-[#1e1e1e] focus:outline-none text-white"
							placeholder="Type your message..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							ref={inputRef}
							onKeyDown={(event) => {
								if (event.key === 'Enter' && !event.shiftKey) {
									event.preventDefault(); // Prevent default to stop from entering a new line
									formRef.current?.requestSubmit(); // Use requestSubmit to trigger form submission
								}
							}}
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

// function ShowAutoDebugging({
// 	context,
// }: { context: AutoDebugContext }): React.ReactNode {
// 	const { history } = context;
// 	const [historyIndex, setHistoryIndex] = useState<number>(-1);
// 	const lastHistoryItem = history[historyIndex < 0 ? history.length - 1 : historyIndex];
// 	const newCode = lastHistoryItem.code;
// 	const [isExpanded, setIsExpanded] = useState(false);

// 	return (
// 		<div>
// 			<CodeMirror
// 				value={newCode}
// 				height="auto"
// 				extensions={[
// 					javascript({ jsx: true }),
// 					EditorView.lineWrapping,
// 					customFontSizeTheme,
// 				]}
// 				theme={monokaiDimmed}
// 			/>

// 			{lastHistoryItem.result && (
// 				<>
// 					<div> <strong>TERMINAL:</strong> </div>
// 					<div
// 						className="terminal-output"
// 						style={{ backgroundColor: "black", color: "white", padding: "10px", fontSize: "12px", fontWeight: "normal" }}
// 					>
// 						<div>
// 							<pre
// 								className="whitespace-pre-wrap"
// 								style={{ fontWeight: "normal" }}
// 							>
// 								{lastHistoryItem.result.stdout}
// 							</pre>
// 						</div>
// 						{lastHistoryItem.result.stderr && (
// 							<div>
// 								<strong>Errors:</strong>
// 								<pre
// 									className="whitespace-pre-wrap"
// 									style={{ fontWeight: "normal" }}
// 								>
// 									{lastHistoryItem.result.stderr}
// 								</pre>
// 							</div>
// 						)}
// 					</div>
// 				</>
// 			)}

// 			<ReactMarkdown
// 				children={isExpanded ? lastHistoryItem.analysis : `Analysis...`}
// 				components={{
// 					p: ({ node, ...props }) => <p style={{ fontSize: '0.8em' }} {...props} />,
// 				}}
// 			/>
// 			<button onClick={() => setIsExpanded(!isExpanded)}>
// 				{isExpanded ? 'Read less' : 'Read more'}
// 			</button>
// 		</div>
// 	);
// }

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
