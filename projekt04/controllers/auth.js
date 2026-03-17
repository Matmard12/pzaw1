import { createUser, validatePassword } from "../models/user.js";
import { createSession, deleteSession } from "../models/session.js";

function signup_get(req, res) {
  res.render("register", { errors: [] });
}

function signup_post(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.render("register", { errors: ["Wszystkie pola są wymagane"] });

  const user = createUser(username, password);
  if (!user) return res.render("register", { errors: ["Użytkownik już istnieje"] });

  createSession(user, res);
  res.redirect("/");
}

function login_get(req, res) {
  res.render("login", { errors: [] });
}

export async function login_post(req, res) {
  const { username, password } = req.body;

  try {
    const user = await validatePassword(username, password);

    if (!user) {
      return res.render("login", { errors: ["Niepoprawny login lub hasło"] });
    }

    createSession(user, res);
    res.redirect("/");
    
  } catch (err) {
    console.error("Błąd podczas logowania:", err);
    res.status(500).send("Błąd serwera");
  }
}
function logout(req, res) {
  deleteSession(req, res);
  res.redirect("/");
}

export function canEdit(req, res, next) {
  const user = req.session.user;
  
  if (!user) {
    return res.redirect("/auth/login");
  }
  const resourceId = req.params.id;
  const recipe = getRecipeById(resourceId); 

  if (!recipe) {
    return res.status(404).send("Nie znaleziono treści");
  }

  if (user.role === 'admin' || user.id === recipe.author_id) {
    return next();
  }

  return res.status(403).send("Nie masz uprawnień do edycji tej treści!");
}
const auth = { signup_get, signup_post, login_get, login_post, logout };
export default auth;