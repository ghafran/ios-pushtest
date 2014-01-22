/**
 * Example dependencies / constants
 */

process.env.NODE_ENV = 'staging_prod';

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

app.configure('staging_dev', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/sr_stg_dev_cert.pem'))
    .set('key file', join(__dirname, 'certs/sr_stg_dev_key.pem'))
    .enable('sandbox');

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'live-sandbox');
});

app.configure('staging_prod', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/sr_stg_prod_cert.pem'))
    .set('key file', join(__dirname, 'certs/sr_stg_prod_key.pem'));

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'live-production');
});


app.configure('production_dev', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/sr_dev_cert.pem'))
    .set('key file', join(__dirname, 'certs/sr_dev_key.pem'))
    .enable('sandbox');

  // mount to app
  app
    .set('apn', agent)
    .set('apn-env', 'live-sandbox');
});


app.configure('production_prod', function () {
  var agent = new apnagent.Agent();

  // configure agent
  agent 
    .set('cert file', join(__dirname, 'certs/sr_prod_cert.pem'))
    .set('key file', join(__dirname, 'certs/sr_prod_key.pem'));

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
        , silent = req.body.silent
        , message = req.body.message
        , badge = req.body.badge
        , sound = req.body.sound
        , token = req.body.token
        , image = req.body.image;
    
    var data = {
        silent: req.body.silent,
        message: req.body.message,
        badge: req.body.badge,
        sound: req.body.sound,
        token: req.body.token,
        image: req.body.image
    };
    
    var a = agent.createMessage();
    
    a.device(token);

    // Silent Payload
    if(silent == true){
        
        a.contentAvailable(1);
    }
    
    // Message Payload
    if(message.length > 0){
        
        a.alert(message);
    }
    
    // Badge Payload
    if(badge > -1){
        
        a.badge(parseInt(badge));
    }
    
    // Sound Payload
    if(sound.length > 0){
        
        a.sound(sound);
    }
    
    // Image Payload
    if(image.length > 0){
        
        a.alert('launch-image', image);
    }
    
    a.send(function (err) {
        // handle apnagent custom errors
        if (err && err.toJSON) {
            var output = { success: false, error: err.toJSON(false), data: data };
            res.json(400, output);
            console.log(JSON.stringify(output));
        } 
        
        // handle anything else (not likely)
        else if (err) {
            var output = { success: false, error: err.message, data: data };
            res.json(400, output);
            console.log(JSON.stringify(output));
        }
        
        // it was a success
        else {
            var output = { success: true, data: data };
            res.json(200, output);
            console.log(JSON.stringify(output));
        }
    });
});

/**
 * Start server
 */

server.listen(port, function () {
  console.log('http started on port %d', server.address().port);
});

