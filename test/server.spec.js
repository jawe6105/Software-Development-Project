
// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;
const bcrypt = require('bcryptjs'); //  To hash passwords
const hash = bcrypt.hash('testguypassword', 10);

const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server


const dbConfig = {
    host: 'db', // Docker container name for the DB service
    port: 5432, 
    database: process.env.POSTGRES_DB, 
    user: process.env.POSTGRES_USER, 
    password: process.env.POSTGRES_PASSWORD,
    secret: process.env.SESSION_SECRET,
};

const db = pgp(dbConfig);

describe('Profile Route Tests', () => {
  let agent;
  const testUser = {
    username: 'testuser',
    password: 'testpass123',
  };

  before(async () => {
    // Clear users table and create test user
    console.log(hash);
    await db.query('TRUNCATE TABLE user_data CASCADE;');
  });

  after(async () => {
    // Clean up database
    await db.query('TRUNCATE TABLE user_data CASCADE;');
  });

  describe('Testing Add User API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: "testguy", password: "testguypassword"})
      .end((err, res) => {
         res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); //! REPLACE WITH DEPLOYED URL FOR /LOGIN
        done();
      });
  });
});


describe('Testing Render', () => {
  it('test "/login" route should render with an html response', done => {
    chai
      .request(server)
      .get('/login')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});



describe('User Routes', () => {
  // Test user registration
  describe('POST /register', () => {
    it('should register a user successfully', done => {
      chai
        .request(server)
        .post('/register')
        .send({username: 'testUser', password: 'testPassword123',})
        .end((err, res) => {
          res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); //! REPLACE WITH DEPLOYED URL FOR /LOGIN
          done();
        });
    });

    it('should return failure when username is already taken', done => {
      chai
        .request(server)
        .post('/register')
        .send({username: 'testUser', password: 'anotherPassword123',})  // already exists from the first test
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test user login
  describe('POST /login', () => {
    it('should login successfully with correct credentials', done => {
      chai
        .request(server)
        .post('/login')
        .send({username: 'testguy', password: 'testguypassword',})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should return an error for invalid credentials', done => {
      chai
        .request(server)
        .post('/login')
        .send({username: 'testUser2', password: 'wrongPassword123',})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});

});


describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});
