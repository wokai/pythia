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
/// Prepares a given DOI so that it can be used as a filename
/// 1) Removes protocol (https://)
/// 2) Removes leading 'doi.org/'
/// 3) Replaces non char+digit wich minus ('-')
/// 4) Adds leading 'doi-'
/// ////////////////////////////////////////////////////////////////////////////


/// Usage: r.doi = getArticleId(j, 'doi');
function getArticleId(j, field) {
  const i = j.articleids.findIndex(a => a.idtype == field);
  //console.log(`[getArticleId] get id ${field}. Index: ${i}`.yellow);
  return i == (-1) ? null : j.articleids[i].value;
}

function doiToFilename(doi) {
  if(doi == null) return null;
  ///console.log(`[model/reference] doiToFilename: doi ${doi}`.brightYellow);
  /// Remove url protocol:
  const d1 = doi.replace(/^https?\:\/\//i, "");
  /// Remove leading doi:
  const d2 = d1.replace(/^doi.org\//g, "");
  /// Anything that isn't a character, digit or underscore
  return 'doi-' + d2.replaceAll(/\W/g, '-');
}

/// ////////////////////////////////////////////////////////////////////////////
/// Reference class objects represent the internal format of literature
/// references as stored in the database
/// The intention is to provide a standard subset of data-fields because
/// it's unfeasible to store the full entrez object in an sql database
/// ////////////////////////////////////////////////////////////////////////////

class Reference {
  /// ------------------------------------------------------------------
  /// id      : Unique numeric identifier as created by database
  /// txtid   : Textual unique identifier e.g. 23147111 for pubmed 
  ///           or doi-10-1126-science-124-3212-103 or s42256-019-0088-2
  /// filename: Will usually be identical to txtid
  /// type    : e.g. pubmed, dae, ai
  /// source  : synonym for journal

  /// ------------------------------------------------------------------
  /// Properties
  
  /// record as stored in dababase
  #db

  /// json representation used for construction
  /// as given by e.g. entrez
  #json

  /// ------------------------------------------------------------------
  /// public accessors
  /// ------------------------------------------------------------------
  
  get json  ()        { return this.#json;          }
  get db    ()        { return this.#db;            }

  get id    ()        { return this.#db.id;         }
  set id    (x)       { this.#db.id = x;            }
  get txtid  ()       { return this.#db.txtid;      }
  set txtid  (x)      { this.#db.txtid = x;         }
  get filename()      { return this.#db.filename;   }
  set filename(x)     { this.#db.filename = x;      }
  get type  ()        { return this.#db.type;       }
  set type  (x)       { this.#db.type = x;          }
  
  
  get doi()           { return this.#db.doi;        }
  set doi(x)          { this.#db.doi = x;           }
  
  get pmid()          { return this.#db.pm.pmid;    }
  set pmid(x)         { this.#db.pm.pmid = x;       }
  get pmcid()         { return this.#db.pm.pmcid;   }
  set pmcid(x)        { this.#db.pm.pmcid = x;      }

  get source()        { return this.#db.ref.source; }
  set source(x)       { this.#db.ref.source = x;    }
  get journal()       { return this.#db.ref.source; }
  set journal(x)      { this.#db.ref.source = x;    }
  get volume()        { return this.#db.ref.volume; }
  set volume(x)       { this.#db.ref.volume = x;    }
  get issue()         { return this.#db.ref.issue;  }
  set issue(x)        { this.#db.ref.issue = x;     }
  get pages()         { return this.#db.ref.pages;  }
  set pages(x)        { this.#db.ref.pages = x;     }
  get year()          { return this.#db.ref.year;   }
  set year(x)         { this.#db.ref.year = x;      }
  
  get title ()        { return this.#db.art.title;  }
  set title (x)       { this.#db.art.title = x;     }  
  set year  (x)       { this.#db.ref.year = x;      }
  get firstauthor()   { return this.#db.art.fAuthor;}
  set firstauthor(x)  { this.#db.art.fAuthor = x;   }
  get lastauthor()    { return this.#db.art.lAuthor;}
  set lastauthor(x)   { this.#db.art.lAuthor = x;   }
  get pubdate()       { return this.#db.art.pubdate;}
  set pubdate(x)      { this.#db.art.pubdate = x;   }
  
  toString() {  return `[Reference] ID: ${this.id}`; }


  /// ------------------------------------------------------------------
  /// Constructor
  /// ------------------------------------------------------------------
  constructor(json){
    this.#json = json;
    
    this.#db = {
      id:       0,
      txtid:    null,
      filename: null,
      type:     null,
      doi:      null,
      pm: {
        pmid:   null,
        pmcid:  null
      },
      ref: {
        source: null,
        volume: null,
        issue:  null,
        pages:  null,
        year:   null
      },
      art: {
        title: null,
        fAuthor: null,
        lAuthor: null,
        pubdate: null
      } 
    };
  }


  /// ------------------------------------------------------------------
  /// Static constructor methods
  /// ------------------------------------------------------------------

  /**
   * @param{json}   : Json-Object as provided by Entrez (PubMed)
   * @usedBy        : model/json.ReadRef
   * @returns{Reference}
   **/

  static fromPubmed(j) {
    //console.log(`[model/reference] static fromPubmed: Received uid ${j.uid}`.brightYellow);
    const r = new Reference(j);
    
    r.txtid = j.uid /// `pmid-${j.uid}` will not be used initially
    r.type = 'pubmed';
    r.filename = j.uid;
  
    r.source = j.source;
    r.volume = j.volume;
    r.issue  = j.issue;
    r.pages  = j.pages;
    r.year = j.pubdate.substr(0,4);
    
    r.title = j.title;
    r.firstauthor = j.sortfirstauthor;
    r.lastauthor = j.lastauthor;
    r.pubdate = j.epubdate;
    r.doi = getArticleId(j, 'doi');
    
    r.pmid = j.uid;
    r.pmcid = getArticleId(j, 'pmc');

    return r;
  }
  
  //https://europepmc.org/RestfulWebService
  
  /**
   * Create reference object from Json object
   * {
   *  type:   (string)              [ 'pubmed', 'doi', 'eup', 'prop' ]
   *  id:     (string or numeric)
   *  title:  (string)
   *  source: (string)
   *  year:   (numeric)
   * }
   **/
  static fromDoi(j){
    const r = new Reference(j);
    r.id = doiToFilename(j.doi);
    r.doi = j.doi;
    r.type = j.type;
    
    r.year = j.year;

    r.journal = j.journal;
    r.title = j.title;
    r.firstauthor = j.firstauthor;
    r.lastauthor = j.lastauthor;
    return r;
  }
  
  static fromProprietary(j) {
    const r = new Reference(j);
    r.id = `prop-${j.uid}`
    r.type = j.type;
    r.doi = j.doi;

    r.journal = j.journal;
    r.year = j.year;

    r.title = j.title;

    r.pubdate = j.pubdate;
    r.firstauthor = j.firstauthor;
    r.lastauthor = j.lastauthor;
    return r;
  }
};


module.exports = Reference;

/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
