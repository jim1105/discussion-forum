dbSchema = `CREATE TABLE IF NOT EXISTS Threads (
    thread_id integer NOT NULL PRIMARY KEY,
    email text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    Posts text
);
CREATE TABLE IF NOT EXISTS Posts (
    post_id integer NOT NULL PRIMARY KEY,
    email text NOT NULL,
    comment text NOT NULL,
    thread_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY,
    email text UNIQUE, 
    password text
);`

module.exports = dbSchema;