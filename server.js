/**
 * Example dependencies / constants
 */

process.env.NODE_ENV = 'production';

var apnagent = require('apnagent')
  , express = require('express')
  , join = require('path').join
  , port = process.env.PORT || 3000;

/**
 * Create application
 */

var app = express()
  , server = require('http').createServer(app);

/**
 * Configure Express
 */

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

/**
 * Use a MockAgent for dev/test envs
 */

app.configure('development', 'test', function () {
  var agent = new apnagent.MockAgent();

  // no configuration needed

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'mock');
});

/**
 * Usa a live Agent with sandbox certificates
 * for our staging environment.
 */

app.configure('staging', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/apn/dev_cert.pem'))
    .set('key file', join(__dirname, 'certs/apn/dev_key.pem'))
    .enable('sandbox');

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'live-sandbox');
});

/**
 * Use a live Agent with production certificates
 * for our production environment.
 */

app.configure('production', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/apn/prod_cert.pem'))
    .set('key file', join(__dirname, 'certs/apn/prod_key.pem'));

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'live-production');
});

/**
 * Set our environment independant configuration
 * and event listeners.
 */

app.configure(function () {
  var agent = app.get('apn')
    , env = app.get('apn-env');

  // common settings
  agent
    .set('expires', '1d')
    .set('reconnect delay', '1s')
    .set('cache ttl', '30m');

  // see error mitigation section
  agent.on('message:error', function (err, msg) {
    
    console.log('error message: [%s]', JSON.stringify(err));
  });

  // connect needed to start message processing
  agent.connect(function (err) {
    if (err) throw err;
    console.log('[%s] apn agent running', env);
  });
});

/**
 * Sample endpoint
 */

app.post('/apn', function (req, res) {
    var agent = app.get('apn')
        , alert = req.body.alert
        , token = req.body.token;
    
    var a = agent.createMessage();
    
    a.device(token);
    
    if(alert.length == 0){
        //a.set('content-available', 1);
        a.contentAvailable(1);
    } else {
        a.set('body', alert);
    }
    
    a.send(function (err) {
        // handle apnagent custom errors
        if (err && err.toJSON) {
            res.json(400, { error: err.toJSON(false) });
        } 
        
        // handle anything else (not likely)
        else if (err) {
            res.json(400, { error: err.message });
        }
        
        // it was a success
        else {
            res.json({ success: true });
        }
    });
});

/**
 * Start server
 */

server.listen(port, function () {
  console.log('http started on port %d', server.address().port);
});

