const sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.') 

        db.run(`CREATE TABLE spacebook_users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_givenname text NOT NULL,
                    user_familyname text NOT NULL,
                    user_email text NOT NULL UNIQUE,
                    user_password text NOT NULL,
                    user_salt text NOT NULL,
                    user_token text DEFAULT NULL UNIQUE,
                    CONSTRAINT email_unique UNIQUE (user_email),
                    CONSTRAINT token_unique UNIQUE (user_token)
                )`,
            (err) => {

                if(err){
                    console.log(err)
                    console.log("spacebook_users table already created")
                }else{
                    console.log("spacebook_users table created")
                }

                db.run(`CREATE TABLE spacebook_posts (
                            post_id INTEGER PRIMARY KEY AUTOINCREMENT,
                            post_text text NOT NULL,
                            post_author integer NOT NULL,
                            post_profile integer NOT NULL,
                            post_timestamp integer DEFAULT -1,
                            FOREIGN KEY(post_author) REFERENCES spacebook_users(user_id)
                            FOREIGN KEY(post_profile) REFERENCES spacebook_users(user_id)
                        )`,
                    (err) => {
                        if(err){
                            console.log(err)
                            console.log("spacebook_posts table already created")
                        }else{
                            console.log("spacebook_posts table created")
                        }

                        db.run(`CREATE TABLE spacebook_friends (
                                    friend_user_id INTEGER,
                                    friend_friend_id INTEGER,
                                    status text NOT NULL,
                                    PRIMARY KEY(friend_user_id, friend_friend_id)
                                    FOREIGN KEY(friend_user_id) REFERENCES spacebook_users(user_id)
                                    FOREIGN KEY(friend_friend_id) REFERENCES spacebook_users(user_id)
                                )`,
                            (err) => {
                                if(err){
                                    console.log(err)
                                    console.log("spacebook_friends table already created")
                                }else{
                                    console.log("spacebook_friends table created")
                                }

                                db.run(`CREATE TABLE spacebook_likes (
                                            like_post_id INTEGER,
                                            like_user_id INTEGER,
                                            PRIMARY KEY(like_post_id, like_user_id)
                                            FOREIGN KEY(like_post_id) REFERENCES spacebook_posts(post_id)
                                            FOREIGN KEY(like_user_id) REFERENCES spacebook_users(user_id)
                                        )`,
                                    (err) => {
                                        if(err){
                                            console.log(err)
                                            console.log("spacebook_likes table already created")
                                        }else{
                                            console.log("spacebook_likes table created")
                                        }
                                    }
                                )
                            }
                        )
                    }
                )
            }
        )
    }
});


module.exports = db