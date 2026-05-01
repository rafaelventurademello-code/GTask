import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Helper to read/write DB
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const writeDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const db = readDB();
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      console.log(`Login successful for: ${email}`);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      console.log(`Login failed for: ${email}. Check if email/password matches db.json`);
      res.status(401).json({ error: "E-mail ou senha inválidos" });
    }
  });

  // Users
  app.get("/api/users", (req, res) => {
    const db = readDB();
    res.json(db.users);
  });

  app.post("/api/users", (req, res) => {
    const db = readDB();
    const newUser = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now() 
    };
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
  });

  app.put("/api/users/:id", (req, res) => {
    const db = readDB();
    const index = db.users.findIndex((u: any) => u.id === req.params.id);
    if (index !== -1) {
      console.log(`Updating user ${req.params.id}:`, req.body);
      db.users[index] = { ...db.users[index], ...req.body };
      writeDB(db);
      res.json(db.users[index]);
    } else {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const db = readDB();
    db.users = db.users.filter((u: any) => u.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Checklists
  app.get("/api/checklists", (req, res) => {
    const db = readDB();
    res.json(db.checklists);
  });

  app.post("/api/checklists", (req, res) => {
    const db = readDB();
    const newChecklist = { 
      ...req.body, 
      id: "c" + Math.random().toString(36).substr(2, 5),
      createdAt: Date.now() 
    };
    db.checklists.push(newChecklist);
    writeDB(db);
    res.json(newChecklist);
  });

  app.put("/api/checklists/:id", (req, res) => {
    const db = readDB();
    const index = db.checklists.findIndex((c: any) => c.id === req.params.id);
    if (index !== -1) {
      db.checklists[index] = { ...db.checklists[index], ...req.body };
      writeDB(db);
      res.json(db.checklists[index]);
    } else {
      res.status(404).json({ error: "Checklist não encontrado" });
    }
  });

  app.delete("/api/checklists/:id", (req, res) => {
    const db = readDB();
    db.checklists = db.checklists.filter((c: any) => c.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Assignments
  app.get("/api/assignments", (req, res) => {
    const db = readDB();
    res.json(db.assignments);
  });

  app.post("/api/assignments", (req, res) => {
    const db = readDB();
    const newAssignment = { 
      ...req.body, 
      id: "a" + Math.random().toString(36).substr(2, 5),
      scheduledAt: Date.now() 
    };
    db.assignments.push(newAssignment);
    writeDB(db);
    res.json(newAssignment);
  });

  app.put("/api/assignments/:id", (req, res) => {
    const db = readDB();
    const index = db.assignments.findIndex((a: any) => a.id === req.params.id);
    if (index !== -1) {
      db.assignments[index] = { ...db.assignments[index], ...req.body };
      writeDB(db);
      res.json(db.assignments[index]);
    } else {
      res.status(404).json({ error: "Tarefa não encontrada" });
    }
  });

  app.delete("/api/assignments/:id", (req, res) => {
    const db = readDB();
    db.assignments = db.assignments.filter((a: any) => a.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
