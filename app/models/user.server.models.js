const db = require('../../config/db');
const crypto = require('crypto');

    const fs = require('fs');
const photosDirectory = './storage/';
const photo_tools = require('../lib/photo.tools.js');



/**
 * get the user id associated with a given token, return null if not found
 */
const getIdFromToken = function(token, done){
    if (token === undefined || token === null)
        return done(true, null);
    else {
        db.get(
            'SELECT user_id FROM spacebook_users WHERE user_token=?',
            [token],
            function(err, row){
                if (row)
                    return done(null, row.user_id);
                return done(err, null);
            }
        )
    }
};

const check_user_exists = function(id, done){
  if (id === undefined || id === null)
      return done(true, null);
  else {
      db.get(
          'SELECT * FROM spacebook_users WHERE user_id=?',
          [id],
          function(err, row){
              if (row != null)
                  return done(null, row.user_id);
              return done(err, null);
          }
      )
  }
};



const getHash = function(password, salt){
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};



/**
 * insert user
 */
const insert = function(user, done){

    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    //console.log(salt);

    let values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')];

    db.run(
        'INSERT INTO spacebook_users (user_givenname, user_familyname, user_email, user_password, user_salt) VALUES (?,?,?,?,?)',
        values,
        function(err){
            if (err) {
              console.log(err);
              return done(err);
            }

            return done(err, this.lastID)
        }
    );
};



/*
 *   authenticate user
 */
const authenticate = function(email, password, done){
    db.get(
        'SELECT user_id, user_password, user_salt FROM spacebook_users WHERE (user_email=?)',
        [email],
        function(err, row) {

            if (err || !row){
                console.log("AUTH 1", err, row);
                return done(true); // return error = true (failed auth)
            }else{

                if(row.user_salt == null){
                    row.user_salt = '';
                }

                let salt = Buffer.from(row.user_salt, 'hex');

                if (row.user_password === getHash(password, salt)){
                    return done(false, row.user_id);
                }else{
                    console.log("failed passwd check");
                    return done(true); // failed password check
                }

            }
        }
    );
};



/**
 * get existing token
 *
 */
const getToken = function(id, done){
    db.get(
        'SELECT user_token FROM spacebook_users WHERE user_id=?',
        [id],
        function(err, row){
          if (row && row.user_token){
            return done(null, row.user_token);
          }else{
            return done(null, null);
          } 
        }
    );
};



/**
 * create and store a new token for a user
 */
const setToken = function(id, done){
    let token = crypto.randomBytes(16).toString('hex');
    db.run(
        'UPDATE spacebook_users SET user_token=? WHERE user_id=?',
        [token, id],
        function(err){return done(err, token)}
    );
};



/**
 * remove a token for a user
 */
const removeToken = (token, done) => {
    db.run(
        'UPDATE spacebook_users SET user_token=null WHERE user_token=?',
        [token],
        function(err){return done(err)}
    )
};


const getNumFriends = (id, done) => {
  let friend_query = 'SELECT COUNT(friend_user_id) AS "count" FROM spacebook_friends WHERE friend_user_id=' + id + ' OR friend_friend_id=' + id + ' AND status="CONFIRMED"';

  db.get(friend_query, function(err, row){
    if(err) {
      console.log(friend_query, err);
      return done(err, false);
    }
    let numFriends = row.count;
    return done(null, numFriends);
  });
}


/**
 * return user details, or null if user not found
 *
 * @param id
 * @param done
 */
const getOne = async (id, done) => {
  let query = 'SELECT spacebook_users.user_id, spacebook_users.user_givenname, spacebook_users.user_familyname, spacebook_users.user_email FROM spacebook_users WHERE spacebook_users.user_id=?';
  db.get(
      query,
      [id],
      function(err, row){
          if (err){
              console.log(err);
              return done(err, false);
          }else if(row.length == 0){
              console.log(row.length == 0);
              return done(false, null);
          }else{
            let user = row;

            let to_return = {
                "user_id": user.user_id,
                "first_name": user.user_givenname,
                "last_name": user.user_familyname,
                "email": user.user_email
            };

            getNumFriends(user.user_id, function(err, numFriends){
              if (err){ 
                console.log(err);
                return done(err, false)
              }
              to_return["friend_count"] = numFriends;
              return done(null, to_return);
            });
          }
      }
  )
};



/**
 * return user details, or null if user not found
 *
 * @param id
 * @param done
 */
const getJustUser = (id, done) => {
    // console.log("1");
    let query = 'SELECT spacebook_users.user_id, spacebook_users.user_givenname, spacebook_users.user_familyname, spacebook_users.user_email FROM spacebook_users WHERE user_id=?';
    db.get(
        query,
        [id],
        function(err, row){
            if (err){
                // console.log(err);
                return done(err, false);
            }else if(row === ""){
                return done(false, null);
            }else{
                let user = row;
                let to_return = {
                  "user_id": user.user_id,
                  "first_name": user.user_givenname,
                  "last_name": user.user_familyname,
                  "email": user.user_email
                };
                return done(null, to_return);
            }
    });
};



/**
 * update user
 *
 */
const alter = function(id, user, done){

    let query_string = '';
    let values = [];

    if(user.hasOwnProperty('password')){
        const salt = crypto.randomBytes(64);
        const hash = getHash(user.password, salt);

        query_string = 'UPDATE spacebook_users SET user_givenname=?, user_familyname=?, user_email=?, user_password=?, user_salt=? WHERE user_id=?';
        values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex'), id];
    }else{
        query_string = 'UPDATE spacebook_users SET user_givenname=?, user_familyname=?, user_email=? WHERE user_id=?';
        values = [user.first_name, user.last_name, user.email, id];
    }

    db.run(query_string,
        values,
        function(err, results){
            done(err);
        }
    );
};

const retreivePhoto = async function(id, done){
  let filename_png = photosDirectory + id + ".png";
  let filename_jpg = photosDirectory + id + ".jpeg";

  fs.exists(filename_png, (exists) => {
    console.log("PNG exists: ", exists, filename_png);
    if(!exists){
      fs.exists(filename_jpg, (exists) => {
        console.log("JPEG exists: ", exists, filename_jpg);
        
        if(!exists){
          filename_jpg = photosDirectory + "default.jpeg";
        }

        console.log("JPG Exists, time to read...");

        fs.readFile(filename_jpg, (err, image) => {
          if(err){
            console.log(err);
            done(null, err);
          }else{
            let mimeType = photo_tools.getImageMimetype(filename_jpg);
            done({image, mimeType}, null);
          }
        });
      });
    }else{
      console.log("PNG Exists, time to read...");

      fs.readFile(filename_png, (err, image) => {
        if(err){
          done(null, err);
        }else{
          let mimeType = photo_tools.getImageMimetype(filename_png);
          done({image, mimeType}, null);
        }
      });

    }
  });
}

const addPhoto = async function(image, fileExt, id, done){
  let filename = id + fileExt;

  try{
    const path = photosDirectory + filename;

    fs.writeFile(path, image.body, function(err, result){
      if(err){
        return done(err);
      }else{
        console.log("RESULT", result);
        return done(null);
      }
    });
  }catch (err){
    console.log(err);
    fs.unlink(photosDirectory + filename).catch(err => done(err));
    done(err);
  }
}

const deletePhotoIfExists = async function(id, done){
  let filename_png = photosDirectory + id + ".png";
  let filename_jpg = photosDirectory + id + ".jpeg";

  fs.exists(filename_png, (exists) => {
    console.log("PNG exists: ", exists, filename_png);
    if(!exists){
      fs.exists(filename_jpg, (exists) => {
        console.log("JPEG exists: ", exists, filename_jpg);
        if(!exists){
          done(null);
        }else{
          console.log("JPG Exists, time to delete...");
          fs.unlink(filename_jpg, (err) => {
            if(err){
              done(err);
            }else{
              done(null);
            }
          });
        }
      });
    }else{
      console.log("PNG Exists, time to delete...");
      fs.unlink(filename_png, (err) => {
        if(err){
          done(err);
        }else{
          done(null);
        }
      });
    }
  });
}



module.exports = {
    getIdFromToken: getIdFromToken,
    insert: insert,
    authenticate: authenticate,
    getToken: getToken,
    setToken: setToken,
    removeToken: removeToken,
    getOne: getOne,
    getJustUser: getJustUser,
    alter: alter,
    retreivePhoto: retreivePhoto,
    addPhoto: addPhoto,
    deletePhotoIfExists: deletePhotoIfExists,
    check_user_exists: check_user_exists
};
