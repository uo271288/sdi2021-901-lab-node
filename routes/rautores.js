module.exports = function (app, swig) {
    app.get('/autores/agregar', function (req, res) {
        let roles = [{
            "prop": "cantante",
            "nombre": "Cantante"
        }, {
            "prop": "teclista",
            "nombre": "Teclista"
        }, {
            "prop": "bajista",
            "nombre": "Bajista"
        }, {
            "prop": "guitarrista",
            "nombre": "Guitarrista"
        }];
        let respuesta = swig.renderFile('views/autores-agregar.html', {roles: roles});
        res.send(respuesta);
    });

    app.post("/autor", function (req, res) {
        let respuesta = "Autor agregado: <br>";
        if (typeof (req.body.nombreAutor) != "undefined")
            respuesta += "Nombre: " + req.body.nombreAutor + "<br>";
        else
            respuesta += "Nombre no enviado en la petición <br>";
        if (typeof (req.body.grupo) != "undefined")
            respuesta += "Grupo: " + req.body.grupo + "<br>";
        else
            respuesta += "Grupo no enviado en la petición <br>";
        if (typeof (req.body.rol) != "undefined")
            respuesta += "Rol: " + req.body.rol + "<br>";
        else
            respuesta += "Rol no enviado en la petición <br>";
        res.send(respuesta);
    });

    app.get("/autores", function (req, res) {
        let autores = [{
            "nombre": "Amaia Montero",
            "grupo": "La Oreja de Van Gogh",
            "rol": "Cantante"
        }, {
            "nombre": "Xabi San Martín",
            "grupo": "La Oreja de Van Gogh",
            "rol": "Teclista"
        }, {
            "nombre": "Billie Joe Armstrong",
            "grupo": "Green Day",
            "rol": "Cantante"
        }, {
            "nombre": "Mike Dirnt",
            "grupo": "Green Day",
            "rol": "Bajista"
        }];
        let respuesta = swig.renderFile('views/autores.html', {
            //vendedor: 'Tienda de canciones',
            autores: autores
        });
        res.send(respuesta);
    });

    app.get('/autores(/*)?', function (req, res) {
        res.redirect("/autores");
    })
};