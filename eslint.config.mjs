import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['node_modules/**', 'dist/**', 'web/js/**', '.handoff-baseline/**', 'artifacts/**', 'playwright-report/**', 'test-results/**'] },
  { files: ['src/**/*.ts'], extends: [js.configs.recommended, ...ts.configs.recommended] },
);
