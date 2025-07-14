import { NextResponse } from "next/server";
import { ChatBedrockConverse } from "@langchain/aws";

const BEDROCK_AWS_SECRET_ACCESS_KEY = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;
const BEDROCK_AWS_ACCESS_KEY_ID = process.env.BEDROCK_AWS_ACCESS_KEY_ID;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;
const BEDROCK_AWS_REGION = process.env.BEDROCK_AWS_REGION ?? "us-east-1";

const model = new ChatBedrockConverse({
  model: BEDROCK_MODEL_ID,
  region: BEDROCK_AWS_REGION,
  temperature: 0,
  credentials: {
    secretAccessKey: BEDROCK_AWS_SECRET_ACCESS_KEY ?? "",
    accessKeyId: BEDROCK_AWS_ACCESS_KEY_ID ?? "",
  },
});

export async function POST(req: Request) {
  const { tasks } = await req.json();
  // tasks: array of { date, project, bucket, hours, description }
  const prompt = [
    'You are an assistant helping summarize a weekly task log.',
    'Based on the list below, write a 3-part insight summary:',
    'Key Accomplishments',
    'What Mattered Most',
    'Lessons & Next Focus',
    'Focus on outcomes and impact. Don’t summarize by hours or distribution. Think like a product team reflecting on progress and priorities.',
    'Return the result as a JSON object with this structure:',
    '{',
    '  "keyAccomplishments": "...",',
    '  "whatMatteredMost": "...",',
    '  "lessonsAndNextFocus": "..."',
    '}',
    '',
    'Tasks:',
    JSON.stringify(tasks, null, 2),
    '',
    'Summary:'
  ].join('\n');

  const response = await model.invoke([
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt },
  ]);

  // Ensure response.content is a string and parse JSON if possible
  let summaryJson;
  if (typeof response.content === "string") {
    try {
      summaryJson = JSON.parse(response.content);
    } catch {
      summaryJson = { summary: response.content };
    }
  } else if (Array.isArray(response.content)) {
    const joined = response.content
      .map((c) => {
        if (typeof c === "string") {
          return c;
        }
        if (typeof c === "object" && c !== null && "text" in c && typeof (c as { text: unknown }).text === "string") {
          return (c as { text: string }).text;
        }
        return "";
      })
      .join(" ");
    try {
      summaryJson = JSON.parse(joined);
    } catch {
      summaryJson = { summary: joined };
    }
  } else {
    summaryJson = { summary: JSON.stringify(response.content) };
  }

  return NextResponse.json(summaryJson);
}
