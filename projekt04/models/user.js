import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcrypt";

const PEPPER = process.env.PEPPER;
if (!PEPPER) {
  console.error(
    "PEPPER environment variable missing. Please create an env file or provide PEPPER via environment variables."
  );
  process.exit(1);
}

const SALT_ROUNDS = 10;
const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);


db.exec(`
  CREATE TABLE IF NOT EXISTS fc_users (
    id          INTEGER PRIMARY KEY,
    username    TEXT UNIQUE,
    passhash    TEXT,
    created_at  INTEGER
  ) STRICT;
`);

const db_ops = {
  create_user: db.prepare(
    "INSERT INTO fc_users (username, passhash, created_at) VALUES (?, ?, ?) RETURNING id;"
  ),
  get_user: db.prepare(
    "SELECT id, username, created_at FROM fc_users WHERE id = ?;"
  ),
  find_by_username: db.prepare(
    "SELECT id, username, created_at FROM fc_users WHERE username = ?;"
  ),
  get_auth_data: db.prepare(
    "SELECT id, passhash FROM fc_users WHERE username = ?;"
  ),
};

export async function createUser(username, password) {
  const existing_user = db_ops.find_by_username.get(username);
  if (existing_user) return null;

  const createdAt = Date.now();
  const passhash = await bcrypt.hash(password + PEPPER, SALT_ROUNDS);

  return db_ops.create_user.get(username, passhash, createdAt);
}

export async function validatePassword(username, password) {
  const authData = db_ops.get_auth_data.get(username);

  if (!authData) {
    console.log(`Logowanie nieudane: Użytkownik ${username} nie istnieje.`);
    return null; 
  }

  const isPasswordCorrect = await bcrypt.compare(password + PEPPER, authData.passhash);

  if (isPasswordCorrect) {
    return db_ops.get_user.get(authData.id);
  }
  console.log(`Logowanie nieudane: Błędne hasło dla ${username}.`);
  return null;
}


export function getUser(user_id) {
  return db_ops.get_user.get(user_id);
}

export default {
  createUser,
  validatePassword,
  getUser,
};