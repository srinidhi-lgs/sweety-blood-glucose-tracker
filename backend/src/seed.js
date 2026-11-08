
const pool = require("./config/db");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const email = "demo@sweety.com";
    const password = "SweetyDemo@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password
       RETURNING id`,
      ["Sweety Demo User", email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO readings
        (user_id, reading_date, time_slot, glucose_level)
       SELECT $1, sample_date, time_slot, glucose_level
       FROM (
         VALUES
           (CURRENT_DATE, 'Morning fasting', 95),
           (CURRENT_DATE, 'After breakfast', 145),
           (CURRENT_DATE, 'After lunch', 132),
           (CURRENT_DATE, 'After dinner', 118),

           (CURRENT_DATE - 1, 'Morning fasting', 102),
           (CURRENT_DATE - 1, 'After breakfast', 138),

           ((DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date,
             'Morning fasting', 110),
           ((DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date,
             'After lunch', 150)
       ) AS samples(sample_date, time_slot, glucose_level)
       ON CONFLICT (user_id, reading_date, time_slot)
       DO NOTHING`,
      [userId]
    );

    await client.query("COMMIT");

    console.log("Demo data created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
