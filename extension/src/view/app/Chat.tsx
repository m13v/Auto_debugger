import React, { useCallback, useState, useEffect, useRef } from "react";
// import ReactDOM from 'react-dom';
// import { AvatarImage, AvatarFallback, Avatar } from "./components/ui/avatar";
import ReactMarkdown from 'react-markdown';
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import type { Message, UserMessage } from "./model";
import rehypeHighlight from 'rehype-highlight';
// import hljs from 'highlight.js';
import 'highlight.js/styles/night-owl.css';
// import 'highlight.js/styles/dracula.css'; 
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
// import { ChevronUp, ChevronDown } from 'lucide-react';


unified()
  .use(rehypeParse)
  .use(rehypeHighlight)
  .use(rehypeStringify)
  .process('<pre><code class="language-js">const x = 1;</code></pre>')
  .then((file) => {
    console.log(String(file));
  });

type ChatProps = {
	messages: Message[];
	onSendMessage: (message: string) => void;
};

export default function Chat({
	messages: chatMessages,
	onSendMessage,
}: ChatProps) {
	const [input, setInput] = useState<string>("");
	const inputRef = useRef<HTMLTextAreaElement>(null); // Create a ref for the input element
	const [counter, setCounter] = useState(0);
    // const [isActive, setIsActive] = useState(true); // State to control the interval
	const [historyIndex, setHistoryIndex] = useState<number>(-1);
	const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
	const [currentIterationIndex, setCurrentIterationIndex] = useState(0);
    const [visibleIterations, setVisibleIterations] = useState<{ [key: number]: boolean }>({ 0: true });
	const modelThinkingWindowRef = useRef<HTMLDivElement>(null);
	// const [hideInitialResponse, setHideInitialResponse] = useState(false);

    const toggleVisibility = (index: number) => {
        setVisibleIterations((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const modelResponseStyle = {
        marginBottom: '20px',
    };

	const terminalWindow = {
		backgroundColor: '#333',
		color: '#fff',
		fontFamily: "'Courier New', Courier, monospace",
		whiteSpace: 'pre-wrap', // Use 'pre-wrap' to preserve whitespace and wrap text
		padding: '5px',
		borderRadius: '5px',
		fontSize: '14px',
		overflow: 'auto',
		maxHeight: '300px',
	};

    const modelThinkingWindow = {
        backgroundColor: '#2e2e2e',
        color: '#ccc',
        fontFamily: "'Courier New', Courier, monospace",
        whiteSpace: 'pre-wrap',
        padding: '5px',
        borderRadius: '5px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '200px',
        marginTop: '20px',
    };

	// useEffect(() => {
	// 	const latestMessage = chatMessages[chatMessages.length - 1];
	// 	if (latestMessage?.type === "assistant" && latestMessage.iteration_data?.iterations.length > 0) {
	// 		setHideInitialResponse(true);
	// 	}
	// }, [chatMessages]);

    useEffect(() => {
        const latestMessage = chatMessages[chatMessages.length - 1];
		if (
			latestMessage?.type === "assistant" &&
			latestMessage.iteration_data?.iterations &&
			latestMessage.iteration_data.iterations.length > currentIterationIndex + 1
		  ) {
			setCurrentIterationIndex(currentIterationIndex + 1);
			setVisibleIterations((prev) => ({ ...prev, [currentIterationIndex + 1]: false }));
		  }
    }, [chatMessages, currentIterationIndex]);

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    useEffect(() => {
        if (modelThinkingWindowRef.current) {
            modelThinkingWindowRef.current.scrollTop = modelThinkingWindowRef.current.scrollHeight;
        }
    }, [chatMessages]);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus(); // Automatically focus the input when the component mounts
		}
	}, []);

    const onSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!input.trim()) return;
            const newUserMessage: UserMessage = { type: "user", text: input };
            onSendMessage(newUserMessage.text); // Pass only the text of the new message
            setInput("");
            setCounter(() => 0);
            // setIsActive(true); // Optionally reset the interval when sending a message
			setCurrentMessageIndex(chatMessages.length); // Set the current message index to the new message
		},
		[input, onSendMessage, chatMessages.length]
    );

  const formRef = useRef<HTMLFormElement>(null);

	return (
		<div className="flex h-screen w-full flex-col bg-[#1e1e1e]">
			<div className="flex-1 overflow-auto p-4">
				{chatMessages.map((message, index) => {					
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
							{/* {message.type === "assistant" && (
								<>
									<Avatar className="h-8 w-8">
										<AvatarImage alt="Assistant" src="/avatar.jpg" />
										<AvatarFallback>AI</AvatarFallback>
									</Avatar>
								</>
							)} */}
							<div className="max-w-[75%] space-y-2">
								{message.type === "assistant" && (
									<>
										{message.meta?.isCodeGen && (
											<div className="flex items-center text-white mb-1">
										    	{index === (currentMessageIndex! + 1) && counter > 0 && <span>Thinking [{counter.toFixed(1)} sec]</span>}
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
											<div>
												{/* {!hideInitialResponse && ( */}
													{/* <h2 style={{ fontSize: '1.5em', marginTop: '1em' }}>
														Initial Model Response
														<Button
															variant="secondary"
															size="sm"
															onClick={() => toggleVisibility(0)}
															className="ml-2 mb-2"
														>
															{visibleIterations[0] ? (
																<>
																	Hide <ChevronUp className="h-4 w-4" />
																</>
															) : (
																<>
																	Show more <ChevronDown className="h-4 w-4" />
																</>
															)}
														</Button>
													</h2> */}
												{/* )} */}
												{/* {visibleIterations[0] && ( */}
													<div style={modelResponseStyle}>
														<ReactMarkdown rehypePlugins={[rehypeHighlight]}>
															{message.iteration_data.first_model_response || ""}
														</ReactMarkdown>
														<div ref={endOfMessagesRef} />
													</div>
												{/* )} */}
												{/* {visibleIterations[0] && message.iteration_data.execution_result_unfiltered && ( */}
												{message.iteration_data.execution_result_unfiltered && (
													<>
														<div className="terminal-title">Terminal Output:</div>
														<div style={terminalWindow} ref={terminalRef}>
															{message.iteration_data.execution_result_unfiltered}
															<div ref={endOfMessagesRef} />
														</div>
													</>
												)}
											</div>
											{message.iteration_data?.iterations?.map((iteration, iterationIndex) => (
												<div key={iterationIndex}>
													<h2 style={{ fontSize: '1.5em', marginTop: '1em' }}>
														Iteration Step #{iterationIndex + 1}
														<Button
															onClick={() => toggleVisibility(iterationIndex + 1)}
															variant="secondary"
															className="ml-2 mb-2"
														>
															{visibleIterations[iterationIndex + 1] ? (
																<>
																	{/* Hide <ChevronUp className="h-4 w-4" /> */}
																	Hide
																</>
															) : (
																<>
																	{/* Show more <ChevronDown className="h-4 w-4" /> */}
																	Show more
																</>
															)}
														</Button>
													</h2>
													{(iterationIndex === currentIterationIndex || visibleIterations[iterationIndex + 1]) && (
														<>
															{iteration.evaluation_result && (
																<div style={modelThinkingWindow} ref={modelThinkingWindowRef}>
																	<div>Model thinking output:</div>
																	<div><b>How did execution go? </b> {iteration.evaluation_result}</div>
																	{iteration.made_progress && (
																		<div><b>Did we make progress compared to the last iteration? </b> {iteration.made_progress}</div>
																	)}
																	{iteration.why_none_of_the_solutions_worked && (
																		<div><b>Why none of the solutions worked? </b> {iteration.why_none_of_the_solutions_worked}</div>
																	)}
																	{iteration.is_repetative_loop && (
																		<div><b>Are we in a repetitive loop? </b> {iteration.is_repetative_loop}</div>
																	)}
																	{iteration.decision_maker && (
																		<div><b>Decide what's next? </b> {iteration.decision_maker}</div>
																	)}
																	<div ref={endOfMessagesRef} />
																</div>
															)}
															<div style={modelResponseStyle} ref={endOfMessagesRef}>
																{iteration.new_iteration_results && (
																	<ReactMarkdown rehypePlugins={[rehypeHighlight]}>
																		{iteration.new_iteration_results}
																	</ReactMarkdown>
																)}
																<div ref={endOfMessagesRef} />
															</div>
															{iteration.execution_result_unfiltered && (
																<>
																	<div className="terminal-title">Terminal Output:</div>
																	<div style={terminalWindow} ref={terminalRef}>
																		{iteration.execution_result_unfiltered}
																		<div ref={endOfMessagesRef} />
																	</div>
																</>
															)}
															<div ref={endOfMessagesRef} />
														</>
													)}
												</div>
											))}
										</>
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
					</div>
				</form>
			</div>
		</div>
	);
}
