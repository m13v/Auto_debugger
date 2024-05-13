"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const DummyChatComponent = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [newMessage, setNewMessage] = (0, react_1.useState)('');
    const handleSendMessage = () => {
        if (newMessage.trim() !== '') {
            const newMessageObject = {
                id: messages.length + 1,
                text: newMessage
            };
            setMessages([...messages, newMessageObject]);
            setNewMessage('');
        }
    };
    const handleInputChange = (event) => {
        setNewMessage(event.target.value);
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Dummy Chat"),
        react_1.default.createElement("div", null, messages.map(message => (react_1.default.createElement("div", { key: message.id }, message.text)))),
        react_1.default.createElement("input", { type: "text", value: newMessage, onChange: handleInputChange, onKeyPress: handleKeyPress, placeholder: "Type a message..." }),
        react_1.default.createElement("button", { onClick: handleSendMessage }, "Send")));
};
exports.default = DummyChatComponent;
//# sourceMappingURL=ChatComponent.js.map