/**
 * Type declarations for WASM libraries and global objects
 */

// Pyodide types (loaded from CDN)
interface PyodideInterface {
  runPythonAsync(code: string): Promise<any>;
  runPython(code: string): any;
  loadPackage(packages: string | string[]): Promise<void>;
  globals: any;
}

interface LoadPyodideOptions {
  indexURL?: string;
  fullStdLib?: boolean;
  stdin?: () => string;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

// TypeScript types (loaded from CDN)
interface TypeScriptTranspileOutput {
  outputText: string;
  diagnostics?: any[];
  sourceMapText?: string;
}

interface TypeScriptCompilerOptions {
  module?: number;
  target?: number;
  strict?: boolean;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
  forceConsistentCasingInFileNames?: boolean;
}

interface TypeScriptModule {
  transpileModule(input: string, options: { compilerOptions: TypeScriptCompilerOptions }): TypeScriptTranspileOutput;
  ModuleKind: { CommonJS: number; ESNext: number; ES2020: number };
  ScriptTarget: { ES5: number; ES2015: number; ES2020: number; Latest: number };
}

// 扩展 Window 接口
declare global {
  interface Window {
    loadPyodide?: (options?: LoadPyodideOptions) => Promise<PyodideInterface>;
    ts?: TypeScriptModule;
  }
}

export {};

