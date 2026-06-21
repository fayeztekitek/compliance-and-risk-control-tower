import { writeFileSync } from "fs";
import { resolve } from "path";
import { swaggerSpec } from "../src/config/swagger.js";

const outputPath = resolve(import.meta.dirname, "../../frontend/src/api/generated/schema.json");
writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log(`Swagger schema written to ${outputPath}`);
