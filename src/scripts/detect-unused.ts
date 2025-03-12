/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/unbound-method */
import path from "path";
import ts from "typescript";
import fs from "fs";

// You can mark symbol (and symbol's children) as skipable by decorating it with comment:
//
//  /* @ignore-next-line-reference */
//  function unusedFunction() {
//      return "This function is unused.";
//  }
//

interface SymbolWithoutReferences {
    symbol: string;
    fileName: string;
    line: number;
    character: number;
    lineContent: string;
};

type NamedDeclaration = ts.ClassDeclaration|ts.MethodDeclaration|ts.FunctionDeclaration|ts.InterfaceDeclaration|ts.VariableDeclaration

const PATH_EXCEPTIONS = [
    "src/db/migrations",
    "src/utils",
];

export class UnusedCodeDetector {
    
    private readonly baseDir: string;
    private readonly program: ts.Program;
    private readonly languageService: ts.LanguageService;
    private readonly files: { [fileName: string]: { version: number } };
    
    constructor() {
        this.baseDir = path.resolve(__dirname, "../../");
        const configPath = ts.findConfigFile(this.baseDir, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) {
            throw new Error(`Could not find tsconfig.json in ${this.baseDir}`);
        }
        
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        const parsedCommandLine = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
        
        const files: { [fileName: string]: { version: number } } = {};
        for (const fileName of parsedCommandLine.fileNames) {
            files[fileName] = { version: 0 };
        }
        this.files = files;
        
        const servicesHost: ts.LanguageServiceHost = {
            getScriptFileNames: () => parsedCommandLine.fileNames,
            getScriptVersion: fileName =>
                files[fileName] && files[fileName].version.toString(),
            getScriptSnapshot: fileName => {
                if (!fs.existsSync(fileName)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
            },
            getCurrentDirectory: () => process.cwd(),
            getCompilationSettings: () => configFile.config,
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile,
            readDirectory: ts.sys.readDirectory,
            directoryExists: ts.sys.directoryExists,
            getDirectories: ts.sys.getDirectories,
        };
        
        this.languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        const program = this.languageService.getProgram();
        if (!program) {
            throw new Error("Program not found");
        }
        this.program = program;
    }
    
    findUnusedCode(): SymbolWithoutReferences[] {
        const methodsWithoutReferences: SymbolWithoutReferences[] = [];
        Object.keys(this.files).forEach((fileName) => {
            const projectFile = this.program.getSourceFile(fileName);
            if (projectFile && !projectFile.isDeclarationFile && !PATH_EXCEPTIONS.find(e => fileName.includes(e))) {
                this.processNodeRecursively(projectFile, methodsWithoutReferences);
            }
        });
        return methodsWithoutReferences;
    }
    
    private processNodeRecursively(node: ts.Node, methodsWithoutReferences: SymbolWithoutReferences[]) {
        const sourceFile = node.getSourceFile();
        if (this.shouldSkipNode(node, sourceFile)) {
            return;
        }
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isVariableDeclaration(node)) {
            const ref = this.findSymbolReferences(node, sourceFile);
            if (ref === 1) {
                methodsWithoutReferences.push(this.createUnsuedSymbolEntry(node, sourceFile));
            }
        }
        ts.forEachChild(node, (childNode) =>
            this.processNodeRecursively(childNode, methodsWithoutReferences),
        );
    }
    
    private findSymbolReferences(symbolNode: NamedDeclaration, sourceFile: ts.SourceFile) {
        const refs = this.languageService.findReferences(sourceFile.fileName, symbolNode.getStart()) || [];
        let refsCount = 0;
        for (const ref of refs) {
            if (ref.definition.fileName.endsWith(".d.ts")) {
                continue;
            }
            refsCount += ref.references.length;
        }
        return refsCount;
    }
    
    private createUnsuedSymbolEntry(symbolNode: NamedDeclaration, sourceFile: ts.SourceFile) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(symbolNode.getStart());
        const lines = sourceFile.getFullText().split(/\r?\n/);
        const codeLine = lines[line]?.trim() ?? "<unable to retrieve line>";
        const res: SymbolWithoutReferences = {
            symbol: (symbolNode.name) ? symbolNode.name.getText(sourceFile) : "<unable to retrieve name>",
            fileName: sourceFile.fileName,
            line: line + 1,
            character: character + 1,
            lineContent: codeLine,
        };
        return res;
    }
    
    private shouldSkipNode(node: ts.Node, sourceFile: ts.SourceFile): boolean {
        const comments = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.getFullStart());
        if (!comments) {
            return false;
        }
        return comments.some(commentRange => {
            const commentText = sourceFile.getFullText().slice(commentRange.pos, commentRange.end);
            return commentText.includes("@ignore-next-line-reference");
        });
    }
}

function go() {
    const unusedCodeDetector = new UnusedCodeDetector();
    const unusedSymbols = unusedCodeDetector.findUnusedCode();
    for (const symbol of unusedSymbols) {
        console.error(`${symbol.fileName}(${symbol.line},${symbol.character}): error TS6133: '${symbol.symbol}' is declared but its value is never read.`);
        console.log(`\n\t\t${symbol.line} | ${symbol.lineContent}\n`);
    }
    console.log(`Unused symbols found: ${unusedSymbols.length}`);
    process.exit(unusedSymbols.length ? 1 : 0);
}

go();
