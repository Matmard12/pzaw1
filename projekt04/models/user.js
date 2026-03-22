import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcrypt";

const db = new DatabaseSync("./db.sqlite");

db.exec(`
  CREATE TABLE IF NOT EXISTS fc_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  ) STRICT;
`);

export function createUser(username, password, role = 'user') {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  try {
    const stmt = db.prepare(`
      INSERT INTO fc_users (username, password, role) 
      VALUES (?, ?, ?) 
      RETURNING id, username, role;
    `);
    return stmt.get(username, hashedPassword, role);
  } catch (err) {
    return null;
  }
}

const userCheck = db.prepare("SELECT COUNT(*) as count FROM fc_users").get();

if (userCheck.count === 0) {
  console.log("tworzenie startowych uzytkownikow");

  createUser("admin", "changeme", "admin");
  
  createUser("user1", "changeme", "user");
  
  console.log("Konta startowe (admin, user1, user2) zostały utworzone.");
}

export async function validatePassword(username, password) {
  const stmt = db.prepare("SELECT id, username, password, role FROM fc_users WHERE username = ?");
  const user = stmt.get(username);

  if (!user) return null;
  
  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch) {
    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }
  return null;
}

export default {
  createUser,
  validatePassword
};