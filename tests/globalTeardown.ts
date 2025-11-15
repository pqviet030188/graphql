export default async function globalTeardown() {
  // Close the Sequelize connection once after all tests finish.
  // Use require() so TypeScript compile isn't necessary in this teardown file.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sequelize } = require("../src/database");
    if (sequelize && typeof sequelize.close === "function") {
      await sequelize.close();
      // console.log("Sequelize connection closed by globalTeardown");
    }
  } catch (err) {
    // If teardown fails, log but don't rethrow so Jest can still exit
    // eslint-disable-next-line no-console
    console.error("Error in globalTeardown:", err);
  }
}
