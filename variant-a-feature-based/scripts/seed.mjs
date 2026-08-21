import { seedSyntheticData } from "./synthetic-data.mjs";

const snapshot = await seedSyntheticData();

console.log("Synthetic development seed applied to variant A.");
console.log(JSON.stringify(snapshot, null, 2));
