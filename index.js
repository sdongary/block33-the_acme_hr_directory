const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')
const app = express()


app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/departments', async (req, res, next) => {  
  try {
    const SQL = `SELECT * FROM departments;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});


app.get('/api/employees', async (req, res, next) => {  
  try {
    const SQL = `SELECT * FROM employees ORDER BY created_at ASC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});


app.post('/api/employees', async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees(name, department_id) 
                VALUES($1, $2) RETURNING *;`;
    const response = await client.query(SQL, 
      [req.body.name, req.body.department_id]);
    res.send(response.rows[0]);
  } catch (err) {
    next(err);
  }
});


app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = `UPDATE employees
                SET name=$1, is_favorite=$2, updated_at=now() 
                WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);
    res.send(response.rows[0]);
  } catch (err) {
    next(err);
  }
});


app.delete('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees 
                WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(500).send({ error: err.message });
});

const init = async () => {
await client.connect();
console.log('connected to database');

console.log('seeding db');
let SQL = `
DROP TABLE IF EXISTS departments;
CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCAHR(255) NOT NULL
  );
  
DROP TABLE IF EXISTS employees;
CREATE TABLE employees(
id SERIAL PRIMARY KEY,
name VARCAHR(255) NOT NULL),
created_at TIMESTAMP DEFAULT now(),
updated_at TIMESTAMP DEFAULT now()
department_id INTEGER REFERENCES department(id) NOT NULL
);

  INSERT INTO departments(name) VALUES('Marketing');
  INSERT INTO departments(name) VALUES('Sales');
  INSERT INTO departments(name) VALUES('HR');
  
  INSERT INTO employees(name, department_id) VALUES('John', (SELECT id FROM departments WHERE name = 'Marketing'));
  INSERT INTO employees(name, department_id) VALUES('Kevin', (SELECT id FROM departments WHERE name = 'Marketing'));
  INSERT INTO employees(name, department_id) VALUES('MAdison', (SELECT id FROM departments WHERE name = 'Marketing'));  
  `;

await client.query(SQL);
console.log('data seeded');

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))

};

init();