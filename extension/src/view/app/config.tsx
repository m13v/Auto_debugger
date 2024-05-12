import React, { useState, useEffect, useCallback } from 'react';
import { type IConfig } from "./model";
import Chat, { Message } from './Chat';

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
      console.log('Webview received message:', event.data);

      // Assuming the message from the event should also be displayed in the chat
      const incomingMessage: Message = {
        type: 'assistant', // Assuming all incoming messages are from the assistant
        text: event.data.text,
        code: event.data.code // Assuming there's a 'code' field in the incoming data
      };

      // Update messages state to include the incoming message
      setMessages(prevMessages => [...prevMessages, incomingMessage]);

      vscode.postMessage({
        command: 'pong',
        text: 'Pong from webview'
      });
    };

    window.addEventListener('message', handleMessage);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  // useEffect(() => {
  //   console.log('Updated messages:', messages);
  // }, [messages]); // This useEffect runs every time `messages` changes

  const onSendMessage = useCallback((message: string) => {
    const newMessage: Message = {
      type: 'user',
      text: message
    };

    // Update local messages state
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // Send message to vscode
    vscode.postMessage({
      command: 'message',
      text: message
    });
  }, [vscode]);

  return (
    <React.Fragment>
      <Chat messages={messages} onSendMessage={onSendMessage} />
    </React.Fragment>
  );
};

export default Config;
