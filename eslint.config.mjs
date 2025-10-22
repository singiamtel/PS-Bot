import typescriptEslint from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ["**/*.js", "**/*.cjs"],
    },
    // Base ESLint recommended rules
    js.configs.recommended,
    // TypeScript-specific configuration
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            '@typescript-eslint': typescriptEslint,
            '@stylistic': stylistic,
        },
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // TypeScript recommended rules (manually added since we removed FlatCompat)
            ...typescriptEslint.configs.recommended.rules,
            
            // Your custom stylistic rules
            '@stylistic/quotes': ['error', 'single', {
                allowTemplateLiterals: "always",
            }],

            'space-in-parens': ['error', 'never'],
            'no-duplicate-imports': 'error',
            'function-paren-newline': ['error', 'consistent'],
            'no-octal-escape': 'error',
            'no-useless-call': 'error',

            'comma-spacing': ['error', {
                before: false,
                after: true,
            }],

            'no-trailing-spaces': ['error', {
                ignoreComments: false,
            }],

            'sort-vars': 'off',
            'array-bracket-spacing': ['error', 'never'],
            quotes: 'off',
            'object-curly-spacing': ['error', 'always'],
            'dot-location': ['error', 'property'],
            'wrap-iife': ['error', 'inside'],
            'arrow-body-style': 'error',
            'comma-style': ['error', 'last'],
            'space-before-blocks': ['error', 'always'],

            'brace-style': ['error', '1tbs', {
                allowSingleLine: true,
            }],

            'no-unneeded-ternary': 'error',
            'padding-line-between-statements': 'off',
            indent: 'off',
            '@stylistic/indent': ['error'],
            'no-new-object': 'error',
            'no-extra-parens': 'off',
            'operator-assignment': 'off',
            'space-infix-ops': 'error',
            'wrap-regex': 'off',
            'lines-around-comment': 'off',
            'no-return-assign': ['error', 'except-parens'],

            'comma-dangle': ['error', {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'ignore',
            }],

            'key-spacing': 'error',
            'dot-notation': 'off',

            yoda: ['error', 'never', {
                exceptRange: true,
            }],

            'arrow-spacing': ['error', {
                before: true,
                after: true,
            }],

            'no-useless-rename': 'error',
            'arrow-parens': 'off',
            'no-div-regex': 'error',
            'block-spacing': ['error', 'always'],
            'no-mixed-requires': 'error',
            'computed-property-spacing': ['error', 'never'],

            'keyword-spacing': ['error', {
                before: true,
                after: true,
            }],

            'no-floating-decimal': 'error',
            'no-multi-spaces': 'error',
            'no-useless-computed-key': 'error',
            'object-shorthand': ['error', 'methods'],
            'rest-spread-spacing': ['error', 'never'],
            'new-parens': 'error',
            'eol-last': ['error', 'always'],
            'one-var': 'off',
            'quote-props': 'off',

            'space-before-function-paren': ['error', {
                anonymous: 'always',
                named: 'never',
            }],

            'operator-linebreak': ['error', 'after'],
            curly: ['error', 'multi-line', 'consistent'],

            'space-unary-ops': ['error', {
                words: true,
                nonwords: false,
            }],

            'vars-on-top': 'off',
            'no-array-constructor': 'error',
            'no-undef-init': 'off',
            'padded-blocks': ['error', 'never'],
            semi: ['error', 'always'],
            'func-call-spacing': 'error',
            'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
            'prefer-arrow-callback': 'off',
            'no-useless-concat': 'off',

            'semi-spacing': ['error', {
                before: false,
                after: true,
            }],

            'no-multiple-empty-lines': ['error', {
                max: 2,
                maxEOF: 1,
            }],

            'template-curly-spacing': ['error', 'never'],
            '@typescript-eslint/no-explicit-any': 'off',

            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    }];
