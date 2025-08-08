import "dotenv/config";
import Debug from "debug";
import helmet from "helmet";
import express from "express";
import morgan from "morgan";
import { getTodos, createTodos, deleteTodo, updateTodo } from "./db.js";

const DB_LATENCY = 500; // ms
const APP_PORT = 3001;

const debug = Debug("app");
const app = express();
app.set("view engine", "pug");
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev", { immediate: false }));

// Simulate latency
app.use(function (req, res, next) {
  setTimeout(next, DB_LATENCY);
});

app.get("/", async (req, res) => {
  // console.log(req.query);
  const message = req.query?.message ?? "";
  const todos = await getTodos();
  res.render("pages/index", {
    todos,
    message,
    mode: "ADD",
    curTodo: { id: "", todoText: "" },
  });
});

app.post("/create", async (req, res) => {
  const todoText = req.body?.todoText ?? "";
  try {
    await createTodos(todoText);
    res.redirect("/");
  } catch (err) {
    res.redirect(`/?message=${err}`);
  }
});

app.post("/delete", async (req, res) => {
  // console.log(req.body);
  const id = req.body?.curId ?? "";
  try {
    await deleteTodo(id);
    res.redirect("/");
  } catch (err) {
    res.redirect(`/?message=${err}`);
  }
});

app.post("/edit", async (req, res) => {
  // console.log(req.body);
  const id = req.body?.curId ?? "";
  try {
    const todos = await getTodos();
    const curTodo = todos.find((el) => el.id === id);
    if (!id || !curTodo) {
      throw new Error("Invalid ID");
    }
    res.render("pages/index", {
      message: "",
      mode: "EDIT",
      todos,
      curTodo,
    });
  } catch (err) {
    res.redirect(`/?message=${err}`);
  }
});

app.post("/update", async (req, res) => {
  // console.log(req.body);
  try {
    const id = req.body?.curId ?? "";
    const todoTextUpdated = req.body?.todoText ?? "";
    await updateTodo(id, todoTextUpdated);
    res.redirect("/");
  } catch (err) {
    res.redirect(`/?message=${err}`);
  }
});

// Running app
const PORT = process.env.PORT || APP_PORT;
app.listen(PORT, async () => {
  debug(`Listening on port ${PORT}`);
  debug(`http://localhost:${PORT}`);
});
