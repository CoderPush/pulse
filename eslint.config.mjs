import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/app/(authenticated)/daily-tasks/page.tsx", "src/app/api/parse-daily-tasks/route.ts", "src/app/(authenticated)/daily-tasks/parse/DailyPulseAIAssistant.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [
      "src/app/(authenticated)/daily-tasks/parse/DailyPulseAIAssistant.tsx",
      "src/app/(authenticated)/daily-tasks/parse/ParseTab.tsx",
      "src/app/(authenticated)/daily-tasks/parse/TaskSummaryList.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
