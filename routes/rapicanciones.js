module.exports = function (app, gestorBD) {
    app.get("/api/cancion", function (req, res) {
        gestorBD.obtenerCanciones({}, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones));
            }
        });
    });

    app.get("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones[0]));
            }
        });
    });

    app.delete("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            console.log(criterio);
            console.log(canciones);
            if (canciones != null && canciones[0].autor != res.usuario) {
                res.status(500);
                res.json({error: "No puedes eliminar una canción que no es tuya"})
            } else {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        res.json({error: "se ha producido un error"})
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            }
        });
    });

    app.post("/api/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
        }
        if (req.body.nombre == null || req.body.genero == null || req.body.precio == null) {
            res.status(500);
            res.json({error: "se ha producido un error"})
        } else
            gestorBD.insertarCancion(cancion, function (id) {
                if (id == null) {
                    res.status(500);
                    res.json({error: "se ha producido un error"})
                } else {
                    res.status(201);
                    res.json({mensaje: "canción insertada", _id: id})
                }
            });
    });

    app.put("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        let cancion = {}; // Solo los atributos a modificar
        if (req.body.nombre != null) cancion.nombre = req.body.nombre;
        if (req.body.genero != null) cancion.genero = req.body.genero;
        if (req.body.precio != null) cancion.precio = req.body.precio;
        if (req.body.precio < 0 || req.body.nombre.length < 5 || req.body.nombre.length > 25) {
            res.status(500);
            res.json({error: "se ha producido un error"})
        } else {
            gestorBD.obtenerCanciones(criterio, function (canciones) {
                console.log(criterio);
                console.log(canciones);
                if (canciones != null && canciones[0].autor != res.usuario) {
                    res.status(500);
                    res.json({error: "No puedes modificar una canción que no es tuya"})
                } else {
                    gestorBD.modificarCancion(criterio, cancion, function (result) {
                        if (result == null) {
                            res.status(500);
                            res.json({error: "se ha producido un error"})
                        } else {
                            res.status(200);
                            res.json({mensaje: "canción modificada", _id: req.params.id})
                        }
                    });
                }
            })
        }
    });

    app.post("/api/autenticar/", function (req, res) {
        let seguro = app.get("crypto")
            .createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401); //Unauthorized
                res.json({autenticado: false})
            } else {
                let token = app.get('jwt').sign({usuario: criterio.email, tiempo: Date.now() / 1000}, "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                })
            }
        })
    });
}