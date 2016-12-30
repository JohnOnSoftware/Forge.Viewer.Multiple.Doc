/*

The MIT License (MIT)

Copyright (c) Thu Aug 18 2016 Zhong Wu zhong.wu@autodesk.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORTOR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var credentials =(require ('fs').existsSync ('credentials.js') ?
	  require('../credentials')
	: (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express =require ('express') ;
var ForgeSDK = require('forge-apis');

var router =express.Router () ;



String.prototype.toBase64 = function () {
  return new Buffer(this).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};


function safeBase64encode(st) {
    return (new Buffer (st).toString ('base64')
        .replace (/\+/g, '-') // Convert '+' to '-'
        .replace (/\//g, '_') // Convert '/' to '_'
        .replace (/=+$/, '')
    ) ;
};


var ossBucketKey = process.env.FORGE_BUCKET || 'persistentbucketforjohn';

var oAuth2TwoLegged;



///////////////////////////////////////////////////////////////////////////////
// Generates 2-legged access token using forge-apis SDK
///////////////////////////////////////////////////////////////////////////////
router.get('/token', function(req, res){
    var autoRefresh = true;
    if( !oAuth2TwoLegged )
        oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged( credentials.client_id, credentials.client_secret, credentials.scope, autoRefresh);
    
    oAuth2TwoLegged.authenticate().then( function(credentials){
        res.status(200).end(JSON.stringify(credentials));

    }, function(err){
        res.status(400).end(err);
        console.log(err);
    });
});


router.get('/models', function(req, res){
    var models = [];
    if(!oAuth2TwoLegged)
        oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged( credentials.client_id, credentials.client_secret, credentials.scope, true);

    oAuth2TwoLegged.authenticate()
    .then( function(credentials){
        var ObjectsApi = new ForgeSDK.ObjectsApi;
        return ObjectsApi.getObjects(ossBucketKey,{}, oAuth2TwoLegged, oAuth2TwoLegged.getCredentials() );
    })
    .then(function( objects ){

        if( objects ){
            objects.body.items.forEach( function(object){
                models.push({id: object.objectKey.split('.')[0], label: object.objectKey, urn: safeBase64encode(object.objectId)});
            } );
        }
        res.status(200).end( JSON.stringify(models));
    })
    .catch( function(error){
        console.log(error);
        res.status(500).end(error);
    });
});


router.get('/buckets', function(req, res){
    //TBD
    res.status(200).send('Not implemented');
});

module.exports =router ;