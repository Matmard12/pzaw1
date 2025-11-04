import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
  CREATE TABLE IF NOT EXISTS recipe_categories (
    category_id INTEGER PRIMARY KEY,
    id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES recipe_categories(category_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL
  ) STRICT;
`);

const db_ops = {
  insert_category: db.prepare(`
    INSERT INTO recipe_categories (id, name)
    VALUES (?, ?)
    RETURNING category_id, id, name;
  `),

  insert_recipe_by_id: db.prepare(`
    INSERT INTO recipes (category_id, title, ingredients, instructions)
    VALUES (
      (SELECT category_id FROM recipe_categories WHERE id = ?),
      ?, ?, ?
    )
    RETURNING id, title, ingredients, instructions;
  `),

  get_categories: db.prepare(`SELECT id, name FROM recipe_categories;`),

  get_category_by_id: db.prepare(`
    SELECT category_id, id, name FROM recipe_categories WHERE id = ?;
  `),

  get_recipes_by_category_id: db.prepare(`
    SELECT id, title, ingredients, instructions FROM recipes WHERE category_id = ?;
  `),
};


if (db_ops.get_categories.all().length === 0) {
  const breakfast = db_ops.insert_category.get("sniadanie", "Śniadanie");
  const dinner = db_ops.insert_category.get("obiad", "Obiad");
  const dessert = db_ops.insert_category.get("deser", "Desery");

  db_ops.insert_recipe_by_id.get(
    "sniadanie",
    "Jajecznica z boczkiem",
    "3 jajka, 2 plastry boczku, sól, pieprz, szczypiorek",
    "Podsmaż boczek, dodaj jajka, dopraw i smaż do uzyskania pożądanej konsystencji."
  );

  db_ops.insert_recipe_by_id.get(
    "obiad",
    "Spaghetti Bolognese",
    "Makaron spaghetti, mięso mielone, cebula, czosnek, sos pomidorowy, przyprawy",
    "Ugotuj makaron, podsmaż mięso z cebulą i czosnkiem, dodaj sos i duś 20 minut."
  );

  db_ops.insert_recipe_by_id.get(
    "deser",
    "Szarlotka",
    "Jabłka, mąka, masło, cukier, cynamon",
    "Przygotuj ciasto kruche, dodaj jabłka z cynamonem, piecz 45 minut w 180°C."
  );
}

export function addCategory(categoryId, name) {
  return db_ops.insert_category.get(categoryId, name);
}

export function getCategorySummaries() {
  return db_ops.get_categories.all();
}

export function hasCategory(categoryId) {
  const category = db_ops.get_category_by_id.get(categoryId);
  return category != null;
}

export function getCategory(categoryId) {
  const category = db_ops.get_category_by_id.get(categoryId);
  if (category) {
    category.recipes = db_ops.get_recipes_by_category_id.all(category.category_id);
    return category;
  }
  return null;
}

export function addRecipe(categoryId, recipe) {
  return db_ops.insert_recipe_by_id.get(
    categoryId,
    recipe.title,
    recipe.ingredients,
    recipe.instructions
  );
}
export function deleteRecipe(recipeId) {
  const stmt = db.prepare(`DELETE FROM recipes WHERE id = ?;`);
  return stmt.run(recipeId);
}
export function validateRecipeData(recipe) {
  const errors = [];
  const fields = ["title", "ingredients", "instructions"];
  for (const field of fields) {
    if (!recipe[field] || typeof recipe[field] !== "string" || recipe[field].trim().length === 0) {
      errors.push(`Pole "${field}" jest wymagane.`);
    }
  }
  return errors;
}

export default {
  addCategory,
  getCategorySummaries,
  hasCategory,
  getCategory,
  addRecipe,
  validateRecipeData,
  deleteRecipe,
};
