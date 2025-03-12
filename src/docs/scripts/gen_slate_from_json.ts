/*  eslint-disable no-console */
import { SlateDocsGenerator } from "../SlateDocsGenerator";
import * as types from "../docsGeneratorTypes";
import * as fs from "fs";
import { getOutJsonPath } from "../common";

async function go() {
    const slate = new SlateDocsGenerator();
    const docsJson = await fs.promises.readFile(getOutJsonPath());
    const docs = JSON.parse(docsJson.toString()) as types.JsonDocs;
    await slate.generateMarkdownFromJson(docs);
    console.log("Documentation rendered");
}

go().catch(e => console.log("Error", e));