// Módulos
let express = require('express');
let app = express();

let jwt = require('jsonwebtoken');
app.set('jwt', jwt);
let fs = require('fs');
let https = require('https');
let expressSession = require('express-session');
app.use(expressSession({secret: 'abcdefg', resave: true, saveUninitialized: true}));
let crypto = require('crypto');
let fileUpload = require('express-fileupload');
app.use(fileUpload());
let mongo = require('mongodb');
let swig = require('swig');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

// routerUsuarioToken
let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) { // verificar el token
        jwt.verify(token, 'secreto', function (err, infoToken) {
            if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                res.status(403); // Forbidden
                res.json({acceso: false, error: 'Token invalido o caducado'});
                // También podríamos comprobar que intoToken.usuario existe
                return;
            } else { // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });
    } else {
        res.status(403); // Forbidden
        res.json({acceso: false, mensaje: 'No hay Token'});
    }
});
// Aplicar routerUsuarioToken
app.use('/api/cancion', routerUsuarioToken);

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function (req, res, next) {
    console.log("routerUsuarioSession");
    if (req.session.usuario) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : " + req.session.destino)
        res.redirect("/identificarse");
    }
});
//Aplicar routerUsuarioSession
app.use("/canciones/agregar", routerUsuarioSession);
app.use("/publicaciones", routerUsuarioSession);
app.use("/cancion/comprar", routerUsuarioSession);
app.use("/compras", routerUsuarioSession);

//routerAudios
let routerAudios = express.Router();
routerAudios.use(function (req, res, next) {
    console.log("routerAudios");
    let path = require('path');
    let idCancion = path.basename(req.originalUrl, '.mp3');
    gestorBD.obtenerCanciones({"_id": mongo.ObjectID(idCancion)}, function (canciones) {
        if (req.session.usuario && canciones[0].autor == req.session.usuario) {
            next();
        } else {
            let criterio = {usuario: req.session.usuario, cancionId: mongo.ObjectID(idCancion)};
            gestorBD.obtenerCompras(criterio, function (compras) {
                if (compras != null && compras.length > 0) {
                    next();
                } else {
                    res.redirect("/tienda");
                }
            });
        }
    })
});
//Aplicar routerAudios
app.use("/audios/", routerAudios);

// routerUsuarioSession
var routerComentarios = express.Router();
routerComentarios.use(function (req, res, next) {
    console.log("routerComentarios");
    if (req.session.usuario) {
        // dejamos correr la petición
        next();
    } else {
        let respuesta = swig.renderFile('views/error.html', {
            error: "No has iniciado sesión"
        });
        res.send(respuesta);
    }
});
//Aplicar routerAudios
app.use("/comentarios/:cancion_id", routerComentarios);

//routerUsuarioAutor
let routerUsuarioAutor = express.Router();
routerUsuarioAutor.use(function (req, res, next) {
    console.log("routerUsuarioAutor");
    let path = require('path');
    let id = path.basename(req.originalUrl);
    // Cuidado porque req.params no funciona en el router si los params van en la URL.
    gestorBD.obtenerCanciones({_id: mongo.ObjectID(id)}, function (canciones) {
        console.log(canciones[0]);
        if (canciones[0].autor == req.session.usuario) {
            next();
        } else {
            res.redirect("/tienda");
        }
    })
});
//Aplicar routerUsuarioAutor
app.use("/cancion/modificar", routerUsuarioAutor);
app.use("/cancion/eliminar", routerUsuarioAutor);

//routerCompras
let routerCompras = express.Router();
routerCompras.use(function (req, res, next) {
    console.log("routerCompras");
    let path = require('path');
    let id = path.basename(req.originalUrl);
    gestorBD.obtenerCanciones({_id: mongo.ObjectID(id)}, function (canciones) {
        if (req.session.usuario && canciones[0].autor == req.session.usuario) {
            res.redirect("/tienda");
        } else {
            let criterioCompra = {"cancionId": mongo.ObjectID(id)};
            gestorBD.obtenerCompras(criterioCompra, function (compras) {
                if (compras <= 0) {
                    next();
                } else {
                    res.redirect("/tienda");
                }
            });
        }
    });
});
//Aplicar routerCompras
app.use("/cancion/comprar/:id", routerCompras);

app.use(express.static('public'));

// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:sdi@tiendamusica-shard-00-00.xkin3.mongodb.net:27017,tiendamusica-shard-00-01.xkin3.mongodb.net:27017,tiendamusica-shard-00-02.xkin3.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-dgpspz-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rcanciones.js")(app, swig, gestorBD);
require("./routes/rcomentarios.js")(app, swig, gestorBD);
require("./routes/rautores.js")(app, swig);
require("./routes/rapicanciones.js")(app, gestorBD);

app.get('/', function (req, res) {
    res.redirect('/tienda');
});

app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); // mostramos el error en consola
    if (!res.headersSent) {
        res.status(400);
        let respuesta = swig.renderFile('views/error.html', {
            error: "Recurso no disponible"
        });
        res.send(respuesta);
    }
});

// lanzar el servidor
https.createServer({
    key: fs.readFileSync('certificates/alice.key'),
    cert: fs.readFileSync('certificates/alice.crt')
}, app).listen(app.get('port'), function () {
    console.log("Servidor activo https://localhost:8081/");
});
