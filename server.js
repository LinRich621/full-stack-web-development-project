const
    express = require('./config/express'),
    config = require('./config/config'),
    version = config.get('version');

const app = express();

const port = process.env.PORT || 3333;
app.listen(port, function() {
    console.log('API Ver: ' + version + '; Listening on port: 3333');
})



