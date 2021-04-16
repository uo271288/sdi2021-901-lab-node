module.exports = function (app, swig, gestorBD) {
    app.get("/canciones", function (req, res) {
        let canciones = [{
            "nombre": "Blank space",
            "precio": "1.2"
        }, {
            "nombre": "See you again",
            "precio": "1.3"
        }, {
            "nombre": "Uptown Funk",
            "precio": "1.1"
        }];
        let respuesta = swig.renderFile('views/btienda.html', {
            vendedor: 'Tienda de canciones',
            canciones: canciones
        });
        res.send(respuesta);
    });

    app.post("/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre, genero: req.body.genero,
            precio: req.body.precio, autor: req.session.usuario
        } // Conectarse
        gestorBD.insertarCancion(cancion, function (id) {
            if (id == null) {
                let respuesta = swig.renderFile('views/error.html', {
                    error: "Error al insertar canción"
                });
                res.send(respuesta);
            } else {
                if (req.files.portada != null) {
                    var imagen = req.files.portada;
                    imagen.mv('public/portadas/' + id + '.png', function (err) {
                        if (err) {
                            let respuesta = swig.renderFile('views/error.html', {
                                error: "Error al subir la portada"
                            });
                            res.send(respuesta);
                        } else {
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv('public/audios/' + id + '.mp3', function (err) {
                                    if (err) {
                                        let respuesta = swig.renderFile('views/error.html', {
                                            error: "Error al subir el audio"
                                        });
                                        res.send(respuesta);
                                    } else {
                                        res.redirect("/publicaciones");
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    app.get('/canciones/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregar.html', {});
        res.send(respuesta);
    });

    app.get("/tienda", function (req, res) {
            let criterio = {};
            if (req.query.busqueda != null) {
                criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
            }

            let pg = parseInt(req.query.pg); // Es String !!!
            if (req.query.pg == null) { // Puede no venir el param
                pg = 1;
            }
            gestorBD.obtenerCancionesPg(criterio, pg, function (canciones, total) {
                if (canciones == null) {
                    let respuesta = swig.renderFile('views/error.html', {
                        error: "Error al listar"
                    });
                    res.send(respuesta);
                } else {
                    let ultimaPg = total / 4;
                    if (total % 4 > 0) { // Sobran decimales
                        ultimaPg = ultimaPg + 1;
                    }
                    let paginas = []; // paginas mostrar
                    for (let i = pg - 2; i <= pg + 2; i++) {
                        if (i > 0 && i <= ultimaPg) {
                            paginas.push(i);
                        }
                    }
                    let respuesta = swig.renderFile('views/btienda.html', {
                        canciones: canciones,
                        paginas: paginas,
                        actual: pg
                    });
                    res.send(respuesta);
                }
            });

            /*
            gestorBD.obtenerCanciones(criterio, function (canciones) {
                if (canciones == null) {
                    res.send("Error al listar ");
                } else {
                    let respuesta = swig.renderFile('views/btienda.html',
                        {
                            canciones: canciones
                        });
                    res.send(respuesta);
                }
            });*/
        }
    );

    app.get('/cancion/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                let respuesta = swig.renderFile('views/error.html', {
                    error: "Error al recuperar la canción"
                });
                res.send(respuesta);
            } else {
                let criterioComentario = {"cancion_id": gestorBD.mongo.ObjectID(req.params.id)};
                let criterioCompra = {"cancionId": gestorBD.mongo.ObjectID(req.params.id)};
                let comprado = false;
                gestorBD.obtenerComentarios(criterioComentario, function (comentarios) {
                    gestorBD.obtenerCompras(criterioCompra, function (compras) {
                        if (canciones[0].autor == req.session.usuario || (compras.length > 0 && compras[0].usuario == req.session.usuario))
                            comprado = true
                        if (comentarios == null) {
                            let configuracion = {
                                url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                                method: "get",
                                headers: {"token": "ejemplo",}
                            }
                            let rest = app.get("rest");
                            rest(configuracion, function (error, response, body) {
                                console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                                let objetoRespuesta = JSON.parse(body);
                                let cambioUSD = objetoRespuesta.rates.EURUSD.rate; // nuevo campo "usd"
                                canciones[0].usd = cambioUSD * canciones[0].precio;
                                let respuesta = swig.renderFile('views/bcancion.html',
                                    {
                                        comprado: comprado,
                                        cancion: canciones[0]
                                    });
                                res.send(respuesta);
                            })
                        } else {
                            let configuracion = {
                                url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                                method: "get",
                                headers: {"token": "ejemplo",}
                            }
                            let rest = app.get("rest");
                            rest(configuracion, function (error, response, body) {
                                console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                                let objetoRespuesta = JSON.parse(body);
                                let cambioUSD = objetoRespuesta.rates.EURUSD.rate; // nuevo campo "usd"
                                canciones[0].usd = (cambioUSD * canciones[0].precio).toFixed(2);
                                let respuesta = swig.renderFile('views/bcancion.html',
                                    {
                                        comprado: comprado,
                                        cancion: canciones[0],
                                        comentarios: comentarios
                                    });
                                res.send(respuesta);
                            })

                        }
                    })

                });
            }
        });
    });

    app.get("/publicaciones", function (req, res) {
        let criterio = {autor: req.session.usuario};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                let respuesta = swig.renderFile('views/error.html', {
                    error: "Error al listar"
                });
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bpublicaciones.html',
                    {
                        canciones: canciones
                    });
                res.send(respuesta);
            }
        });
    });

    app.get('/cancion/modificar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bcancionModificar.html',
                    {
                        cancion: canciones[0]
                    });
                res.send(respuesta);
            }
        });
    });

    app.post('/cancion/modificar/:id', function (req, res) {
        let id = req.params.id;
        let criterio = {"_id": gestorBD.mongo.ObjectID(id)};
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio
        }
        gestorBD.modificarCancion(criterio, cancion, function (result) {
            if (result == null) {
                let respuesta = swig.renderFile('views/error.html', {
                    error: "Error al modificar"
                });
                res.send(respuesta);
            } else {
                paso1ModificarPortada(req.files, id, function (result) {
                    if (result == null) {
                        let respuesta = swig.renderFile('views/error.html', {
                            error: "Error en la modificación"
                        });
                        res.send(respuesta);
                    } else {
                        res.redirect("/publicaciones");
                    }
                });
            }
        });
    });

    app.get('/cancion/comprar/:id', function (req, res) {
        let cancionId = gestorBD.mongo.ObjectID(req.params.id);
        let compra = {
            usuario: req.session.usuario,
            cancionId: cancionId
        }
        gestorBD.insertarCompra(compra, function (idCompra) {
            if (idCompra == null) {
                res.send(respuesta);
            } else {
                res.redirect("/compras");
            }
        });
    });

    function paso1ModificarPortada(files, id, callback) {
        if (files && files.portada != null) {
            let imagen = files.portada;
            imagen.mv('public/portadas/' + id + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    paso2ModificarAudio(files, id, callback); // SIGUIENTE
                }
            });
        } else {
            paso2ModificarAudio(files, id, callback); // SIGUIENTE
        }
    };

    function paso2ModificarAudio(files, id, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv('public/audios/' + id + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    app.get('/cancion/eliminar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarCancion(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                res.redirect("/publicaciones");
            }
        });
    });

    app.get('/compras', function (req, res) {
        let criterio = {"usuario": req.session.usuario};
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null) {
                let respuesta = swig.renderFile('views/error.html', {
                    error: "Error al listar"
                });
                res.send(respuesta);
            } else {
                let cancionesCompradasIds = [];
                for (i = 0; i < compras.length; i++) {
                    cancionesCompradasIds.push(compras[i].cancionId);
                }
                let criterio = {"_id": {$in: cancionesCompradasIds}}
                gestorBD.obtenerCanciones(criterio, function (canciones) {
                    let respuesta = swig.renderFile('views/bcompras.html', {
                        canciones: canciones
                    });
                    res.send(respuesta);
                });
            }
        });
    });
};
