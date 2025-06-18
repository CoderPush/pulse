import { NextResponse } from 'next/server';
import {
    CopilotRuntime,
    LangChainAdapter,
    copilotRuntimeNextJSAppRouterEndpoint
} from '@copilotkit/runtime';
import { ChatBedrockConverse } from "@langchain/aws";
import { BaseMessage } from '@langchain/core/messages';
import { traceable } from "langsmith/traceable";

const BEDROCK_AWS_SECRET_ACCESS_KEY = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;
const BEDROCK_AWS_ACCESS_KEY_ID = process.env.BEDROCK_AWS_ACCESS_KEY_ID;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT;

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
    chainFn: async ({ messages, tools, threadId }) => {
        // Filter out duplicate tool messages from input
        const seenToolCallIds = new Set();
        let filteredMessages;
        
        try {
            // Fix empty content in AIMessages by adding a content block with non-blank text
            const processedMessages = messages.map(msg => {
                if (!msg) return msg; // Skip null/undefined messages
                
                try {
                    if (msg.getType() === "ai") {
                        if (!msg.content || msg.content.length === 0) {
                            // Handle empty content
                            msg.content = [{ type: "text", text: '\u200B' }];
                        } else if (Array.isArray(msg.content)) {
                            // Check for blank text in existing content blocks
                            msg.content = msg.content.map(block => {
                                if (block && block.type === "text" && (!block.text || block.text.trim() === "")) {
                                    return { ...block, text: '\u200B' };
                                }
                                return block;
                            });
                        }
                    }
                } catch (err) {
                    console.warn('Error processing message:', err);
                    // Return the original message if processing fails
                }
                return msg;
            });

            filteredMessages = processedMessages.filter(msg => {
                if (!msg) return false; // Filter out null/undefined messages
                
                try {
                    // Check if it's a tool message by looking at its properties
                    if (msg.getType() === "tool") {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any        
                        const toolCallId = (msg as any).tool_call_id;
                        if (!toolCallId) return true; // Keep messages without tool_call_id
                        
                        if (seenToolCallIds.has(toolCallId)) {
                            return false; // Filter out duplicate tool messages
                        }
                        seenToolCallIds.add(toolCallId);
                    }
                    return true;
                } catch (err) {
                    console.warn('Error filtering message:', err);
                    return false; // Filter out problematic messages
                }
            });
            
            // Log message counts for debugging
            console.log(`Original messages: ${messages.length}, Processed: ${processedMessages.length}, Filtered: ${filteredMessages.length}`);
        } catch (err) {
            console.error('Error in message preprocessing:', err);
            // Fall back to original messages if preprocessing fails
            filteredMessages = messages;
        }


        try {
            // Log the model and tools configuration for debugging
            console.log(`Using Bedrock model: ${BEDROCK_MODEL_ID}`);
            console.log(`Number of tools available: ${tools?.length || 0}`);
            
            const streamMsg = traceable(
                async function streamMessages(messages: Array<BaseMessage>) {
                    return await model.bindTools(tools).stream(messages)
                },
                {
                    run_type: "llm",
                    name: "CopilotKit LLM Call",
                    project_name: LANGSMITH_PROJECT,
                    metadata: { thread_id: threadId },
                }
            );
            return await streamMsg(filteredMessages);
        } catch (error) {
            // Log detailed error information
            console.error('Error during model streaming:', error);
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            
            // Check for specific error types
            if (error.name === 'ValidationException' || error.message?.includes('validation')) {
                throw new Error(`Bedrock validation error: ${error.message}`);
            } else if (error.name === 'AccessDeniedException' || error.message?.includes('access')) {
                throw new Error(`Bedrock access error: Check your AWS credentials and permissions`);
            } else if (error.name === 'ModelNotReadyException') {
                throw new Error(`Bedrock model not ready: ${BEDROCK_MODEL_ID}`);
            } else if (error.name === 'ThrottlingException') {
                throw new Error(`Bedrock throttling error: Request was throttled`);
            }
            
            throw new Error(`Failed to process the request: ${error.message}`);
        }
    }
});


export const POST = async (req: Request) => {
    if (!BEDROCK_AWS_SECRET_ACCESS_KEY || !BEDROCK_AWS_ACCESS_KEY_ID || !BEDROCK_MODEL_ID) {
        return NextResponse.json(
            { error: 'AWS Bedrock configuration incomplete. Please set BEDROCK_AWS_ACCESS_KEY_ID, BEDROCK_AWS_SECRET_ACCESS_KEY, and BEDROCK_MODEL_ID.' },
            { status: 500 }
        );
    }
    
    // Log request information for debugging
    console.log(`Processing Copilot request with model: ${BEDROCK_MODEL_ID}`);
    console.log(`AWS Region: ${process.env.BEDROCK_AWS_REGION || "us-east-1"}`);
    console.log(`LangSmith Project: ${LANGSMITH_PROJECT || "Not configured"}`);
    

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        endpoint: '/api/copilotkit',
        runtime,
        serviceAdapter,
    });

    return handleRequest(req);
};
