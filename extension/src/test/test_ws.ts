const WebSocket = require('ws'); // @ts-ignore
const { spawn } = require('child_process');

const promptMessage = "HI THERE";

const wss = new WebSocket.Server({ port: 8080, clientTracking: true });
console.log("wss", wss.clients);

wss.on('connection', function connection(ws) {
  console.log('New client connected');
  ws.send('Hello, client!'); // Send a message to the client upon connection

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  const process = spawn('python', ['src/server/debugging_logic.py', promptMessage], { stdio: ['inherit', 'pipe', 'pipe'] });
  
  ws.send(`Process started successfully with PID: ${process.pid}`);

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data.toString()}`);
    ws.send('stdout');
    ws.send(data.toString());
  });
  
  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data.toString()}`);
    ws.send('stderr');
    ws.send(`Error: ${data.toString()}`);
  });
  
  process.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
    ws.send(`Process exited with code ${code}`);
  });

});

var ws = new WebSocket('ws://localhost:8080');
ws.onopen = function() {
  console.log('WebSocket connection established');
  ws.send('Hello, server!');
};

ws.onmessage = function(event) {
  console.log('Message from server:', event.data);
};

wss.on('listening', () => {
  console.log('WebSocket server is listening on port 8080');
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});
console.log('WebSocket server created');