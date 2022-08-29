const Stream = require('stream');
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const MongoClient = require('mongodb').MongoClient;


const config = require(path.join(__dirname, '..', 'config', 'config'));

/// Setup
const url =  'mongodb://localhost:27017';
const dataBaseName = 'entrez';    /// Database
const collectionName = 'pubmed';  /// Collection name


var con;
var db;     /// Database
var dbcl;   /// Collection


/// ////////////////////////////////////////////////////////////////////////////
/// Object reader stream:
/// Reads an array of objects and passes them into stream
/// ////////////////////////////////////////////////////////////////////////////

class ReadObject extends Stream.Readable{
  constructor(cursor){
    super({ objectMode: true })
    this._cursor = cursor;
  }
  
  _read(size){
    console.log('Reading ...')
    if(this._cursor.hasNext()){
      this._cursor.next().then((res) => {
          console.log(`[ReadObject] Reading PMID ${res.uid}`)
          this.push(res);
        });
    } else {
      this.push(null);
    }
    //this.push(this._object);
    //this.push(null);
  }
}




class JsonWriter {

  #nFiles
  
  constructor(){
    this.#nFiles = 0;
  }
  
  reset = () => { this.#nFiles = 0; }
  get count() { return this.#nFiles; }
  
  
  /**
   * @param{obj}  - (Object representing Pubmed record)
   * @param{name} - (File name [.json will be added]: Pubmed-id)
   * @returns{Promise}
   **/
  writeSingleJson = async (obj, name) => {
    let filename = path.join(config.json.dir, name + '.json');
    /// //////////////////////////////////////////////////////////////////////////
    /// Object validation
    /// Failing validation will impede insertion into MongoDb collection
    /// //////////////////////////////////////////////////////////////////////////
    if(!obj.hasOwnProperty('title')){
      throw new Error('[json.writeJson] Required property *title* not found.'); 
    }
    /// Include spacer for readability
    let js = JSON.stringify(obj, null, 2);
    return fs.promises.writeFile(filename, js)
        .then(() => {
          ++this.#nFiles;
          //console.log(`[json.js] File ${name} written.`.yellow)
        })
        .catch(reason => {console.log('[model/json.js] writeSingleJson: writeFile Rejected: %s'.brightRed, reason) });
  }
}

const writer = new JsonWriter();

/// ////////////////////////////////////////////////////////////////////////////
/// 
/// ////////////////////////////////////////////////////////////////////////////

MongoClient.connect(url,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(con => {
    /// Choose database and collection
    const db = con.db(dataBaseName);
    const col = db.collection(collectionName);
    return col;
  })
  .then(col => {
    col.count().then((count) => {
      writer.reset();
      console.log(`[MongoToJson] Collection has: ${count} documents`.green);
    })
    col.find().forEach((doc) => {
      writer.writeSingleJson(doc, doc.uid);
    })
    .finally(() => {
      console.log(`[MongoToJson] ${writer.count} object files written.`.green)
    })
  })
  .catch(err => {
    console.log('[MongoToJson] Error: %s'.brightRed, err.message )
  })
  
  
/// ////////////////////////////////////////////////////////////////////////////
/// mongo
/// use entrez;
/// db.pubmed.drop()
/// db.createCollection('pubmed');
/// ////////////////////////////////////////////////////////////////////////////


/// Login to mongodb
/// mongo
/// Create database
/// use entrez;


/*******************************************************************************
db.createUser({
    user: "entrezRestClient",
    pwd: "bH5RenrEpzSyPfm3bn6R7b4Egx79V2bu",
    roles: [
        { role: "readWrite", db: "entrez"}
    ]
})

*******************************************************************************/


/*******************************************************************************
 
db.createCollection('pubmed', {
validator: { $jsonSchema: {
  bsonType: "object",
  required: [ "uid", "title" ],
  properties: {
    phone: {
      bsonType: "string",
      description: "Unique identifier is required and must be string"
    },
   title: {
      bsonType: "string",
      description: "is required and must be string"
   }
  }
 }}
});

*******************************************************************************/


/*******************************************************************************
db.pubmed.createIndex( {
    'uid': 1  
  }, {
    unique: true,  
    sparse: true   
  }
)
db.pubmed.createIndex({ title: 'text' }, { default_language: "english" })
*******************************************************************************/








