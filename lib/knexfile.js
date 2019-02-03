module.exports = {
  //Make these variables configurable through hindex file or commandline.
  development: {
    client: "postgres",
    connection: {
      host: "localhost",
      user: "postgres",
      password: "my-secret-pw",
      database: "hindex",
      timezone: "UTC"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/migrations"
    }
  },
  production: {
    client: "postgres",
    connection: {
      host: "localhost",
      user: "postgres",
      password: "my-secret-pw",
      database: "hindex",
      timezone: "UTC"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
};
