import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescript from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Define custom rules for InstaBids project
const instabidsRules = {
  // Naming conventions
  "camelcase": ["error", { "properties": "never" }],
  "@typescript-eslint/naming-convention": [
    "error",
    // Event handlers must start with 'handle'
    {
      "selector": "function",
      "format": ["camelCase"],
      "filter": {
        "regex": "^handle[A-Z]",
        "match": true
      }
    },
    // Boolean variables should use auxiliary verbs
    {
      "selector": "variable",
      "types": ["boolean"],
      "format": ["camelCase"],
      "prefix": ["is", "has", "should", "can", "did", "will"]
    }
  ],
  
  // Directory and file naming is enforced outside ESLint
  
  // Typescript preferences
  "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  
  // React best practices
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  
  // Import organization
  "import/order": ["error", { 
    "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
    "newlines-between": "always",
    "alphabetize": { "order": "asc" }
  }],
  
  // Enforce Next.js patterns
  "@next/next/no-html-link-for-pages": "error",
  "@next/next/no-img-element": "error",
  
  // Accessibility
  "jsx-a11y/alt-text": "error",
  "jsx-a11y/aria-props": "error",
  "jsx-a11y/aria-role": "error",
  
  // General code quality
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "prefer-const": "error",
  "no-var": "error"
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  
  // Apply plugins
  {
    plugins: {
      "@typescript-eslint": typescript,
      "@next/next": nextPlugin,
      "jsx-a11y": jsxA11y,
      "import": importPlugin,
      "react-hooks": reactHooks
    }
  },
  
  // Global rules for all files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      ...instabidsRules
    }
  },
  
  // Server component specific rules
  {
    files: ["**/app/**/*.{ts,tsx}", "**/src/app/**/*.{ts,tsx}"],
    ignores: ["**/app/**/*client*.{ts,tsx}", "**/src/app/**/*client*.{ts,tsx}"],
    rules: {
      // Rules specific to server components
      "react-hooks/rules-of-hooks": "off", // Server components don't use hooks
    }
  },
  
  // Client component specific rules
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/app/**/*.{ts,tsx}", "**/src/app/**/*.{ts,tsx}"],
    rules: {
      // Ensure client components are properly labeled
      "@next/next/missing-use-client": "error"
    }
  }
];

export default eslintConfig;
