import React, { useState, useEffect, useCallback } from "react";
import type { Message, IConfig, AssistantMessage } from "./model";
import Chat from "./Chat";

interface IConfigProps {
	vscode: any;
	initialData: IConfig;
}

const Config = ({ vscode, initialData }: IConfigProps) => {
	// const [config, setConfig] = useState<IConfig>(() => {
	//   const oldState = vscode.getState();
	//   return oldState || { config: initialData };
	// });

	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			console.log("Webview received message:", event.data);

			switch (event.data.command) {
				case "message": {
					// Assuming the message from the event should also be displayed in the chat
					const incomingMessage: Message = {
						type: "assistant", // Assuming all incoming messages are from the assistant
						text: event.data.text,
						// code: event.data.code, // Assuming there's a 'code' field in the incoming data
					};

					// Update messages state to include the incoming message
					setMessages((prevMessages) => [...prevMessages, incomingMessage]);
					break;
				}
				case "update-context": {
					const { context } = event.data;
					const { history } = context;
					// const newCode = context.code;
					const lastHistoryItem = history[history.length - 1];
					const newCode = lastHistoryItem.code;

					console.log("Updating context with code:", newCode);

					setMessages((prevMessages) => {
						// get last message
						const lastMessage = prevMessages[prevMessages.length - 1];
						if (lastMessage && lastMessage.type === "assistant") {
							const updatedMessage: AssistantMessage = {
								type: "assistant",
								text: lastMessage.text,
								context,
							};

							// Update messages state to include the updated message
							return [...prevMessages.slice(0, -1), updatedMessage];
						}
						console.error("No assistant message to update", lastMessage);
						return prevMessages; // Return previous messages unchanged if no update is needed
					});
				}
			}

			// vscode.postMessage({
			// 	command: "pong",
			// 	text: "Pong from webview",
			// });
		};

		window.addEventListener("message", handleMessage);

		// Cleanup function to remove the event listener
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [vscode]);

	// useEffect(() => {
	//   console.log('Updated messages:', messages);
	// }, [messages]); // This useEffect runs every time `messages` changes

	const onSendMessage = useCallback(
		(message: string) => {
			const newMessage: Message = {
				type: "user",
				text: message,
			};

			// Update local messages state
			setMessages((prevMessages) => [...prevMessages, newMessage]);

			// Send message to vscode
			vscode.postMessage({
				command: "message",
				text: message,
			});
		},
		[vscode],
	);

	return (
		<React.Fragment>
			<Chat messages={messages} onSendMessage={onSendMessage} />
		</React.Fragment>
	);
};

export default Config;
