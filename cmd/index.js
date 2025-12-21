import {initServer} from "../infrastructure/rest/rest.js";
import {getSequelize} from "../infrastructure/database/mysql.js";

await getSequelize();

const app = initServer()

app.listen(3000, () => console.log("Server running on port 3000"));