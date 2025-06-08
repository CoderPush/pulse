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
        return model.bindTools(tools).invoke(messages);
    }
});

export const POST = async (req: Request) => {
    if (!BEDROCK_AWS_SECRET_ACCESS_KEY || !BEDROCK_AWS_ACCESS_KEY_ID) {
        return NextResponse.json(
            { error: 'AWS Bedrock credentials not configured' },
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
