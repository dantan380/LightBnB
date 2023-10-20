const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) => {
  const queryString = `SELECT * FROM users WHERE email = $1;`;
  const values = [email];

  return pool.query(queryString, values)
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.error(err.message);
  })
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  const queryString = `SELECT * FROM users WHERE id = $1`;
  const values = [id];

  return pool.query(queryString, values)
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.error(err.message);
  })
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`;
  const values = [user.name, user.email, user.password]

  return pool.query(queryString, values)
  .then((result) => {
    console.log(result.rows[0]);
    return result.rows[0];
  })
  .catch((err) => {
    console.error(err.message);
  })
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, 
  reservations.end_date, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces, avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;`;

  const values = [guest_id, limit];

  return pool.query(queryString, values)
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.error(err.message);
  })
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const values = []
  const whereClauses = []

  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON property_id = properties.id
  `

  if(options.minimum_price_per_night) {
    values.push(`${options.minimum_price_per_night}`)
    whereClauses.push(` cost_per_night >= $${values.length} `);
  }

  if(options.maximum_price_per_night) {
    values.push(`${options.maximum_price_per_night}`)
    whereClauses.push( ` cost_per_night <= $${values.length} `);
  }

  if(options.city) {
    values.push(`%${options.city}%`);
    whereClauses.push(`city ILIKE $${values.length}`);
  }

  if(options.owner_id) {
    values.push(`${options.owner_id}`);
    whereClauses.push(` owner_id = ${values.length} `);
  }

  if(whereClauses.length > 0) {
    queryString += ` WHERE ` + whereClauses.join(' AND ')
  }
  
  queryString += `
  GROUP BY properties.id
  `

  if(options.minimum_rating) {
    values.push(`${options.minimum_rating}`)
    queryString += `HAVING avg(property_reviews.rating) >= $${values.length} `
  }

  values.push(limit);
  queryString +=
  `ORDER BY cost_per_night
  LIMIT $${values.length};
  `;
  
  console.log(queryString, values);

  return pool.query(queryString, values)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.error(err.message);
  });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryString = `
  INSERT INTO properties (
    title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url,
    cover_photo_url, street, country, city, province, post_code, owner_id
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) 
      RETURNING *
      `;
  const values = Object.values(property);

  return pool.query(queryString, values)
  .then((result) => {
    console.log(result.rows[0]);
    return result.rows[0];
  })
  .catch((err) => {
    console.error(err.message);
  })
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
