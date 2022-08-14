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

/// ////////////////////////////////////////////////////////////////////////////
/// Difference using iterator (see iterable.js)
/// ////////////////////////////////////////////////////////////////////////////


class MongoQuery {
  
  constructor(){}
  
  isInt = (val) => { return Number.isNaN(parseInt(val)); }
  
  
  /**
   * @param{pmid: array of numeric}
   * @returns{Sorted array with Pubmed-Id (strings)}
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
    //console.log(`[mongo.js] contained: uid: ${uid.length}, pubmed: ${pubmed.length}:`);
    //console.log(uid)
    //console.log(pubmed);
    let ui=0, pi=0;
    let contained = [];
    let unknown   = [];
    
    while(ui < uid.length && pi < pubmed.length){
      //console.log(`[mongo.js] contained: uid: ${uid[ui]}, pmid: ${pubmed[pi].uid}`);
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
  
  
  /***
   * @param{collection} - (mongodb collection)
   * @param{pmids}      - (array of string. Output of toPmidArray)
   ***/
  async getMongoDatasets(collection, pmids){
    /// find returns a *cursor* not a document
    return collection.find({ uid: { $in: pmids }}, { projection: { uid: 1, _id: 0 , pubdate: 1} })
      .toArray()
      .then(res => res.sort()) /// Sort lexicographically 
  }
  
  /***
   * @param{collection: Mongodb.collection}
   * @param{pmids: array.numeric}  - { integral values: pubmed-id's }
   * @returns{object} - ({ contained: pubmed-records, unknown: Array of Pubmed-Id's (string)})
   **/
  async getFilteredDatasets(collection, pmids){
    return this.getMongoDatasets(collection, pmids)
      .then(pubmed => this.setDifference(pmids, pubmed));
  }
  
}

const mongoQuery = new MongoQuery;

module.exports = {
  mongo : mongoQuery
}

