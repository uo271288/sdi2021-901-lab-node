// Módulos
let express = require('express');
let app = express();

let fileUpload = require('express-fileupload');
app.use(fileUpload());
let mongo = require('mongodb');
let swig = require('swig');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

app.use(express.static('public'));

// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:sdi@tiendamusica-shard-00-00.xkin3.mongodb.net:27017,tiendamusica-shard-00-01.xkin3.mongodb.net:27017,tiendamusica-shard-00-02.xkin3.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-dgpspz-shard-0&authSource=admin&retryWrites=true&w=majority');
//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rcanciones.js")(app, swig, gestorBD);
require("./routes/rautores.js")(app, swig);

// lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo http://localhost:8081/');
});