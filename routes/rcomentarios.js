module.exports = function (app, swig, gestorBD) {
    app.post("/comentarios/:cancion_id", function (req, res) {
        //console.log(req.params.cancion_id);
        let comentario = {
            texto: req.body.texto,
            cancion_id: gestorBD.mongo.ObjectId(req.params.cancion_id), autor: req.session.usuario
        } // Conectarse
        gestorBD.insertarComentario(comentario, function (cancion_id) {
            if (cancion_id == null) {
                res.send("Error al comentar");
            } else {
                res.send("Agregado");
            }
        });
    });
};