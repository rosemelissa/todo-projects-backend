import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
dotenv.config();

// use the environment variable PORT, or 4000 as a fallback
const PORT_NUMBER = process.env.PORT ?? 4000;

if (!process.env.DATABASE_URL) {
  throw "No DATABASE_URL env var!  Have you made a .env file?  And set up dotenv?";
}

app.get("/projects", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projects = await client.query("SELECT * FROM projects");
    res.status(200).json(projects.rows);
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.get("/project/:id/todos", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = parseInt(req.params.id);
    const todos = await client.query("SELECT * FROM todos WHERE projectid=$1", [
      projectId,
    ]);
    res.status(200).json(todos.rows);
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.post("/project", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectName = req.body;
    await client.query("INSERT INTO projects(name) VALUES($1)", [
      projectName.name,
    ]);
    res.status(201).json(projectName);
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.delete("/project/:id", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = parseInt(req.params.id);
    const exists = await client.query("SELECT * FROM projects WHERE id=$1", [
      projectId,
    ]);
    if (exists.rowCount === 1) {
      await client.query("DELETE FROM todos WHERE projectId=$1", [projectId]);
      await client.query("DELETE from projects WHERE id=$1", [projectId]);
      res.status(200).json(projectId);
    } else {
      res.status(404).json({ message: "Not found" });
    }
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.patch("/project/:id", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = req.params.id;
    const updatedProjectName = req.body.name;
    const exists = await client.query("SELECT * FROM projects WHERE id=$1", [
      projectId,
    ]);
    if (exists.rowCount === 1) {
      await client.query("UPDATE projects SET name=$1 WHERE id=$2", [
        updatedProjectName,
        projectId,
      ]);
      res.status(200).json({ id: projectId, name: updatedProjectName });
    } else {
      res.status(404).json({ message: "Not found" });
    }
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.post("/project/:id/todos", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = req.params.id;
    const title = req.body.title;
    const description = req.body.description;
    const createdDate = new Date().toISOString();
    const updatedDate = new Date().toISOString();
    const dueDate = req.body.duedate;
    await client.query(
      "INSERT INTO todos(projectId, title, description, createdDate, updatedDate, dueDate) VALUES ($1, $2, $3, $4, $5, $6)",
      [projectId, title, description, createdDate, updatedDate, dueDate]
    );
    res.status(201).json(req.body);
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.delete("/project/:projectId/todo/:todoId", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = parseInt(req.params.projectId);
    const todoId = parseInt(req.params.todoId);
    const exists = await client.query(
      "SELECT * FROM todos WHERE projectId=$1 AND id=$2",
      [projectId, todoId]
    );
    if (exists.rowCount === 1) {
      await client.query("DELETE FROM todos WHERE projectId=$1 AND id=$2", [
        projectId,
        todoId,
      ]);
      res.status(200).json({ message: "Deleted todo" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.patch("/project/:projectId/todo/:todoId", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = parseInt(req.params.projectId);
    const todoId = parseInt(req.params.todoId);
    const title: string = req.body.title;
    const description: string = req.body.description;
    const dueDate: string = req.body.duedate;
    const updatedDate = new Date().toISOString();
    const exists = await client.query(
      "SELECT * FROM todos WHERE projectId=$1 AND id=$2",
      [projectId, todoId]
    );
    if (exists.rowCount === 1) {
      await client.query(
        "UPDATE todos SET title=$1, description=$2, dueDate=$3, updatedDate=$4 WHERE projectId=$5 AND id=$6",
        [title, description, dueDate, updatedDate, projectId, todoId]
      );
      res.status(200).json({ message: "Updated todo" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
    client.end();
  } catch (error) {
    console.error(error);
  }
});

app.patch("/project/:projectId/todo/:todoId/completion", async (req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await client.connect();
    const projectId = parseInt(req.params.projectId);
    const todoId = parseInt(req.params.todoId);
    const complete: boolean = req.body.complete;
    const exists = await client.query(
      "SELECT * FROM todos WHERE projectId=$1 AND id=$2",
      [projectId, todoId]
    );
    if (exists.rowCount === 1) {
      await client.query(
        "UPDATE todos SET complete=$1 WHERE projectId=$2 AND id=$3",
        [complete, projectId, todoId]
      );
      res.status(200).json({ message: "Updated todo completion status" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
    client.end();
  } catch (error) {
    console.error(error);
  }
});

/*
// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// GET /items
app.get("/items", (req, res) => {
  const allSignatures = getAllDbItems();
  res.status(200).json(allSignatures);
});

// POST /items
app.post<{}, {}, DbItem>("/items", (req, res) => {
  // to be rigorous, ought to handle non-conforming request bodies
  // ... but omitting this as a simplification
  const postData = req.body;
  const createdSignature = addDbItem(postData);
  res.status(201).json(createdSignature);
});

// GET /items/:id
app.get<{ id: string }>("/items/:id", (req, res) => {
  const matchingSignature = getDbItemById(parseInt(req.params.id));
  if (matchingSignature === "not found") {
    res.status(404).json(matchingSignature);
  } else {
    res.status(200).json(matchingSignature);
  }
});

// DELETE /items/:id
app.delete<{ id: string }>("/items/:id", (req, res) => {
  const matchingSignature = getDbItemById(parseInt(req.params.id));
  if (matchingSignature === "not found") {
    res.status(404).json(matchingSignature);
  } else {
    res.status(200).json(matchingSignature);
  }
});

// PATCH /items/:id
app.patch<{ id: string }, {}, Partial<DbItem>>("/items/:id", (req, res) => {
  const matchingSignature = updateDbItemById(parseInt(req.params.id), req.body);
  if (matchingSignature === "not found") {
    res.status(404).json(matchingSignature);
  } else {
    res.status(200).json(matchingSignature);
  }
});

*/

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
