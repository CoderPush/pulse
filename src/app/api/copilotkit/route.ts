import { NextResponse } from 'next/server';
import {
    CopilotRuntime,
    LangChainAdapter,
    copilotRuntimeNextJSAppRouterEndpoint
} from '@copilotkit/runtime';
import { ChatBedrockConverse } from "@langchain/aws";

const BEDROCK_AWS_SECRET_ACCESS_KEY = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;
const BEDROCK_AWS_ACCESS_KEY_ID = process.env.BEDROCK_AWS_ACCESS_KEY_ID;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;

const runtime = new CopilotRuntime();

const model = new ChatBedrockConverse({
    model: BEDROCK_MODEL_ID,
    region: process.env.BEDROCK_AWS_REGION ?? "us-east-1",
    temperature: 0,
    credentials: {
        secretAccessKey: BEDROCK_AWS_SECRET_ACCESS_KEY ?? "",
        accessKeyId: BEDROCK_AWS_ACCESS_KEY_ID ?? "",
    },
});

const serviceAdapter = new LangChainAdapter({
    chainFn: async ({ messages, tools }) => {
        // Filter out duplicate tool messages from input
        const seenToolCallIds = new Set();
        // Fix empty content in AIMessages by adding a content block with non-blank text
        const processedMessages = messages.map(msg => {
            if (msg.getType() === "ai" && (!msg.content || msg.content.length === 0)) {
                msg.content = [{ type: "text", text: '\u200B' }];
            } else if (msg.getType() === "ai" && Array.isArray(msg.content)) {
                // Check for blank text in existing content blocks
                msg.content = msg.content.map(block => {
                    if (block.type === "text" && (!block.text || block.text.trim() === "")) {
                        return { ...block, text: '\u200B' };
                    }
                    return block;
                });
            }
            return msg;
        });

        const filteredMessages = processedMessages.filter(msg => {
            // Check if it's a tool message by looking at its properties instead of using instanceof
            if (msg.getType() === "tool") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any        
                const toolCallId = (msg as any).tool_call_id;
                if (seenToolCallIds.has(toolCallId)) {
                    return false;
                }
                seenToolCallIds.add(toolCallId);
            }
            return true;
        });


        try {
            const response = await model.bindTools(tools).stream(filteredMessages);
            return response;
        } catch (error) {
            console.error('Error during model streaming:', error);
            throw new Error('Failed to process the request');
        }

    }
    // stream: true,
});


export const POST = async (req: Request) => {
    if (!BEDROCK_AWS_SECRET_ACCESS_KEY || !BEDROCK_AWS_ACCESS_KEY_ID) {
        return NextResponse.json(
            { error: 'AWS Bedrock configuration incomplete. Please set BEDROCK_AWS_ACCESS_KEY_ID, BEDROCK_AWS_SECRET_ACCESS_KEY, and BEDROCK_MODEL_ID.' },
            { status: 500 }
        );
    }

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        endpoint: '/api/copilotkit',
        runtime,
        serviceAdapter,
    });

    return handleRequest(req);
};
