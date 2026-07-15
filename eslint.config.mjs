import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/**/*.{js,jsx,ts,tsx}",
      "components/**/*.{js,jsx,ts,tsx}",
      "hooks/**/*.{js,jsx,ts,tsx}",
      "lib/**/*.{js,jsx,ts,tsx}",
      "schemas/**/*.{js,jsx,ts,tsx}",
      "services/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "url",
              message:
                "Use the WHATWG URL and URLSearchParams APIs instead of Node's legacy url module.",
            },
            {
              name: "node:url",
              message:
                "Use the WHATWG URL and URLSearchParams APIs instead of Node's legacy url module.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='require'][arguments.0.value=/^(node:)?url$/]",
          message:
            "Use the WHATWG URL and URLSearchParams APIs instead of Node's legacy url module.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "components/organizer/**",
  ]),
]);

export default eslintConfig;
