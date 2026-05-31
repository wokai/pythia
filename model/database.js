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

const { Sequelize, DataTypes, Model, Op } = require('sequelize');

const sequelize = new Sequelize(
  config.database.dataBaseName,
  config.database.dbUserName,
  config.database.dbUserPassword, 
  {
    host: config.database.host,
    dialect: 'mariadb',
    /// 'Change to false to disable logging
    logging: false // console.log // false
  }
)

sequelize.authenticate().then(() => {
  win.def.log({ 
    level: 'info', 
    file: 'model/database',
    func: 'toplevel', 
    message: `Sequelize authenticate to ${config.database.host}.${config.database.dataBaseName} success`
  });
}).catch (error => {
  win.def.log({ 
    level: 'error',
    file: 'model/database',
    func: 'toplevel',
    message: `Sequelize authenticate to ${config.database.host}.${config.database.dataBaseName} failed`
  });
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
 * SELECT id, txtid, filename, createdAt FROM Refs;
 */

/**
 * @usedBy    - (routes/entrez, routes/db, model/json)
 **/

class Database {
  
  constructor(){}
  

  /// ------------------------------------------------------------------
  /// 
  /// ------------------------------------------------------------------

  isInt = (val) => { return Number.isNaN(parseInt(val)); }

  /**
   * @param         - {pmid: array of numeric}
   * @returns       - {Sorted array with Pubmed-Id (strings)}
   **/
  toPmidArray = (pmid) => {
    /// Eventually convert to array
    if(!Array.isArray(pmid)){ val = [0].fill(pmid); }
    /// Ensure, that only integral numbers are processed
    const pmint = pmid.map(x => parseInt(x));
    const pminf = pmint.filter(x => !Number.isNaN(x));
    return pminf.map(x => x.toString()).sort();
  }
  
  
  /**
   * @param{uid}      - (array of pubmed-id's. Output of toPmidArray)
   * @param{pubmed}   - (Array of pubmed-records)
   * @returns{object} - ({ contained: pubmed-records, unknown: pubmed-id's })
   **/
  setDifference = (uid, pubmed) => {
    let ui=0, pi=0;
    let contained = [];
    let unknown   = [];
    
    while(ui < uid.length && pi < pubmed.length){
      if      (uid[ui] < pubmed[pi].uid) { unknown.push(uid[ui++]); }
      else if (uid[ui] > pubmed[pi].uid) { ++pi; }
      else    { contained.push(pubmed[pi]); ++ui; ++ pi; }
    }
    
    while(ui < uid.length){ unknown.push(uid[ui++]); }
    if(contained.length > 0){
      console.log(`[model/mongo] Found pmid's ${contained.map(p => p.uid).join()}`.green);
    } else {
      console.log('[model/mongo] No pmid found in local database.'.green);
    }
    return { contained : contained, unknown: unknown }
  }
  
  
  /// ------------------------------------------------------------------
  /// Insert routines
  /// ------------------------------------------------------------------

  /**
   * @param{ref}      - (Reference object)
   * @returns         - (Promise: resolved provides id)
   **/
  async createRef(ref){
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
  async count() {
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
  
  
  /**
   * @usedBy    { get: /pmid/:pmid} + (routes/db)
   * @param     { txtid: Record Id - String }
   * @returns   { json from attr column as returned by findOne }
   * @throws    { Nothing. Promise will be rejected }
   **/
  
  async getOneRecordByTxtId(txtId) {
    return new Promise((resolve, reject) => {
      /// findOne returns a single object of type Refs
      Refs.findOne({ where: { txtid: txtId } }).then((res) => {
        if(res === null) {
          resolve({ found: 0, message: `txtId ${txtId} not found.`});
        } else {
          resolve({ found: 1, data: res.attr });
        }
      }).catch((err) => {
        win.def.log({ 
          level: 'error', 
          file: 'model/database', 
          func: 'getOneRecordByTxtId', 
          message: `${err.name}: ${err.message}`,
          stack: err.stack
        });
        
        reject({
          status: 'Failed',
          name: err.name,
          message: err.message
        }); /// reject
      });   /// catch
    });
  }
  
  /**
   * @usedBy    { get: /pmid/:pmid} + (routes/db)
   * @param     { txtIds: Array of txtId's - String }
   * @returns   { Array of database records as returned by findAll }
   * @throws    { Nothing. Promise will be rejected }
   **/
  
  async getRecordsByTxtId(txtIds) {
    return new Promise((resolve, reject) => {
      /// findAll returns array
      Refs.findAll({ where: { txtid: txtIds } }).then((res) => {
        resolve(res);
      }).catch((err) => {
        win.def.log({ 
          level: 'error', 
          file: 'model/database', 
          func: 'getRecordsByTxtId', 
          message: `${err.name}: ${err.message}`,
          stack: err.stack
        });
        
        reject({
          status: 'Failed',
          name: err.name,
          message: err.message
        }); /// reject
      });   /// catch
    });     /// Promise
  }         /// getAllRecordsByTxtId
  
  async getRecordsByTitle(regexp) {
    return new Promise((resolve, reject) => {
      Refs.findAll({
        where: { title: { [Op.regexp]: regexp } }
      }).then((res) => {
        console.log(`[model/database] getRecordsByTitle. Title: ${regexp}`.brightYellow);
        resolve(res);
      }).catch((err) => {
          win.def.log({ 
            level: 'error', 
            file: 'model/database', 
            func: 'getRecordsByTitle', 
            message: `${err.name}: ${err.message}`,
            stack: err.stack
          });
          reject({
            status: 'Failed',
            name: err.name,
            message: err.message
          });
      }); /// catch
    });   /// Promise
  }       /// getRecordsByTitle
  
} /// class Database

const database = Object.freeze(new Database);

module.exports = {
  database: database,
  //Database: Database,
  Refs: Refs
}
