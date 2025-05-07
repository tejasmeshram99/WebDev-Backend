import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "postgres",
  port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let countryCodes = [];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  countryCodes = result.rows;

  let length = countryCodes.length;
  let countries = [];
  for (var i = 0; i < length; i++) {
    countries.push(countryCodes[i]["country_code"]);
  }
  return countries;
}

app.get("/", async (req, res) => {

  //Write your code here.

  const countries = await checkVisisted();

  res.render("index.ejs", { countries: countries, total: countries.length });

});

app.post("/add", async (req, res) => {

  const countryToAdd = req.body.country;

  var countryCode = ""

  // Get the Code for the country received from the form

  var success = true;

  const response = await db.query("SELECT country_code FROM public.countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [countryToAdd.toLowerCase()]);

  console.log(response.rows);

  if (response.rows.length === 1) {

    countryCode = response.rows[0]["country_code"];

  }

  else {

    const countries = await checkVisisted();

    var error = "Country name does not exist, try again."

    success = false;

    res.render("index.ejs", { countries: countries, total: countries.length, error: error });

  }

  // Add the code to the visited countries table

  if (countryCode) {

    try {

      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [`${countryCode}`]);

    }

    catch (err) {

      console.log(err);

      const countries = await checkVisisted();

      var error = "Country already exists in the DB."

      success = false;

      res.render("index.ejs", { countries: countries, total: countries.length, error: error });

    }

  }

  if (success) {

    res.redirect('/');

  }

});

app.listen(port, () => {

  console.log(`Server running on http://localhost:${port}`);

});