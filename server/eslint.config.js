import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	{
		parserOptions: {
			project: "./tsconfig.json"
		},
		ignores: ["dist"],
		rules: {
			'@typescript-eslint/array-type': 'error',
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn", // or "error"
				{
					"argsIgnorePattern": "^_",
					"varsIgnorePattern": "^_", // Also useful for unused local variables
					"caughtErrorsIgnorePattern": "^_" // For unused error variables in catch blocks
				}
			]
		},
	},
);