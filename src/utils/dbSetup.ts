import { sequelize } from "../database";
import bcrypt from "bcryptjs";
import { Client } from "../models";

export const dbSetup = async () => {
  await sequelize.sync({ alter: true });

  const existing = await Client.findOne({ where: { clientId: "demo_client" } });
  if (!existing) {
    const hashed = await bcrypt.hash("demo_secret", 10);
    await Client.create({
      name: "Demo App",
      clientId: "demo_client",
      clientSecret: hashed,
    });
  }
};