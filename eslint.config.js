import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(
	{ ignores: ['*.d.ts', '**/coverage', '**/dist', '**/node_modules', '**/.client_dist'] },
	// Configuration for Vue/browser code (client)
	{
		extends: [
			eslint.configs.recommended,
			...typescriptEslint.configs.recommended,
			...eslintPluginVue.configs['flat/recommended'],
		],
		files: ['client/**/*.{ts,vue}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.browser,
			parserOptions: {
				parser: typescriptEslint.parser,
			},
		},
		plugins: {
			prettier: eslintPluginPrettier,
		},
		rules: {
			// Prettier rules
			'prettier/prettier': 'warn',
			// Your custom rules
			'@typescript-eslint/no-unused-vars': 'warn',
			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
			'vue/require-prop-types': 'warn',
		},
	},
	// Configuration for Node.js/server code
	{
		extends: [
			eslint.configs.recommended,
			...typescriptEslint.configs.recommended,
		],
		files: ['server/**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.node,
		},
		plugins: {
			prettier: eslintPluginPrettier,
		},
		rules: {
			// Prettier rules
			'prettier/prettier': 'warn',
			// Your custom rules
			'@typescript-eslint/no-unused-vars': 'warn',
		},
	},
	eslintConfigPrettier
);
