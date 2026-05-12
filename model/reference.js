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
  #fauth
  #lauth
  #json     /// Internal json representation of current object

  get id    ()        { return this.#id;    }
  set id    (x)       { this.#id = x;     }
  get type  ()        { return this.#type;  }
  set type  (x)       { this.#type = x;   }
  get title ()        { return this.#title; }
  set title (x)       { this.#title = x;  }
  get source()        { return this.#source;}
  set source(x)       { this.#source = x; }
  get year  ()        { return this.#year;  }
  set year  (x)       { this.#year = x;   }
  get epubdate()      { return this.#epubdate; }
  set epubdate(x)     { this.#epubdate = x; }
  get firstauthor()   { return this.#fauth; }
  set firstauthor(x)  { this.#fauth = x; }
  get lastauthor()    { return this.#lauth; }
  set lastauthor(x)   { this.#lauth = x;       }
  get json  ()        { return this.#json;  }
  
  constructor(json){
    //console.log(`[model/reference] constructor`.brightYellow);
    this.#json = json;
  }
  
  toString() {  return `[Reference] ID: ${this.id}`; }

  /**
   * @param{json}   : Json-Object as provided by Entrez (PubMed)
   * @returns{Reference}
   **/

  static fromEntrez(j) {
    //console.log(`[model/reference] static fromEntrez: Received uid ${j.uid}`.brightYellow);
    const r = new Reference(j);
    r.id = `pmid-${j.uid}`
    r.type = 'pubmed';
    r.title = j.title;
    r.source = j.source;
    r.year = j.pubdate;
    r.epubdate = j.epubdate;
    r.firstauthor = j.sortfirstauthor;
    r.lastauthor = j.lastauthor;
    
    return r;
  }
  
  static fromExtern(j) {
    const r = new Reference(j);
    
    return r;
  }
};


module.exports = Reference;

/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
