import express from "express";
import morgan from "morgan";
import recipes from "./models/recipe.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


app.get("/", (req, res) => {
  res.redirect("/recipes");
});

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}
app.use(log_request);

app.get("/recipes", (req, res) => {
  res.render("categories", {
    title: "Kategorie przepisów",
    categories: recipes.getCategorySummaries(),
  });
});

app.get("/recipes/:category_id", (req, res) => {
  const category = recipes.getCategory(req.params.category_id);
  if (category != null) {
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.get("/recipes/:category_id/new", (req, res) => {
  res.render("new_recipe", {
    errors: [],
    title: "Nowy przepis",
    category: { id: req.params.category_id },
    title_value: "",
    ingredients: "",
    instructions: "",
  });
});

app.post("/recipes/:category_id/new", (req, res) => {
  const category_id = req.params.category_id;

  if (!recipes.hasCategory(category_id)) {
    res.sendStatus(404);
  } else {
    let recipe_data = {
      title: req.body.title,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
    };

    var errors = recipes.validateRecipeData(recipe_data);

    if (errors.length == 0) {
      recipes.addRecipe(category_id, recipe_data);
      res.redirect(`/recipes/${category_id}`);
    } else {
      res.status(400);
      res.render("new_recipe", {
        errors,
        title: "Nowy przepis",
        category: { id: category_id },
        title_value: req.body.title,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions,
      });
    }
  }
});
app.post("/recipes/:category_id/:recipe_id/delete", (req, res) => {
  const { category_id, recipe_id } = req.params;

  if (!recipes.hasCategory(category_id)) {
    res.sendStatus(404);
  } else {
    recipes.deleteRecipe(recipe_id);
    res.redirect(`/recipes/${category_id}`);
  }
});


app.get("/recipes/:category_id/:recipe_id/edit", (req, res) => {
  const { category_id, recipe_id } = req.params;
  if (!recipes.hasCategory(category_id)) return res.sendStatus(404);

  const recipe = recipes.getRecipe(Number(recipe_id));
  if (!recipe) return res.sendStatus(404);

  res.render("recipe_edit", {
    title: "Edytuj przepis",
    recipe,
    category_id,
    errors: [],
  });
});

app.post("/recipes/:category_id/:recipe_id/edit", (req, res) => {
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
      title: "edytuj przepis",
      recipe: { id: recipe_id, ...updated },
      category_id,
      errors,
    });
  }

  recipes.updateRecipe(Number(recipe_id), updated);
  res.redirect(`/recipes/${category_id}`);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
