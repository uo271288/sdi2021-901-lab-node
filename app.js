// Módulos
let express = require('express');
let app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

let swig = require('swig');
//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig);
require("./routes/rcanciones.js")(app, swig);
require("./routes/rautores.js")(app, swig);

// Variables
app.set('port', 8081);

// lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo http://localhost:8081/');
});