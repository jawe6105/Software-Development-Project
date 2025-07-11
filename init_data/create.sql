CREATE TABLE IF NOT EXISTS login_table (
	login_id INT PRIMARY KEY NOT NULL,
	username VARCHAR(100) PRIMARY KEY NOT NULL,
	password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_data (
	login_id INT NOT NULL,
	username VARCHAR(100) NOT NULL,
	profile_picture VARCHAR(200),
	FOREIGN KEY (login_id) REFERENCES login_table(login_id),
	FOREIGN KEY (username) REFERENCES login_table(username),
);

CREATE TABLE IF NOT EXISTS jobs (
	job_id INT NOT NULL,
	posted_by VARCHAR(100) NOT NULL,
	job_description VARCHAR (1000) NOT NULL,
	pay SMALLINT NOT NULL,
	claimed BOOLEAN NOT NULL,
	claimed_by VARCHAR(100)
);