import {Sequelize} from "sequelize";
import config from "../../app/config/config.js";

export const sequelize = config.db_url
  ? new Sequelize(config.db_url, { dialect: config.dialect, dialectOptions: { timeout: 10000 }, retry: { max: 5 } })
  : new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      dialectOptions: { timeout: 10000 }, 
      retry: { max: 3 }
    });


export const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.info(`Successfully connected to database ${config.database}`);
    } catch (error) {
        console.error(error);
    }

    await sequelize.sync({ alter: false })
}