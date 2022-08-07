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
/// 
/// ////////////////////////////////////////////////////////////////////////////

const colors    = require('colors');
const path      = require('path');
const fetch     = require('node-fetch');
const config = require(path.join(__dirname, '..', 'config', 'config'));

class Entrez {
  
  constructor(){}
   
  /**
   * @param{pmids}  - (Array with Pubme-Id's)
   * @returns{Promise}
   **/
  fetch = async (pmids) => {
    let url = config.pubmed.baseUrl + pmids.join();
    console.log(`[model/entrez] Fetching ${pmids.length} datasets:${pmids.join()} `.green);
    console.log(`[model/entrez] POST url: ${url}`.blue);
    return fetch(url).then(res => res.json())
      .then(json => {
        let pmids = json.result.uids;
        let a = [];
        console.log(`[model/entrez] Received pmid's:  ${pmids.join()}`.green)
        pmids.forEach(p => { a.push(json.result[p]); });
        return a;
      })
  }
}

const entrez = new Entrez;

module.exports = {
  entrez : entrez
}

