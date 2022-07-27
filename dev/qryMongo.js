'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2022, Wolfgang Kaisers
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

const path   = require('path');
const client = require('mongodb').MongoClient;
const config = require(path.join(__dirname, '..', 'config'));
const colors = require('colors');

/// ////////////////////////////////////////////////////////////////////////////
/// Difference using iterator (see iterable.js)
/// ////////////////////////////////////////////////////////////////////////////


class MongoClient {
  
  constructor(){ }
  
 notIn = (A, B) => {
    const setA = new Set(A);
    const setB = new Set(B);
    
    const contained = [];
    const unknown = [];
    
    for(const v of setA.values()){
      if(setB.delete(v)) {
        contained.push(v);
      } else {
        unknown.push(v);
      }
    }
    return { contained: contained, unknown: unknown };
  }
   
  contained = (uid, pubmed) => {
    let ui=0, pi=0;
    let contained = [];
    let unknown = [];
    
    while(ui < uid.length && pi < pubmed.length){
      if      (uid[ui] < pubmed[pi].uid) { unknown.push(uid[ui++]); }
      else if (pubmed[pi].ui > uid[ui])   { ++pi; }
      else    { contained.push(pubmed[pi]); ++ui; ++ pi; }
    }
    return { contained : contained, unknown: unknown }
  }
  
  async findAllUids(){
    return client.connect(config.database.url)
      .then(con => {
        return con.db(config.database.dataBaseName)
        .collection(config.database.collectionName)
        .find({}, { projection: { uid: 1, _id: 0 } })
        .limit(10)
        .toArray()
      })
      .then(res => res.map(r => parseInt(r.uid)))
  }
  
  async filterDatasets(){
    return client.connect(config.database.url)
      .then(con => {
        return con.db(config.database.dataBaseName)
        .collection(config.database.collectionName)
        .find({}, { projection: { uid: 1, _id: 1, pubdate: 1} })
        .limit(10)
        .toArray()
      })
      .then(res => res.map(r => { r.uid = parseInt(r.uid); return r; }))
      .then(res => res.sort((a, b) => a.uid > b.uid))
  }
  
  
  async getFilteredDatasets(pmids){
    return this.filterDatasets()
      .then(res => this.contained(pmids, res));
  }
  
  findUids(pmids) {
    return this.findAllUids()
      .then(res => this.notIn(pmids, res) );
  }
  
}

const pmids = [ 10000, 13682, 100000, 137732, 1000000, 1147311, 1148073, 1148076, 1311535, 1404801, 1469157,  1500000, 1520054, 1549988 ];

const mongo = new MongoClient();
mongo.findUids(pmids).then(res => console.log(res));
mongo.getFilteredDatasets(pmids).then(res => console.log(res));
