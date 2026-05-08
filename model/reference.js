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

const colors    = require('colors');
const path      = require('path');
const fsp       = require('fs').promises;

const config    = require(path.join(__dirname, '..', 'config', 'config'));
const win       = require(path.join('.', '..', 'logger', 'logger'));

/// ////////////////////////////////////////////////////////////////////////////
/// Reference class objects represent the internal format of literatur
/// references as stored in the database
/// The main intention is to provide a standard subset of fields because
/// it is unfeasible to store the full entrez object in
/// ////////////////////////////////////////////////////////////////////////////


class Reference {
  
  #id       /// Textual uid which will be used as filename
  #type     /// e.g. pubmed, dae, ai
  #title
  #source   /// Journal
  #year
  #epubdate
  #pmid
  #pmcid
  #firstauthor
  #json     /// Internal json representation of current object
  
  constructor(){
    console.log(config.json.dir);
  }
   
  /**
   * @param{json}   : Json-Object as provided by Entrez (PubMed)
   * @returns{Reference}
   **/
  static fromEntrez = (json) => {
    this.#json = json;
    
    this.#id = `pmid-${json.uid}`;
    this.#type= "pubmed";
    this.#title = json.title;
    this.#source = json.source;
    this.#year = json.pubdate;
    this.#epubdate = json.epubdate;
  }
   
   
 
  /**
   * @returns(json-representation of current object)
   **/
  getJson = async () => {
    return this.#json;
  }
  

}

const ref = new Reference;

module.exports = {
  ref : ref
}
/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
