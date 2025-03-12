/*  eslint-disable no-console */
import { JsonDocsGenerator } from "../JsonDocsGenerator";
import { SlateDocsGenerator } from "../SlateDocsGenerator";
import { getOutJsonPath } from "../common";
import * as fs from "fs";

async function go() {
    const docsGenerator = new JsonDocsGenerator();
    const slateDocGenerator = new SlateDocsGenerator();
    const docs = docsGenerator.getDocsFromProject();
    await fs.promises.writeFile(getOutJsonPath(), JSON.stringify(docs, null, 2));
    await slateDocGenerator.generateMarkdownFromJson(docs);
}

go().catch(e => console.log("Error", e));