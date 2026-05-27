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

const sequelize = new Sequelize(
  config.database.dataBaseName,
  config.database.dbUserName,
  config.database.dbUserPassword, 
  {
    host: config.database.host,
    dialect: 'mariadb',
    /// 'Change to false to disable logging
    logging: false // console.log
  }
)

sequelize.authenticate().then(() => {
  win.def.log({ level: 'info', file: 'model/database', func: 'toplevel', message: `Sequelize authenticate to ${config.database.host}.${config.database.dataBaseName} success`});
}).catch (error => {
  win.def.log({ level: 'error', file: 'model/database', func: 'toplevel', message: `Sequelize authenticate to ${config.database.host}.${config.database.dataBaseName} failed`});
});

class Refs extends Model {}

Refs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    txtid:        { type: DataTypes.STRING(100) },
    filename:     { type: DataTypes.STRING },
    type:         { type: DataTypes.STRING },
    doi:          { type: DataTypes.STRING },
    pmid:         { type: DataTypes.INTEGER },
    pmcid:        { type: DataTypes.STRING },
    source:       { type: DataTypes.STRING },
    issue:        { type: DataTypes.STRING },
    pages:        { type: DataTypes.STRING },
    year:         { type: DataTypes.INTEGER },
    title:        { type: DataTypes.STRING },
    firstauthor:  { type: DataTypes.STRING },
    lastauthor:   { type: DataTypes.STRING },
    pubdate:      { type: DataTypes.STRING },
    attr:         { type: DataTypes.JSON }
  },{ sequelize,
      modelName: 'Refs'
  }
);


/**
 * 
 * table name 'references' ist not allowed
 * 
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
  createdAt DATETIME,
  updatedAt DATETIME,
  PRIMARY KEY (id)
);

CREATE OR REPLACE UNIQUE INDEX refs_txtid_idx ON Refs (txtid);


 * 
 * 
 * SELECT id, txtid, filename, createdAt FROM Refs;
 */

class Database {
  
  static async createRef(ref){
    //console.log(`[model/database] createRef`.brightYellow);
    
    return new Promise((resolve, reject) => {
      const res = Refs.create({
        txtid: ref.txtid,
        type: ref.type,
        filename: ref.filename,
        type: ref.type,
        doi: ref.doi,
        pmid: ref.pmid,
        pmcid: ref.pmcid,
        source: ref.source,
        issue: ref.issue,
        pages: ref.pages,
        year: ref.year,
        title: ref.title,
        firstauthor: ref.firstauthor,
        lastauthor: ref.lastauthor,
        pubdate: ref.pubdate,
        attr: ref.json
      }).then((res) => {
        win.def.log({ level: 'info', file: 'model/database', func: 'createRef', message: `Insert of record id ${res.dataValues.id}.`});
        resolve({
          status: 'OK',
          id: res.dataValues.id,
        });
      }).catch((e) => {
        win.def.log({ level: 'error', file: 'model/database', func: 'createRef', message: `${e.name}: ${e.message}`, stack: e.stack});
        reject({
          status: 'Error',
          name: e.name,
          message: e.message
        });
      });
    }); /// Promise
  }     /// Create Ref
  
  
  /// ------------------------------------------------------------------
  /// Query database
  /// ------------------------------------------------------------------
   
  /// https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
  static async count() {
    return new Promise((resolve, reject) => {
      const res = Refs.count({}).then((res) => {
        resolve({ count: res });
      }).catch((e) => {
        reject({
          status: 'Failed',
          name: e.name,
          message: e.message
        });
      });
    });     /// Promise
  }         /// count
  
  static async getRecordByTxtId(txtId) {
    console.log(`[model/database] getRecordByTxtId. Received txtId ${txtId}`.brightYellow);
    return new Promise((resolve, reject) => {
      const res = Refs.findAll({
        where: {
          txtId: id
        }
      }).then((res) => {
        console.log(`[model/database] getRecordByTxtId. Success`.brightYellow);
        console.log(res);
        resolve(res);
      }).catch((e) => {
        console.log(`[model/database] getRecordByTxtId. Failed`.brightYellow);
        reject({
          status: 'Failed',
          name: e.name,
          message: e.message
        });
      });
    });
  }
  
  
};


module.exports = {
  Database:  Database,
  Refs: Refs
}
