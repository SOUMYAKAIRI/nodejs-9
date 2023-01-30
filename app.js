const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
let db = null;
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

const initializeDBandServer = async () => {
  try {
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (e) {
    console.log(DBerror ${e.Message});
    process.exit(1);
  }
};

initializeDBandServer();

// registering user details:

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const Check_User_Qry = select * from user where username="${username}";;
  const Check_User = await db.get(Check_User_Qry);
  console.log(Check_User);
  const len_of_password = password.length;
  const hashedpassword = await bcrypt.hash(password, 15);
  if (Check_User === undefined) {
    // user not registered yet:
    if (len_of_password < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const Register_Qry = `insert into user 
            (username,name,password,gender,location
            ) values("${username}","${name}",
            "${hashedpassword}","${gender}","${location}");`;
      await db.run(Register_Qry);
      response.send("User created successfully");
    }
  } else {
    // user registered
    response.status(400);
    response.send("User already exists");
  }
});

// login api:

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  //   console.log(username, password);
  const Check_User_Qry = select * from user where username="${username}";;

  const Check_User = await db.get(Check_User_Qry);
  //   console.log(Check_User);

  if (Check_User === undefined) {
    // not registered trying to login:
    response.status(400);
    response.send("Invalid user");
  } else {
    // registered credentials needed to prove:
    // password matches
    const oldpassword = Check_User.password;
    const is_pw_match = await bcrypt.compare(password, oldpassword);
    if (is_pw_match === true) {
      //   response.send(200);
      response.send("Login success!");
    }
    // password mismatch
    else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// api for password_change:
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  console.log(username, oldPassword, newPassword);
  const username_is_valid_Qry = `select * from user 
    where username="${username}";`;
  const user_name_details = await db.get(username_is_valid_Qry);
  const old_password_db = user_name_details.password;
  const is_pw_matches = await bcrypt.compare(oldPassword, old_password_db);
  const len_new_pw = newPassword.length;
  if (is_pw_matches === true) {
    if (len_new_pw < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashed_new_pw = await bcrypt.hash(newPassword, 15);
      const update_pw_qry = `update user set password="${hashed_new_pw}"
            where username="${username}";`;
      await db.run(update_pw_qry);
      response.send("Password updated");
    }
  } else {
    // password mismatch
    response.status(400);
    response.send("Invalid current password");
  }
});
