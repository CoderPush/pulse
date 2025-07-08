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
  const prompt = `You are an expert assistant for parsing daily work logs.\n\nGiven the following user input, extract for each line:\n- date (if present, convert to ISO 8601 date string format 'YYYY-MM-DD', e.g. '2025-06-26', or omit if not present)\n- project (from @project-name, [project], or prefix like 'Commun1ty:')\n- bucket (from #bucket, or from context like 'fix:', 'feature:', etc., or omit if not present)\n- hours (from e.g. '1.5h', '2 hours', '2 giờ', or a number at the end of the line)\n- description (the rest of the text, excluding project, bucket, hours, and date)\n\nReturn a JSON array, one object per line, with keys: date, project, bucket, hours, description. If a field is missing, use null. The date field must be in ISO 8601 format if present.\n\nUser input:\n${text}\n\nOutput:`;

  const response = await model.invoke([
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt },
  ]);

  // Try to extract JSON from the model's response
  let tasks = [];
  try {
    const match = response.content.match(/\[.*\]/s);
    if (match) {
      tasks = JSON.parse(match[0]);
    } else {
      // fallback: try to parse the whole response
      tasks = JSON.parse(response.content);
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse AI output", raw: response.content }, { status: 500 });
  }

  return NextResponse.json({ tasks });
}
