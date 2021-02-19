'use strict';
//const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
module.exports = {}
/*module.exports = {
    async pileta_crear(ctx) { 
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni });

        if(new Date(data.turno.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"error"}
        }
        
        if(!personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('turno').count({ fecha: data.turno.fecha });
            let disponibles = 100-cantidad;

            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                const respuestaPersona = await strapi.query('persona').create(data.persona);
                const respuestaTurno = await strapi.query('turno').create({...data.turno, persona: respuestaPersona.id});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.turno }), tipo:"success"};
            }else{
                return {mensaje:"No hay turnos disponibles para la fecha ingresada.", tipo:"error" ,disponibles}
            }
        }else{
            return {mensaje:'El DNI ingresado ya ha está cargado en el sistema, por favor, seleccione la opción "Ya he realizado una reserva alguna vez".', tipo:"error"}
        }
    },

    async pileta_creada(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        console.log(data)
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni });
        
        if(new Date(data.turno.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"error"}
        }

        if(personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('turno').count({ fecha: data.turno.fecha });
            let disponibles = 100-cantidad;
            
            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                if(personaEncontrada.turnos.length!==0){
                    let ultTurno = new Date(personaEncontrada.turnos[personaEncontrada.turnos.length-1].fecha+" 0:0:0");
                    let unDiaDespues = Date.parse(ultTurno) + 1000*60*60*24 //24 horas a milisegundos
                    let dosDias = Date.parse(ultTurno) + 1000*60*60*36 //36 horas a milisegundos
                    
                    if(unDiaDespues>Date.now()){
                        if(ultTurno<Date.now()){
                            let permitido = new Date(dosDias)
                            let mensaje = "Debido a su último turno expedido, puede volver a realizar una reserva el día "+permitido.getDate()+"/"+(permitido.getMonth()+1)+"/"+permitido.getFullYear();
                            return {mensaje: mensaje, tipo:"warning"}
                        }else{
                            let dia = ultTurno.getDate()
                            let mes = ultTurno.getMonth() + 1
                            let anio = ultTurno.getFullYear()

                            if(mes < 10)
                                mes = "0"+mes
                            if (dia <10)
                                dia = "0"+dia
                            let mensaje = "Usted tiene un turno activo para la fecha "+dia+"-"+mes+"-"+anio+". Si desea cancelarlo, comuníquese al correo complejodeportivosb@gmail.com.ar.";  
                            return {mensaje: mensaje, tipo:"info"}
                        }
                    }
                }

                const respuestaTurno = await strapi.query('turno').create({...data.turno, persona: personaEncontrada.id});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.turno }), tipo:"success"};
            }else{
                return {mensaje:"No hay lugares disponibles disponibles", tipo:"error",disponibles}
            }
        }else{
            return {mensaje:"El DNI ingresado no se encuentra registrado, por favor ingrese sus datos.", tipo:"error"} 
        }
    },

    async deporte_crear(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni });
        
        if(new Date(data.deporte.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"warning"}
        }

        if(!personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('deporte').count({ fecha: data.deporte.fecha , tipo: data.deporte.tipo, horario: data.deporte.horario });
            let disponibles = 2-cantidad;

            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                const personaCreada = await strapi.query('persona').create(data.persona);

                let resp = await asignarGrupo(data.personas)

                const respuestaTurno = await strapi.query('deporte').create({...data.deporte, personas: [personaCreada.id, ...resp]});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.deporte }), tipo:"success"}
            }else{
                return {mensaje:"No hay turnos disponibles para la fecha ingresada.", tipo:"error", disponibles}
            }
        }else{
            return {mensaje:'El DNI ingresado ya ha está cargado en el sistema, por favor, seleccione la opción "Ya he realizado una reserva alguna vez".', tipo:"info"}
        }
    },
    async deporte_creada(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni });

        if(new Date(data.deporte.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"warning"}
        }

        if(personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('deporte').count({ fecha: data.deporte.fecha , tipo: data.deporte.tipo, horario: data.deporte.horario });
            let disponibles = 2-cantidad;
            
            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){  
                //Si no se cumple el siguiente if, significa que la persona ya esta registrada (lo hizo por turno de pileta)
                if(personaEncontrada.deportes.length!==0){
                    let ultTurno = new Date(personaEncontrada.deportes[personaEncontrada.deportes.length-1].fecha+" 0:0:0");
                    let unDiaDespues = Date.parse(ultTurno) + 1000*60*60*24 //24 horas a milisegundos
                    let dosDias = Date.parse(ultTurno) + 1000*60*60*36 //36 horas a milisegundos
                    
                    if(unDiaDespues>Date.now()){
                        if(ultTurno<Date.now()){
                            let permitido = new Date(dosDias)
                            let mensaje = "Debido a su último turno expedido, puede volver a realizar una reserva el día "+permitido.getDate()+"/"+(permitido.getMonth()+1)+"/"+permitido.getFullYear();
                            return {mensaje: mensaje, tipo:"warning"}
                        }else{
                            let dia = ultTurno.getDate()
                            let mes = ultTurno.getMonth() + 1
                            let anio = ultTurno.getFullYear()

                            if(mes < 10)
                                mes = "0"+mes
                            if (dia <10)
                                dia = "0"+dia
                            let mensaje = "Usted tiene un turno activo para la fecha "+dia+"-"+mes+"-"+anio+". Si desea cancelarlo, comuníquese al correo complejodeportivosb@gmail.com.ar.";  
                            return {mensaje: mensaje, tipo:"info"}
                        }
                    }
                }

                let resp = await asignarGrupo(data.personas)

                const respuestaTurno = await strapi.query('deporte').create({...data.deporte, personas: [personaEncontrada.id, ...resp]});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.deporte }), tipo:"success"}
            }else{
                return {mensaje:"No hay lugares disponibles disponibles", tipo:"error",disponibles}
            }
        }else{
            return {mensaje:"El DNI ingresado no se encuentra registrado, por favor ingrese sus datos.", tipo:"error"}
        }
    },
    async obtener_persona(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        console.log(data)
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.dni });
        
        return sanitizeEntity(personaEncontrada, { model: strapi.models.persona })
    },
};

async function asignarGrupo(personas){
    let resp = await Promise.all(personas.map(async (p)=>{
        let existeP = await strapi.query('persona').findOne({ dni: p.dni });
        if(existeP){
            return existeP.id
        }else{
            let pCreada = await strapi.query('persona').create(p);
            return pCreada.id
        }
    }))
    return resp
}*/