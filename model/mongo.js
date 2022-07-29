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
  
  constructor(){ }
  
  /**
   * @param{uid: array.numeric}
   * @param{uid: array.numeric}
   **/
  contained = (uid, pubmed) => {
    console.log(`[mongo.js] contained: uid: ${uid.length}, pubmed: ${pubmed.length}`);
    let ui=0, pi=0;
    let contained = [];
    let unknown   = [];
    
    while(ui < uid.length && pi < pubmed.length){
      //console.log(`[mongo.js] contained: uid: ${uid[ui]}, pmid: ${pubmed[pi].uid}`);
      if      (uid[ui] < pubmed[pi].uid) { unknown.push(uid[ui++]); }
      else if (pubmed[pi].ui > uid[ui])   { ++pi; }
      else    { contained.push(pubmed[pi]); ++ui; ++ pi; }
    }
    return { contained : contained, unknown: unknown }
  }
  
  
  /***
   * @param
   **/
  async filterDatasets(collection, pmids){
    /// find returns a *cursor* not a document
    return collection.find({ uid: { $in: pmids }}, { projection: { uid: 1, _id: 0 , pubdate: 1} })
      .toArray()
      .then(res => res.map(r => { r.uid = parseInt(r.uid); return r; }))
      .then(res => res.sort( (a, b) => a.uid-b.uid )) /// Prevent lexicographical sort
  }
  
  /***
   * @param{collection: Mongodb.collection}
   * @param{pmids: array.numeric}  - { integral values: pubmed-id's }
   * @returns{object} - ({ contained: full-objects, unknown: numeric})
   **/
  async getFilteredDatasets(collection, pmids){
    return this.filterDatasets(collection, pmids)
      //.then(res => { this.contained(pmids, res) });
  }
  
}

const mongoQuery = new MongoQuery;

module.exports = {
  query : mongoQuery
}

