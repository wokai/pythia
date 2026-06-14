/** Creation of database and database-table */

CREATE DATABASE pythia;

CREATE USER 'pythia-user'@'localhost' IDENTIFIED BY 'password-for-pythia-user';
GRANT ALL ON pythia.* TO 'pythiaroot'@'localhost';

USE pythia;

CREATE OR REPLACE TABLE Refs (
  id INT NOT NULL AUTO_INCREMENT,
  txtid VARCHAR(100),
  type VARCHAR(20),
  filename VARCHAR(100) UNIQUE,
  source VARCHAR(100),
  issue VARCHAR(20),
  pages VARCHAR(20),
  year INT,
  title TEXT,
  firstauthor VARCHAR(100),
  lastauthor VARCHAR(100),
  pubdate VARCHAR(20),
  doi VARCHAR(100),
  pmid INT,
  pmcid VARCHAR(20),
  attr JSON,
  jsonCreated DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  PRIMARY KEY (id)
);

CREATE OR REPLACE UNIQUE INDEX refs_txtid_idx ON Refs (txtid);
CREATE OR REPLACE INDEX json_created_idx ON Refs (jsonCreated);

/**
 * Check last inserts:
 * SELECT id, txtid, filename, jsonCreated, createdAt FROM Refs ORDER BY Id DESC limit 10; 
**/
