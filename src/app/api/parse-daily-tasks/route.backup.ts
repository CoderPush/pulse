import { NextResponse } from "next/server";

// Simple parser using regex for demo; replace with LLM call for production
function parseTaskLine(line) {
  // Example: "Fixed login bug @project-alpha #bugfix 1.5h"
  const projectMatch = line.match(/@([\w-]+)/);
  const bucketMatch = line.match(/#(\w+)/);
  const hoursMatch = line.match(/([\d.]+)\s*(h|hours?)/i);
  const description = line.replace(/@[\w-]+/, "").replace(/#\w+/, "").replace(/([\d.]+)\s*(h|hours?)/i, "").trim();
  return {
    project: projectMatch ? projectMatch[1] : "",
    bucket: bucketMatch ? bucketMatch[1] : "",
    hours: hoursMatch ? parseFloat(hoursMatch[1]) : null,
    description,
  };
}

export async function POST(req) {
  const { text } = await req.json();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const tasks = lines.map(parseTaskLine);
  return NextResponse.json({ tasks });
}
