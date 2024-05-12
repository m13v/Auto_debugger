import React, { useState, useEffect } from 'react';

import { type IConfig, type IUser, type ICommand, CommandAction } from "./model";
import Chat from './Chat';

interface IConfigProps {
  vscode: any;
  initialData: IConfig;
}

// interface IConfigState {
//   config: IConfig;
// }

const Config = ({ vscode, initialData }: IConfigProps) => {
  // const [config, setConfig] = useState<IConfig>(() => {
  //   const oldState = vscode.getState();
  //   return oldState || { config: initialData };
  // });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Webview received message:', event.data);

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

  /*
  const defineState = (newState: IConfigState) => {
    setConfig(newState);
    vscode.setState(newState);
  };

  const saveConfig = () => {
    const command: ICommand = {
      action: CommandAction.Save,
      content: config
    };
    vscode.postMessage(command);
  };
  */

  return (
    <React.Fragment>
      <Chat />
    </React.Fragment>
  );
};

export default Config;

