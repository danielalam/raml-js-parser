/**
 * Created by danielalam on 2/27/15.
 * Use this for debugging
 */
var raml = require('../raml-js-parser');

var definition = [
  '#%RAML 0.8',
  '---',
  'title: Test',
  'baseUri: http://myapi.org',
  '/resource:',
  '  post:',
  '    body:',
  '      application/json:',
  '        examples:',
  '          mobile: | ',
  '            {"name": 1} ',
].join('\n');

raml.load(definition).then( function(data) {
  console.log(data);
}, function(error) {
  console.log('Error parsing: ' + error);
});
