import { Sequelize } from "sequelize";
import config from "../../app/config/config.js";

let sequelize;

export const getSequelize = async () => {
  if (!sequelize) {
    sequelize = config.db_url
      ? new Sequelize(config.db_url, {
          dialect: config.dialect,
          dialectOptions: { timeout: 10000 },
          retry: { max: 5 }
        })
      : new Sequelize(config.database, config.username, config.password, {
          host: config.host,
          port: config.port,
          dialect: config.dialect,
          dialectOptions: { timeout: 10000 },
          retry: { max: 3 }
        });

    try {
      await sequelize.authenticate();
      console.info("Database connected");
    } catch (err) {
      console.error("DB connection failed:", err);
      throw err;
    }
  }

  return sequelize;
};
