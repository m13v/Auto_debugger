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
			console.log("CONFIG: handleMessage");

			switch (event.data.command) {
				case "message": {
					const incomingMessage: Message = {
						type: "assistant", // Assuming all incoming messages are from the assistant
						text: event.data.text,
						meta: event.data.meta || {}, // Provide a default value for meta
					};
					console.log("CONFIG: message"); // Log the processed message
					setMessages((prevMessages) => [...prevMessages, incomingMessage]);
					break;
				}
				case "update-context": {
					const { context } = event.data;
					console.log("CONFIG: update-context: context=", context); // Log the context update
					// const { history } = context;
					// const lastHistoryItem = history[history.length - 1];
					// const newCode = lastHistoryItem.code;

					setMessages((prevMessages) => {
						const lastMessage = prevMessages[prevMessages.length - 1];
						console.log("CONFIG: prevMessages=", prevMessages); // Log the context update
						if (lastMessage && lastMessage.type === "assistant") {
							const updatedMessage: AssistantMessage = {
								type: "assistant",
								text: lastMessage.text,
								meta: event.data.meta || {}, // Provide a default value for meta
								context,
							};
							
							return [...prevMessages.slice(0, -1), updatedMessage];
						}
						return prevMessages; // Return previous messages unchanged if no update is needed
					});
				}
				case "stream-message": {
					const streamData = event.data.text;
					console.log("CONFIG: stream-message"); // Log the stream message
					setMessages((prevMessages) => {
						const lastMessage = prevMessages[prevMessages.length - 1];
						if (lastMessage && lastMessage.type === "assistant") {
							const updatedMessage: AssistantMessage = {
								type: "assistant",
								text: lastMessage.text + streamData, // Append stream data to the last message
								meta: event.data.meta || {} as any, // Provide a default value for meta
								context: lastMessage.context,
							};
							return [...prevMessages.slice(0, -1), updatedMessage];
						}
						return prevMessages; // Return previous messages unchanged if no update is needed
					});
					break;
				}
			}
		};
		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [vscode]);

	const onSendMessage = useCallback(
		(message: string) => {
			const newMessage: Message = {
				type: "user",
				text: message,
			};

			setMessages((prevMessages) => [...prevMessages, newMessage]);

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
