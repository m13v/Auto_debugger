var ws = new WebSocket('ws://localhost:8080');
ws.onopen = function() {
  console.log('WebSocket connection established');
  ws.send('Hello, server!');
};
ws.onmessage = function(event) {
  console.log('Message from server:', event.data);
};