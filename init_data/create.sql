
CREATE TABLE IF NOT EXISTS user_data (
	username VARCHAR(100) UNIQUE NOT NULL,
	profile_picture VARCHAR(200),
	password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
	job_id SERIAL UNIQUE NOT NULL,
	posted_by VARCHAR(100) NOT NULL,
	job_description VARCHAR(1000) NOT NULL,
	job_image VARCHAR(100),
	job_title VARCHAR(100) NOT NULL,
	job_date VARCHAR(100) NOT NULL,
	pay SMALLINT NOT NULL,
	claimed BOOLEAN NOT NULL,
	completed BOOLEAN NOT NULL,
	claimed_by VARCHAR(100)
);