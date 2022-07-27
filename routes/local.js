const express = require('express');
const fs = require('fs');
const path = require('path');
const colors = require('colors');


var router = express.Router();

const file_path = path.join(__dirname, '../json');

function writeJson(obj, name){
  let filename = 'json/' + name + '.json';
  /// Include spacer for readability
  let js = JSON.stringify(obj, null, 2);
  return fs.promises.writeFile(filename, js);
}

/// ////////////////////////////////////////////////////////////////////////////
/// Returns names of all filenames in local *json* directory
/// ////////////////////////////////////////////////////////////////////////////

/// Facilitates usage in db-module.
var localJsonPaths = function(request) {
  return fs.promises.readdir(request.app.locals.json)
  .then(filenames => { return filenames.map(name => path.parse(name)); })
  /// { base: '12.js', ext: '.js', name: '12' }
}

/// curl http://localhost:9000/local/paths
router.get('/paths', function(request, result, next) {
  localJsonPaths(request)
    .then(paths => {
      console.log(paths[0]);
      result.status(200).json(paths)}
    )
  .catch(reason => {
    console.log('[local.js] Rejected: %s'.brightRed, reason);
    result.status(500).json({ message: reason });
  });
});


router.get('/:pmid', function(request, result, next){
  
  let filename = path.join(file_path, request.params.pmid + '.json')
  fs.promises.readFile(filename, "utf8")
    .then(content => {
      result.json(JSON.parse(content));
    })
    .catch(reason => {
      console.log('[local.js] Rejected: %s'.brightRed, reason);
      result.status(404).send('Not found');
    });
});
/// curl http://localhost:9000/local/7917726



module.exports = router;
