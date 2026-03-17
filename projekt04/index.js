console.log("PEPPER =", process.env.PEPPER);
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import recipes from "./models/recipe.js";
import auth from "./controllers/auth.js";
import * as session from "./models/session.js";

const app = express();
const port = 8000;


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(session.sessionHandler);


app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session?.user;
  res.locals.username = req.session?.user?.username || null;
  next();
});

app.use((req, res, next) => {
  console.log(`Request ${req.method} ${req.path}`);
  next();
});

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }
    next();
}

const authRouter = express.Router();
authRouter.get("/signup", auth.signup_get);
authRouter.post("/signup", auth.signup_post);
authRouter.get("/login", auth.login_get);
authRouter.post("/login", auth.login_post);
authRouter.get("/logout", auth.logout);
app.use("/auth", authRouter);




app.get("/recipes", (req, res) => {
  res.render("categories", {
    title: "Kategorie przepisów",
    categories: recipes.getCategorySummaries(),
  });
});


app.get("/recipes/:category_id", (req, res) => {
  const category = recipes.getCategory(req.params.category_id);
  if (!category) return res.sendStatus(404);

  res.render("category", { title: category.name, category });
});


app.get("/recipes/:category_id/new", requireLogin, (req, res) => {
  res.render("new_recipe", {
    errors: [],
    title: "Nowy przepis",
    category: { id: req.params.category_id },
    title_value: "",
    ingredients: "",
    instructions: "",
  });
});

app.post("/recipes/:category_id/new", requireLogin, (req, res) => {
  const category_id = req.params.category_id;
  if (!recipes.hasCategory(category_id)) return res.sendStatus(404);

  const recipe_data = {
    title: req.body.title,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions,
  };

  const errors = recipes.validateRecipeData(recipe_data);

  if (errors.length === 0) {
    recipes.addRecipe(category_id, recipe_data);
    res.redirect(`/recipes/${category_id}`);
  } else {
    res.status(400).render("new_recipe", {
      errors,
      title: "Nowy przepis",
      category: { id: category_id },
      title_value: req.body.title,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
    });
  }
});


app.get("/recipes/:category_id/:recipe_id/edit", requireLogin, (req, res) => {
  const { category_id, recipe_id } = req.params;
  if (!recipes.hasCategory(category_id)) return res.sendStatus(404);

  const recipe = recipes.getRecipe(Number(recipe_id));
  if (!recipe) return res.sendStatus(404);

  res.render("recipe_edit", { title: "Edytuj przepis", recipe, category_id, errors: [] });
});

app.post("/recipes/:category_id/:recipe_id/edit", requireLogin, (req, res) => {
  const { category_id, recipe_id } = req.params;
  if (!recipes.hasCategory(category_id)) return res.sendStatus(404);

  const updated = {
    title: req.body.title,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions,
  };

  const errors = recipes.validateRecipeData(updated);
  if (errors.length > 0) {
    return res.status(400).render("recipe_edit", {
      title: "Edytuj przepis",
      recipe: { id: recipe_id, ...updated },
      category_id,
      errors,
    });
  }

  recipes.updateRecipe(Number(recipe_id), updated);
  res.redirect(`/recipes/${category_id}`);
});

app.post("/recipes/:category_id/:recipe_id/delete", requireLogin, (req, res) => {
  const { category_id, recipe_id } = req.params;
  if (!recipes.hasCategory(category_id)) return res.sendStatus(404);

  recipes.deleteRecipe(Number(recipe_id));
  res.redirect(`/recipes/${category_id}`);
});


app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));