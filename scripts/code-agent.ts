import vm from 'node:vm';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq();

interface AcceptanceCriteria {
    criteria: string;
    // TODO add more
}

interface Program {
    code: string;
    result?: ExecutionResult;
}

interface Context {
    goal: string;
    scratchpad: string;
    acceptanceCriterias: AcceptanceCriteria[];
    history: Program[];
}

async function main() {
    // const chatCompletion = await groq.chat.completions.create({
    //     messages: [
    //         { role: 'system', content: 'You are an expert software engineer with knowledge of debugging best practices.' },
    //         { role: 'user', content: 'Explain the importance of low latency LLMs' }
    //     ],
    //     model: 'llama3-8b-8192',
    // });
    // console.log(chatCompletion.choices[0].message.content);

    // const code = await writeCode('Explain the importance of low latency LLMs')

    const context: Context = {
        goal: 'Print 2+2',
        scratchpad: '',
        acceptanceCriterias: [],
        history: []
    }

    const program = await writeProgram(context)

    console.log(program)

    const result = await executeProgram(program)

    console.log(result)

    const programWithResult: Program = {
        code: program.code,
        result
    }
    context.history.push(programWithResult)

    // Reflect
    const reflection = await reflect(context);
    console.log('reflection', reflection)

// 1. Problem decomposition
// 2. Planning
// 3. Code writing - basic
// 4. Code execution - check
// 5. Reflection
// -- recap of known issues
// -- possible root causes for each issue
// -- how to check assumptions
// -- where to place breakpoints
// 6. Repeat at #2

}

// Note: cannot stream with tool calling

async function writeProgram(context: Context): Promise<Program> {
    const prompt = `Write a JavaScript/Nodejs program for the following task. Only output the code. Do not output any explanation or comments.

Task: ${context.goal}`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are an expert software engineer with knowledge of debugging best practices.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama3-8b-8192',
        //
        // Optional parameters
        //
        // Controls randomness: lowering results in less random completions.
        // As the temperature approaches zero, the model will become deterministic
        // and repetitive.
        temperature: 0.5,
        // The maximum number of tokens to generate. Requests can use up to
        // 2048 tokens shared between prompt and completion.
        max_tokens: 1024,
        // Controls diversity via nucleus sampling: 0.5 means half of all
        // likelihood-weighted options are considered.
        top_p: 1,
        // A stop sequence is a predefined or user-specified text string that
        // signals an AI to stop generating content, ensuring its responses
        // remain focused and concise. Examples include punctuation marks and
        // markers like "[end]".
        // stop: null,
        // If set, partial message deltas will be sent.
        // stream: true
    });

    const rawCode = chatCompletion.choices[0].message.content;

    let code = rawCode;
    if (code.startsWith('```')) {
        code = code.substring(code.indexOf('\n') + 1);
    }
    if (code.endsWith('```')) {
        code = code.substring(0, code.lastIndexOf('\n'));
    }

    return {
        code,
        result: undefined
    }

    // for await (const chunk of stream) {
    //     process.stdout.write(chunk.choices[0]?.delta?.content || '');
    // }
    // const result = await promise;
    // console.log(result);
}

type ExecutionResult = {
    returnValue: string;
    stdout: string;
    stderr: string;
}

async function executeProgram(program: Program): Promise<ExecutionResult> {
    // use Node.js to run arbitary code in a sandbox

    try {
        let output = [];
        let errors = [];

        let sandbox = {
            console: {
                log: (...args: any[]) => { output.push(args.join(' ')); },
                error: (...args: any[]) => { errors.push(args.join(' ')); }
            }
        };

        let script = new vm.Script(program.code);
        let context = vm.createContext(sandbox);
        let result = script.runInContext(context);
        console.log(result);
        return { stdout: output.join('\n'), stderr: errors.join('\n'), returnValue: result };

    } catch (err) {
        console.error('Failed to execute code:', err);
        return Promise.reject(new Error(`Failed with error: ${err}`))
    }
}

async function reflect(context: Context) {
    return ''
}


main();
