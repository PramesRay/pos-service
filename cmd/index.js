import {initServer, runServer} from "../infrastructure/rest/rest.js";
import {initDB} from "../infrastructure/database/mysql.js";

await initDB()

initServer()
runServer()