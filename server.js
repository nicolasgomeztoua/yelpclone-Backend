const express = require("express");

const app = express();
const morgan = require("morgan");
const db = require("./db");
const port = process.env.PORT;
const cors = require("cors");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/v1/restaurants", async (req, res, next) => {
  try {
    const restaurantRatingData = await db.query(
      "SELECT * FROM restaurants LEFT JOIN ( SELECT restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating FROM reviews GROUP BY restaurant_id) reviews ON restaurants.id = reviews.restaurant_id;"
    );
    res.status(200).json({
      results: restaurantRatingData.rows.length,
      data: {
        restaurants: restaurantRatingData.rows,
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.get("/api/v1/restaurants/:id", async (req, res, next) => {
  try {
    const restaurants = await db.query(
      "SELECT * FROM restaurants LEFT JOIN ( SELECT restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating FROM reviews GROUP BY restaurant_id) reviews ON restaurants.id = reviews.restaurant_id WHERE id = $1; ",
      [req.params.id]
    );
    const reviews = await db.query(
      "SELECT * FROM reviews WHERE restaurant_id = $1",
      [req.params.id]
    );
    res.status(200).json({
      data: { result: restaurants.rows[0], reviews: reviews.rows },
    });
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/v1/restaurants", async (req, res, next) => {
  const { name, location, price_range } = req.body;
  try {
    const restaurants = await db.query(
      "INSERT INTO restaurants (name, location, price_range) values($1, $2, $3) RETURNING *",
      [name, location, price_range]
    );

    res.status(201).json({
      data: {
        sucess: true,
        result: restaurants.rows[0],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.put("/api/v1/restaurants/:id", async (req, res, next) => {
  const { name, location, price_range } = req.body;
  try {
    const restaurants = await db.query(
      "UPDATE restaurants SET name =$1, location = $2, price_range = $3 WHERE id=$4 RETURNING *",
      [name, location, price_range, req.params.id]
    );
    res.status(200).json({
      data: {
        sucess: true,
        result: restaurants.rows[0],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.delete("/api/v1/restaurants/:id", async (req, res, next) => {
  try {
    const reviews = await db.query(
      "DELETE FROM reviews WHERE restaurant_id = $1 RETURNING *;",
      [req.params.id]
    );
    const restaurants = await db.query(
      " DELETE FROM restaurants WHERE id = $1 RETURNING *;",
      [req.params.id]
    );

    res.status(204).json({
      data: {
        sucess: true,
        result: restaurants.rows[0],
        reviews: reviews.rows[0],
      },
    });
  } catch (error) {
    res.json(error);
  }
});

app.post("/api/v1/restaurants/:id/addReview", async (req, res, next) => {
  const { name, review, rating } = req.body;
  try {
    const newReview = await db.query(
      "INSERT INTO reviews (restaurant_id, name, review, rating) values($1,$2,$3,$4) RETURNING *",
      [req.params.id, name, review, rating]
    );
    res.status(200).json({
      data: {
        sucess: true,
        review: newReview.rows[0],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
