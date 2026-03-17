import crypto from "crypto";

const sessions = {};
const COOKIE_NAME = "session_id";

export function createSession(user, res) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions[sessionId] = { 
    user: user,
    createdAt: Date.now() 
  };
  res.cookie(COOKIE_NAME, sessionId, { httpOnly: true });
}

export function getSession(req) {
  const id = req.cookies[COOKIE_NAME];
  if (!id) return null;
  return sessions[id];
}

export function deleteSession(req, res) {
  const id = req.cookies[COOKIE_NAME];
  delete sessions[id];
  res.clearCookie(COOKIE_NAME);
}

export function sessionHandler(req, res, next) {
  const session = getSession(req);
  req.session = session ? session : {}; 
  res.locals.isLoggedIn = !!req.session.user;
  res.locals.username = req.session.user ? req.session.user.username : null;
  
  next();
}