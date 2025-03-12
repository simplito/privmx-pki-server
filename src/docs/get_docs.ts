/* eslint-disable */
import { getOutJsonPath } from "./common";
import { JsonDocs } from "./docsGeneratorTypes";

const docs = require(getOutJsonPath()) as JsonDocs;

export {docs};