import fs from "fs-extra";

await fs.remove("public");
await fs.copy("ui/dist", "public");

console.log("Copied ui/dist → public");