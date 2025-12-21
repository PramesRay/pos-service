import 'dotenv/config';

const local = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
};
const development = {
  username: process.env.DEV_DB_USER,
  password: process.env.DEV_DB_PASS,
  database: process.env.DEV_DB_NAME,
  host: process.env.DEV_DB_HOST,
  port: process.env.DEV_DB_PORT,
  db_url: process.env.DEV_DB_URL,
  dialect: 'mysql',
};
const production = {
  db_url: process.env.PROD_DB_URL,
  dialect: 'mysql',
};

const config = {local, development, production};
const env = process.env.NODE_ENV || 'local';
export default config[env];