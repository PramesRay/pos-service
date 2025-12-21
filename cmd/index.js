import {initServer} from "../infrastructure/rest/rest.js";
import {getSequelize} from "../infrastructure/database/mysql.js";

const sequelize = await getSequelize();
await sequelize.sync({ alter: false });

const app = initServer()

app.listen(3000, () => console.log("Server running on port 3000"));