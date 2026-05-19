'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2026, Wolfgang Kaisers
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/

/// ////////////////////////////////////////////////////////////////////////////
/// 
/// ////////////////////////////////////////////////////////////////////////////

const colors          = require('colors');
const path            = require('path');
const fsp             = require('fs').promises;
const config          = require(path.join(__dirname, '..', 'config', 'config'));
const win             = require(path.join('.', '..', 'logger', 'logger'));

const { Sequelize, DataTypes, Model } = require('sequelize');
const MariaDbDialect  = require('@sequelize/mariadb');

const sequelize = new Sequelize({
  dialect: MariaDbDialect,
  database: confit.database.dataBaseName,
  user: config.database.dbUserName,
  password: config.database.dbUserPassword,
  host: 'localhost',
  port: 3306,
  showWarnings: true,
  connectTimeout: 1000,
});


class Refs extends Model {}

Refs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    txtid:    { DataTypes.STRING },
    filename: { DataTypes.STRING },
    type: { DataTypes.STRING },
    doi: { DataTypes.STRING },
    pmid: { DataTypes.INTEGER },
    pmcid: { DataTypes.STRING },
    source: { DataTypes.STRING },
    issue: { DataTypes.STRING },
    pages: { DataTypes.STRING },
    year: { DataTypes.INTEGER },
    title: { DataTypes.STRING },
    firstauthor: { DataTypes.STRING },
    lastauthor: { DataTypes.STRING },
    pubdate: { DataTypes.STRING },
    attr: { DataTypes.JSON }
  },{ sequelize,
      modelName: 'Refs'
  }
);


/**
 * 
 * table name references ist not allowed
CREATE OR REPLACE TABLE Refs (
  id INT NOT NULL AUTO_INCREMENT,
  refid VARCHAR(100),
  type VARCHAR(20),
  filename VARCHAR(100),
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
  PRIMARY KEY (id)
);
 *
 */

/*
const mariadb = require('mariadb');
const pool = mariadb.createPool({
     host: config.database.url, 
     user: config.database.dbUserName, 
     password: config.database.dbUserPassword,
     connectionLimit: 5
});


pool.getConnection()
    .then(conn => {
    
      conn.query("SELECT 1 as val")
        .then((rows) => {
          console.log(rows); //[ {val: 1}, meta: ... ]
          //Table must have been created before 
          // " CREATE TABLE myTable (id int, val varchar(255)) "
          return conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
        })
        .then((res) => {
          console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
          conn.end();
          pool.end();
        })
        .catch(err => {
          //handle error
          console.log(err); 
          conn.end();
          pool.end();
        })
        
    }).catch(err => {
      //not connected
      pool.end();
    });
*/
