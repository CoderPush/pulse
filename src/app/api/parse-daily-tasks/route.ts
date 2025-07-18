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
  const { text } = await req.json();
  const prompt = [
    'Extract task information from the following text. For each task, return a structured object with the following fields:',
    '',
    'date: The date the task was done (format: YYYY-MM-DD, or null if not present).',
    'If a date is present but the year is missing, assume the current year.',
    'project: The project name (can be inferred or matched from context, or null if not present).',
    'bucket: The type or category of work (e.g., Development, Research, Meeting, or null if not present).',
    'hours: Number of hours spent (as a number, or null if not present).',
    'description: A brief description of the task.',
    'link: Any associated link (if mentioned, or null if not present).',
    '',
    'Support natural language input, including multiple tasks described in one sentence.',
    '',
    'Return a JSON array, one object per task, with keys: date, project, bucket, hours, description, link. If a field is missing, use null. The date field must be in ISO 8601 format if present.',
    '',
    'User input:',
    text,
    '',
    'Output:'
  ].join('\n');

  const response = await model.invoke([
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt },
  ]);

  // Ensure response.content is a string
  const content = typeof response.content === "string"
    ? response.content
    : Array.isArray(response.content)
    ? response.content.map((c) => {
        if (typeof c === "string") {
          return c;
        }
        if (typeof c === "object" && c !== null && "text" in c && typeof (c as { text: unknown }).text === "string") {
          return (c as { text: string }).text;
        }
          return "";
      }).join(" ")
      : JSON.stringify(response.content);

  let tasks = [];
  try {
    // Extract JSON array from the response string
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      tasks = JSON.parse(match[0]);
    } else {
      tasks = JSON.parse(content);
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse AI output", raw: content }, { status: 500 });
  }

  // Post-process: If the year is wrong, update to current year
  const currentYear = new Date().getFullYear();
  tasks = tasks.map((task: {
    date?: string;
    project?: string | null;
    bucket?: string | null;
    hours?: number | null;
    description?: string | null;
    link?: string | null;
    [key: string]: unknown;
  }) => {
    if (typeof task.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
      const [year, month, day] = task.date.split("-");
      if (year !== String(currentYear)) {
        return { ...task, date: `${currentYear}-${month}-${day}` };
      }
    }
    return task;
  });

  return NextResponse.json({ tasks });
}
