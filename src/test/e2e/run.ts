/* eslint-disable no-console */
import { BaseTestSet, TestMethod } from "./BaseTestSet";
import * as fs from "fs";
import * as path from "path";

interface TestSet  {
    testConstructor: new() => BaseTestSet;
    tests: TestMethod[];
}

const TEST_SETS: TestSet[] = [];

class TestScanner {
    static async scan(dirPath: string, filter?: RegExp) {
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
            const entryPath = path.resolve(dirPath, entry);
            if (fs.statSync(entryPath).isDirectory()) {
                await TestScanner.scan(entryPath, filter);
            }
            else if (entry.endsWith("test.js") && ((filter) ? filter.test(entry) : true)) {
                try {
                    const module = await import(entryPath);
                    for (const key in module) {
                        const constructor = module[key];
                        const instance = new constructor();
                        if (instance.__exportedMethods && Array.isArray(instance.__exportedMethods)) {
                            const tests = instance.__exportedMethods as TestMethod[];
                            TEST_SETS.push({
                                testConstructor: constructor,
                                tests,
                            });
                        }
                    }
                }
                catch (e) {
                    console.log(`Error during including test ${entryPath}`, e);
                }
            }
        }
    }
}

async function runTests() {
    const testSetFilter = (() => {
        if (process.argv.length > 2 && process.argv[2]) {
            return new RegExp(`${process.argv[2]}`);
        }
        return undefined;
    })();
    const testFilter = (() => {
        if (process.argv.length > 3 && process.argv[3]) {
            return new RegExp(`${process.argv[3]}`);
        }
        return undefined;
    })();
    
    await TestScanner.scan("./out/test/e2e/", testSetFilter);
    
    let totalTime: number = 0;
    let totalFailed: number  = 0;
    for (const testSet of TEST_SETS) {
        console.log("\x1b[33m", "==========================");
        console.log("\x1b[33m", testSet.testConstructor.name, "running");
        console.log("\x1b[33m", "==========================");
        for (const test of testSet.tests) {
            if (testFilter && !testFilter.test(test.method)) {
                continue;
            };
            const testSetInstance = new testSet.testConstructor();
            const testResult = await testSetInstance.run(test);
            totalTime += testResult.time;
            totalFailed += (testResult.testStatus) ? 0 : 1;
        }
    }
    
    console.log("\x1b[33mFINAL RESULTS:");
    console.log(`\x1b[33mTOTAL TIME: ${totalTime}s`);
    console.log(`${(totalFailed == 0) ? "\x1b[32m ALL PASSED, SUCCESS" : `\x1b[31m ${totalFailed} TESTS FAILED`}`);
    
    process.exit(totalFailed ? 1 : 0);
};

runTests().catch(e => {
    console.log(e);
    process.exit(1);
});
