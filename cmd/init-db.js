import { getSequelize } from "../infrastructure/database/mysql.js";

const sequelize = await getSequelize();
await sequelize.sync({ alter: false });

console.log("Database synced successfully");
process.exit();