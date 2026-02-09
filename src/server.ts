import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3002;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello server is running successfully");
});

app.listen(PORT, () => {
  // This log helps confirm in the terminal that server started
  console.log(`Hello server is running successfully on port ${PORT}`);
});

