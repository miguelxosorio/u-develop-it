const express = require('express');
const mysql = require('mysql2');
const inputCheck = require('./utils/inputCheck');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      // Your MySQL username,
      user: 'root',
      // Your MySQL password
      password: '',
      database: 'election'
    },
    console.log('Connected to the election database.')
);

// *** the db.query() methods wrapped in Express.js routes *** //

// API endpoint to Get all candidates
app.get('/api/candidates', (req, res) => {
    // Select from candidates is assigned to sql var
    const sql = `SELECT * FROM candidates`;
    // db object is using the query() method
    // This method runs the SQL query and executes the callback with all the resulting rows that match the query
    // once this method executes the SQL command, the callback function captures the responses from the query in two variables
    // the err, which is the error response, and rows, which is the database query response
    db.query(sql, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// API endpoint to Get a single candidate
// The endpoint has a route parameter that will hold the value of the id to specify which candidate we'll select from the database
app.get('/api/candidate/:id', (req, res) => {
    const sql = `SELECT * FROM candidates WHERE id = ?`;
    // In the database call we'll assign the captured value populated in the req.params object with the key id to params
    // The database call will then query the candidates table with this id and retrieve the row specified
    // Because params can be accepted in the database call as an array, params is assigned as an array with a single element, req.params.id.
    const params = [req.params.id];
  
    db.query(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: row
        });
    });
});

// Delete a candidate - http request method delete()
app.delete('/api/candidate/:id', (req, res) => {
    // DELETE statement has a ? that denotes a placeholder, making this a prepared statement
    // A prepared statement can execute the same SQL statements repeatedly using diff values in place of the placeholder
    // One reason to use a placeholder in the SQL query is to block an SQL injection attack, 
    // which replaces the client user variable and inserts alternate commands that could reveal or destroy the database.
    const sql = `DELETE FROM candidates WHERE id = ?`;
    const params = [req.params.id];
  
        db.query(sql, params, (err, result) => {
        if (err) {
            res.statusMessage(400).json({ error: res.message });
        } else if (!result.affectedRows) {
            res.json({
            message: 'Candidate not found'
            });
        } else {
            res.json({
            message: 'deleted', // The JSON object route response will be the message "deleted"
            changes: result.affectedRows, 
            id: req.params.id
            });
        }
    });
});

// Create a candidate - HTTP request method post() to insert a candidate into the candidates table
app.post('/api/candidate', ({ body }, res) => {
    const errors = inputCheck(body, 'first_name', 'last_name', 'industry_connected');
    if (errors) {
      res.status(400).json({ error: errors });
      return;
    }

    const sql = `INSERT INTO candidates (first_name, last_name, industry_connected)
    VALUES (?,?,?)`;
        const params = [body.first_name, body.last_name, body.industry_connected];

        db.query(sql, params, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: body
        });
    });
});

// Default response for any other request (Not Found)
app.use((req, res) => {
    res.status(404).end();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});