
import { Config } from "./config";
import { dbSetup } from "./utils";
import { createApp } from "./createApp";

async function start() {

  if (Config.env === "development") {
    await dbSetup()
  }

  const app = await createApp();
  const port = 4000;
  app.listen(port, () =>
    console.log(`Server ready at http://localhost:${port}/graphql`)
  );
}

start().catch(console.error);
