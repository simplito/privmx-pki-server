/*  eslint-disable no-console */
import { JsonDocsGenerator } from "../JsonDocsGenerator";
import { getOutJsonPath } from "../common";
import * as fs from "fs";

async function go() {
    const generator = new JsonDocsGenerator();
    const docs = generator.getDocsFromProject();
    await fs.promises.writeFile(getOutJsonPath(), JSON.stringify(docs, null, 2));
    console.log("docs.json generated");
}

go().catch(e => console.log("Error", e));