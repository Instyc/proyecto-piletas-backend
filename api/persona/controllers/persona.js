'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
//module.exports = {}

/*
    Clave 0: (error) Se quiere reservar un día anterior al actual.
    Clave 1: (success) Turno creado exitosamente.
    Clave 2: (error) No hay lugares disponibles para reservar un turno.
    Clave 3: (error) El DNI ya está en el sistema.
    Clave 4: (warning) Tiene que esperar todavía para realizar otro turno.
    Clave 5: (info) Tiene un turno activo.
    Clave 6: (error) El DNI no se encuentra en el sistema.
    Clave 7: (warning) No canceló su turno y no fue.
*/

module.exports = {
    async pileta_crear(ctx) { 
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni, published_at_null:false });

        if(new Date(data.turno.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo: "error", clave: 0}
        }
        
        if(!personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let turno_tipo = data.persona.domicilio===null?1:0
            let cantidad = await strapi.query('turno').count({ fecha: data.turno.fecha, tipo: turno_tipo, published_at_null:false });
            let disponibles = turno_tipo===0?150-cantidad:50-cantidad;

            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                const respuestaPersona = await strapi.query('persona').create(data.persona);
                const respuestaTurno = await strapi.query('turno').create({...data.turno, persona: respuestaPersona.id, tipo: turno_tipo});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.turno }), tipo: "success", clave: 1};
            }else{
                return {mensaje:"No hay lugares disponibles para la fecha ingresada y la localidad declarada.", tipo:"error" , disponibles, clave: 2}
            }
        }else{
            return {mensaje:'El DNI ingresado ya está cargado en el sistema. Por favor, seleccione la opción "Ya he realizado una reserva alguna vez".', tipo:"error", clave: 3}
        }
    },

    async pileta_creada(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        console.log(data)
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni, published_at_null:false });
        let turno_tipo = personaEncontrada.domicilio===null?1:0

        if(new Date(data.turno.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"error", clave: 0}
        }

        if(personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('turno').count({ fecha: data.turno.fecha, tipo: turno_tipo, published_at_null:false });
            let disponibles = turno_tipo===0?150-cantidad:50-cantidad;
            
            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                if(personaEncontrada.turnos.length!==0){
                    let ultTurno = new Date(personaEncontrada.turnos[personaEncontrada.turnos.length-1].fecha+" 23:59:59");
                    let unDiaDespues = Date.parse(ultTurno) + 1000*60*60*24 //24 horas a milisegundos

                    if(unDiaDespues>Date.now()){
                        if(ultTurno<Date.now()){
                            let dosDias = Date.parse(ultTurno) + 1000*60*60*36 //36 horas a milisegundos
                            let permitido = new Date(dosDias)
                            let mensaje = "Debido a su último turno expedido, puede volver a realizar una reserva el día "+permitido.getDate()+"/"+(permitido.getMonth()+1)+"/"+permitido.getFullYear();
                            return {mensaje: mensaje, tipo:"warning", clave: 4}
                        }else{
                            let dia = ultTurno.getDate()
                            let mes = ultTurno.getMonth() + 1
                            let anio = ultTurno.getFullYear()

                            if(mes < 10)
                                mes = "0"+mes
                            if (dia <10)
                                dia = "0"+dia
                            let mensaje = "Usted tiene un turno activo para la fecha "+dia+"-"+mes+"-"+anio+". Si desea cancelarlo, comuníquese al correo complejodeportivosb@gmail.com.ar.";  
                            return {mensaje: mensaje, tipo:"info", clave: 5}
                        }
                    }else{
                        let cincoDiasDespues = Date.parse(ultTurno) + 1000*60*60*24*5 
                        if(cincoDiasDespues>Date.now()){
                            if(!personaEncontrada.turnos[personaEncontrada.turnos.length-1].asistencia){
                                let seisDias = Date.parse(ultTurno) + 1000*60*60*24*6
                                let permitido = new Date(seisDias)
                                let mensaje = "Debido a que no asistió a su último turno reservado, podrá volver a realizar una reserva el día "+permitido.getDate()+"/"+(permitido.getMonth()+1)+"/"+permitido.getFullYear();
                                return {mensaje: mensaje, tipo:"warning", clave: 7}
                            }
                        }
                    }
                }
                
                const respuestaTurno = await strapi.query('turno').create({...data.turno, persona: personaEncontrada.id, tipo: turno_tipo});
                return {mensaje:"El turno se ha creado con éxito.", data: sanitizeEntity(respuestaTurno, { model: strapi.models.turno }), tipo:"success", clave: 1};
            }else{
                return {mensaje:"No hay lugares disponibles para la fecha ingresada y la localidad declarada.", tipo:"error", disponibles, clave: 2}
            }
        }else{
            return {mensaje:"El DNI ingresado no se encuentra registrado. Por favor, ingrese todos sus datos.", tipo:"error", clave: 6} 
        }
    },

    async deporte_crear(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni, published_at_null:false });
        
        if(new Date(data.deporte.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"warning", clave: 0}
        }

        if(!personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('deporte').count({ fecha: data.deporte.fecha , tipo: data.deporte.tipo, horario: data.deporte.horario, published_at_null:false });
            let disponibles = 2-cantidad;

            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){
                const personaCreada = await strapi.query('persona').create(data.persona);

                let resp = await asignarGrupo(data.personas)

                const respuestaTurno = await strapi.query('deporte').create({...data.deporte, personas: [personaCreada.id, ...resp]});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.deporte }), tipo:"success", clave: 1}
            }else{
                return {mensaje:"No hay lugares disponibles para la fecha ingresada.", tipo:"error", disponibles, clave: 2}
            }
        }else{
            return {mensaje:'El DNI ingresado ya está cargado en el sistema. Por favor, seleccione la opción "Ya he realizado una reserva alguna vez".', tipo:"info", clave: 3}
        }
    },
    async deporte_creada(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.persona.dni, published_at_null:false });

        if(new Date(data.deporte.fecha+" 23:59:59")<Date.now()){
            return {mensaje: "No puede reservar un turno para un día anterior a hoy.", tipo:"warning", clave: 0}
        }

        if(personaEncontrada){
            //Vemos si hay turnos disponibles para la fecha
            let cantidad = await strapi.query('deporte').count({ fecha: data.deporte.fecha , tipo: data.deporte.tipo, horario: data.deporte.horario, published_at_null:false });
            let disponibles = 2-cantidad;
            
            //Si disponible < 1, no hay turnos disponibles para la fecha elegida
            if(disponibles>0){  
                //Si no se cumple el siguiente if, significa que la persona ya esta registrada (lo hizo por turno de pileta)
                if(personaEncontrada.deportes.length!==0){
                    let ultTurno = new Date(personaEncontrada.deportes[personaEncontrada.deportes.length-1].fecha+" 23:59:59");
                    let unDiaDespues = Date.parse(ultTurno) + 1000*60*60*24 //24 horas a milisegundos
                    let dosDias = Date.parse(ultTurno) + 1000*60*60*36 //36 horas a milisegundos
                    
                    if(unDiaDespues>Date.now()){
                        if(ultTurno<Date.now()){
                            let permitido = new Date(dosDias)
                            let mensaje = "Debido a su último turno expedido, puede volver a realizar una reserva el día "+permitido.getDate()+"/"+(permitido.getMonth()+1)+"/"+permitido.getFullYear();
                            return {mensaje: mensaje, tipo:"warning", clave: 4}
                        }else{
                            let dia = ultTurno.getDate()
                            let mes = ultTurno.getMonth() + 1
                            let anio = ultTurno.getFullYear()

                            if(mes < 10)
                                mes = "0"+mes
                            if (dia <10)
                                dia = "0"+dia
                            let mensaje = "Usted tiene un turno activo para la fecha "+dia+"-"+mes+"-"+anio+". Si desea cancelarlo, comuníquese al correo complejodeportivosb@gmail.com.ar.";  
                            return {mensaje: mensaje, tipo:"info", clave: 5}
                        }
                    }
                }

                let resp = await asignarGrupo(data.personas)

                const respuestaTurno = await strapi.query('deporte').create({...data.deporte, personas: [personaEncontrada.id, ...resp]});
                return {mensaje:"El turno se ha creado con éxito.",data: sanitizeEntity(respuestaTurno, { model: strapi.models.deporte }), tipo:"success", clave: 1}
            }else{
                return {mensaje:"No hay lugares disponibles para la fecha ingresada.", tipo:"error", disponibles, clave: 2}
            }
        }else{
            return {mensaje:"El DNI ingresado no se encuentra registrado. Por favor, ingrese todos sus datos.", tipo:"error", clave: 6}
        }
    },
    async obtener_persona(ctx) {
        //Información que es pasada como JSON
        let data = ctx.request.body;
        console.log(data)
        let personaEncontrada = await strapi.query('persona').findOne({  dni: data.dni, published_at_null:false });
        
        return sanitizeEntity(personaEncontrada, { model: strapi.models.persona })
    },
};

async function asignarGrupo(personas){
    let resp = await Promise.all(personas.map(async (p)=>{
        let existeP = await strapi.query('persona').findOne({ dni: p.dni, published_at_null:false });
        if(existeP){
            return existeP.id
        }else{
            let pCreada = await strapi.query('persona').create(p);
            return pCreada.id
        }
    }))
    return resp
}