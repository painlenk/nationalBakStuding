const { response } = require("express");
const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyAccountExistsCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }
  req.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/customer", (req, res) => {
  const { cpf, name } = req.body;

  const customersAreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customersAreadyExists) {
    return res.status(401).json({ error: "Customer already exists" });
  }

  customers.push({
    cpf,
    name,
    id: uuidV4(),
    statement: [],
  });

  return res.status(201).send(customers);
});

app.get("/statement", verifyAccountExistsCPF, (req, res) => {
  const { customer } = req;

  return res.status(200).json(customer.statement);
});

app.get("/statement/date", verifyAccountExistsCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormate = new Date(date + " 00:00");

  const statement = customer.statement.find((statement) => {
    return (
      statement.created_At.toDateString() ===
      new Date(dateFormate).toDateString()
    );
  });

  if (!statement) {
    return res.status(400).json({ error: "not found" });
  }

  return res.status(200).json(statement);
});

app.post("/deposit", verifyAccountExistsCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementoperation = {
    description,
    amount,
    created_At: new Date(),
    type: "credit",
  };

  customer.statement.push(statementoperation);
  return res.status(200).json({ message: "successful" });
});

app.post("/withdraw", verifyAccountExistsCPF, (req, res) => {
  const { amount, description } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient founds!" });
  }

  const statementoperation = {
    description,
    amount,
    created_At: new Date(),
    type: "debit",
  };

  customer.statement.push(statementoperation);
  return res.status(201).json({ message: "successful" });
});

app.put("/account", verifyAccountExistsCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  res.status(200).json(customer.name);
});

app.get("/account", verifyAccountExistsCPF, (req, res) => {
  const { customer } = req;

  return res.status(200).json(customer);
});

app.get("/balance", verifyAccountExistsCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.status(200).json(balance);
});

app.delete("/account", verifyAccountExistsCPF, (req, res) => {
  const { customer } = req;

  const indexCostomer = customers.findIndex(
    (costomerIndex) => costomerIndex.cpf === customer.cpf
  );

  customers.splice(indexCostomer, 1);

  return res.status(200).json(customers);
});
app.listen(3333, () => {
  console.log("server is running on port 3333");
});
