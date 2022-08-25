const express = require('express');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const config = require(path.join('..', 'config', 'config'));

var router = express.Router();

const file_path = config.json.dir;

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
  /// { base: '12.js', ext: '.js', name: '12' }
}

/// curl http://localhost:9000/local/paths -w '\nDownloaded %{size_download} bytes\n'
router.get('/paths', function(request, result, next) {
  localJsonPaths(request)
    .then(paths => {
      console.log(paths[0]);
      result.status(200).json(paths.slice(0, 10))}
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
/// curl http://localhost:9000/local/7917726 -w '\nDownloaded %{size_download} bytes\n'
/// curl http://localhost:9000/local/9876543 -w '\nDownloaded %{size_download} bytes\n'



/// curl http://localhost:9000/local/exists/abc -w '\nDownloaded %{size_download} bytes\n'
/// curl http://localhost:9000/local/exists/10066724 -w '\nDownloaded %{size_download} bytes\n'
router.get('/exists/:filename', function(request, result, next){
    let filename = path.join(config.pdf.base, request.params.filename + '.pdf');
    fs.promises.access(filename)
      .then(() => {
        console.log('OK'.brightGreen)
        result.status(200).json({ exists: 1 }) 
      })
      .catch(() => {
        console.log('Not found'.brightRed)
        result.status(200).json({ exists: 0 })
      });
});


module.exports = router;
