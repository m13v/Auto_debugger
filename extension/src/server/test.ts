import { OpenAI } from "openai";
import * as vscode from 'vscode';

const OPENAI_API_KEY = vscode.workspace.getConfiguration().get<string>('yourExtension.apiKey');
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const GPTmodel = 'gpt-4o-2024-05-13';
const fastModel = GPTmodel;
const assistant =  openai.beta.assistants.create({
    instructions: `You are a python code interpreter. When given code, you run the code to see if it compiles, functions as expected, and produces results relevant to user prompt: ${prompt}. If it does not you iterate over logs until it runs as expected`,
    model: fastModel,
    tools: [{ "type": "code_interpreter" }],
});
const thread =  openai.beta.threads.create()
const code = '''
name = "Alice"
age = 30

# Function to greet a person
def greet(person_name):
    print(f"Hello, {person_name}!")

# Conditional statement
if age > 18:
    print(f"{name} is an adult.")
else:
    print(f"{name} is not an adult.")

# Loop to print numbers from 1 to 5
for i in range(1, 6):
    print(i)

# Calling the function
greet(name)
'''
const message =  openai.beta.threads.messages.create(
    thread.id,
    {
        role: "user",
        content: code,
    },
);
// We use the stream SDK helper to create a run with
// streaming. The SDK provides helpful event listeners to handle 
// the streamed response.

const run = openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id
})
    .on('textCreated', (text) => process.stdout.write('\nassistant > '))
    .on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
    .on('toolCallCreated', (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === 'code_interpreter') {
            if (toolCallDelta.code_interpreter.input) {
                process.stdout.write(toolCallDelta.code_interpreter.input);
            }
            if (toolCallDelta.code_interpreter.outputs) {
                process.stdout.write("\noutput >\n");
                toolCallDelta.code_interpreter.outputs.forEach(output => {
                    if (output.type === "logs") {
                        process.stdout.write(`\n${output.logs}\n`);
                    }
                });
            }
        }
    })

console.log('run=', run)