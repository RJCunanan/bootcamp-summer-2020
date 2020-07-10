const mysql = require('mysql'); // Bring in the MySQL Node.js driver/module

// Create a connection to MySQL using a configuration
// object (JSON)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

connection.connect(function(err) {
    // If there was an issue connecting to MySQL
    // Kill the entire server...
    if(err) throw err;

    console.log('Connected to MySQL...');

    createDatabase();
});

function createDatabase() {
    const sql = 'CREATE DATABASE IF NOT EXISTS restaurant;';

    connection.query(sql, function(err, results, fields) {
        if(err) throw err;

        console.log('Database created (if not exist)...');

        loadDatabase();
    });
}

function loadDatabase() {
    const sql = 'USE restaurant;';

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;

        console.log('Database restaurant loaded...');

        createTableUsers();
    });
}

function createTableUsers() {
    const sql =
    `CREATE TABLE IF NOT EXISTS users
    (
        user_id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
        fname VARCHAR(50) NOT NULL,
        lname VARCHAR(50) NOT NULL,
        email VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(50) NOT NULL,
        UNIQUE (email),
        UNIQUE (username),
        CHECK (fname <> ''),
        CHECK (lname <> ''),
        CHECK (email <> ''),
        CHECK (username <> ''),
        CHECK (password <> '')
    );`;

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;

        console.log('USERS table created (if not exist)...');

        createTablePosts();
    });
}

function createTablePosts() {
    const sql =
    `CREATE TABLE IF NOT EXISTS posts
    (
        post_id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        caption VARCHAR(255),
        image_url VARCHAR(255) NOT NULL,
        likes INT UNSIGNED NOT NULL,
        dislikes INT UNSIGNED NOT NULL,
        location VARCHAR(50),
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        CHECK (user_id <> 0),
        CHECK (image_url <> '')
    );`;

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;

        console.log('POSTS table created (if not exists)...');

        createTableBookmarks();
    });
}

function createTableBookmarks() {
    const sql =
    `CREATE TABLE IF NOT EXISTS bookmarks
    (
        user_id INT UNSIGNED NOT NULL,
        post_id INT UNSIGNED NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(post_id) REFERENCES posts(post_id),
        PRIMARY KEY(user_id, post_id)
    );`;

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;

        console.log('BOOKMARKS table created (if not exists)...');

        createTableLikes();
    });
}

function createTableLikes() {
    const sql = 
    `CREATE TABLE IF NOT EXISTS likes
    (
        post_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        state TINYINT(1) UNSIGNED NOT NULL,
        FOREIGN KEY(post_id) REFERENCES posts(post_id),
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        PRIMARY KEY (post_id, user_id)
    );`;

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;

        console.log(`LIKES table created (if not exists)...`);
    });
}

/**
 * Write the express code required to
 * start building up our API.
 * 
 * Once you have the boilerplate code done,
 * create 1 express GET endpoint and have the
 * route be /users.
 */

 // Import the express module...
 const express = require('express');
 // Create our express application object
 // call it 'app' (not a required name...just what people name it...)
 const app = express();
 // Import Joi for JSON body validation.
 const Joi = require('joi');

 const url = require('url');

 // Configure the port for the Node.js express server
 // to listen on...
 const port = process.env.PORT || 3000;
 const multer = require('multer');
 const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + "." + file.mimetype.split('/')[1]);
    }
});
 const upload = multer({
     storage: storage
 });

 // Ensure JSON will be parsed for the
 // req body. To do this, we will use some
 // middleware that is built into express
 app.use(express.json());

 // Register with express, static files location
 // as to not treat it as a regualar route...
 app.use('/static/images', express.static(__dirname + "/images"));

 // Register a GET request with the
 // /users route handler.
 app.get('/users', (req, res) => {
     res.json(
         {
             message: 'Hello, World!'
         }
     );
 });

 app.post('/users', (req, res) => {
     const schema = {
         fname: Joi.string().required(),
         lname: Joi.string().required(),
         email: Joi.string().required(),
         username: Joi.string().required(),
         password: Joi.string().required()
     };

     const validation = Joi.validate(req.body, schema);

     if(validation.error) {
         const result = {
             message: validation.error.message,
             code: res.statusCode = 400
         };
         
         return res.json(result);
     }

     const sql =
     `INSERT INTO users
     (
         fname,
         lname,
         email,
         username,
         password
     )
     VALUES
     (
         '${req.body.fname}',
         '${req.body.lname}',
         '${req.body.email}',
         '${req.body.username}',
         '${req.body.password}'
     )`;


     connection.query(sql, (err, results, fields) => {
         if(err) {
             return res.json(
                 {
                     message: err.message,
                     code: res.statusCode = 400
                 }
             );
         }

         const sql = `SELECT user_id, fname, lname, email, username FROM users WHERE username='${req.body.username}';`;

         connection.query(sql, (err, results, fields) => {
             if(err) {
                 return res.json(
                     {
                         message: err.message,
                         code: res.statusCode = 500
                     }
                 );
             }

             return res.json({
                 message: 'User added.',
                 code: res.statusCode = 200,
                 user: results[0]
             });
         });
     });
 });

 app.post('/posts', upload.single('image'), (req, res) => {
     const schema = {
         user_id: Joi.number().required(),
         caption: Joi.string().optional()
     };

     const validation = Joi.validate(req.body, schema);

     if(validation.error) {
         return res.json({
             message: validation.error.message,
             code: res.statusCode = 400
         });
     }

     const image_url = req.protocol + "://" + req.headers.host + "/static/images/" + req.file.filename;

     const sql =
     `
     INSERT INTO posts (user_id, caption, image_url) VALUES (${req.body.user_id}, '${req.body.caption}', '${image_url}');
     `;

     connection.query(sql, (err, results, fields) => {
         if(err)
            return res.json({
             message: err.message,
             code: res.statusCode = 400
         });

         res.json({
             message: 'Post Uploaded',
             code: res.statusCode = 200
         });
     });
 });

 app.get('/posts', (req, res) => {
     const parsedUrl = url.parse(req.url, true);

     const schema = {
         post_id: Joi.number().required()
     }

     const validation = Joi.validate(parsedUrl.query, schema);

     if(validation.error) {
         return res.json({
             message: validation.error.message,
             code: res.statusCode = 400
         });
     }

     const post_id = Number.parseInt(parsedUrl.query.post_id);

     const sql =
     `SELECT user_id, caption, image_url, likes, dislikes, location FROM posts WHERE post_id=${post_id}`;

     connection.query(sql, (err, results, fields) => {
         if(err) {
             return res.json({
                 message: err.message,
                 code: res.statusCode = 400
             });
         }

         const post = results[0];

         return res.json({
             message: 'OK',
             code: res.statusCode = 200,
             post: post
         });
     });
 });

 app.post('/bookmarks', (req, res) => {
     const schema = {
         user_id: Joi.number().required(),
         post_id: Joi.number().required()
     };

     const validation = Joi.validate(req.body, schema);

     if(validation.error) {
         return res.json({
             message: validation.error.message,
             code: res.statusCode = 400
         });
     }

     const sql = `INSERT INTO bookmarks (user_id, post_id) VALUES (${req.body.user_id}, ${req.body.post_id})`;

     connection.query(sql, (err, results, fields) => {
         if(err) {
             return res.json({
                 message: err.message,
                 code: res.statusCode = 400
             });
         }

         console.log(results);
         console.log(fields);

         res.json({
             message: `Created bookmark`,
             code: res.statusCode = 200
         });
     });
 });

 app.get('/bookmarks', (req, res) => {
     const schema = {
         user_id: Joi.number().required()
     };

     const parsedUrl = url.parse(req.url, true);

     const validation = Joi.validate(parsedUrl.query, schema);

     if(validation.error) {
         return res.json({
             message: validation.error.message,
             code: res.statusCode = 400
         });
     }

     connection.query(
         `SELECT user_id FROM users WHERE user_id=${parsedUrl.query.user_id}`,
         (err, results, fields) => {
             if(err) {
                 return res.json({
                     message: err.message,
                     code: res.statusCode = 500
                 });
             }

             if(results.length == 0) {
                 return res.json({
                     message: `User with user_id ${parsedUrl.query.user_id} does not exist.`,
                     code: res.statusCode = 400
                 });
             }

             const sql = `SELECT post_id FROM bookmarks WHERE user_id=${parsedUrl.query.user_id}`;

             connection.query(sql, (err, results, fields) => {
                 if(err) {
                     return res.json({
                         message: err.message,
                         code: res.statusCode = 400
                     });
                 }
        
                 console.log(results);
                 console.log(fields);
        
                 res.json({
                     message: 'OK',
                     code: res.statusCode = 200,
                     posts: results.map((row) => {
                         return row.post_id
                     })
                 });
             });
         });
 });

 /**
  * reaction
  * -1 = delete the reaction (neither a dislike nor a like it is nothing....)
  * 0 = dislike,
  * 1 = like,
  * 2 = heart,
  * 3 = vomit
  */

 app.post('/likes', (req, res) => {
     const schema = {
         post_id: Joi.number().required(),
         user_id: Joi.number().required(),
         reaction: Joi.number().required()
     };

     const validation = Joi.validate(req.body, schema);

     if(validation.error) {
         return res.json({
             message: validation.error.message,
             code: res.statusCode = 400
         });
     }

     // Check if the post_id exists...
     connection.query(
         `SELECT post_id FROM posts WHERE post_id=${req.body.post_id}`,
         (err, results, fields) => {
             if(err) {
                 return res.json({
                     message: err.message,
                     code: res.statusCode = 500
                 });
             }

             if(results.length == 0) {
                return res.json({
                    message: `Post ID ${req.body.post_id} does not exist.`,
                    code: res.statusCode = 400
                });
             }

             connection.query(
                 `SELECT user_id FROM users WHERE user_id=${req.body.user_id}`,
                 (err, results, fields) => {
                     if(err) {
                         return res.json({
                             message: err.message,
                             code: res.statusCode = 500
                         });
                     }

                     if(results.length == 0) {
                        return res.json({
                            message: `User ID ${req.body.user_id} does not exist.`,
                            code: res.statusCode = 400
                        });
                     }

                     const sql =
                     `INSERT INTO likes (post_id, user_id, reaction)
                     VALUES
                     (${req.body.post_id}, ${req.body.user_id}, ${req.body.reaction})`;

                     connection.query(sql, (err, results, fields) => {
                         if(err) {
                             return res.json({
                                 message: err.message,
                                 code: res.statusCode = 500
                             });
                         }

                         res.json({
                             message: 'OK',
                             code: res.statusCode = 200
                         });
                     });
                 }
             )
         });
 });

 app.listen(port, () => {
     console.log(`Listening on port ${port}`);
 });