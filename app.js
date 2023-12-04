const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MySQLAdapter = require('@bot-whatsapp/database/mysql');
const mysql = require('mysql2/promise');

/**
 * Declaramos las conexiones de MySQL
 */
const MYSQL_DB_HOST = 'localhost';
const MYSQL_DB_USER = 'root';
const MYSQL_DB_PASSWORD = '';
const MYSQL_DB_NAME = 'clinica';
const MYSQL_DB_PORT = '3306';

// Declarar adapterDB en un ámbito más amplio
let adapterDB;

async function obtenerDoctoresPorEspecialidad(especialidad) {
    try {
        // Realiza la consulta a la base de datos para obtener los doctores de la especialidad dada
        const query = `SELECT nombre FROM doctores WHERE especialidad = ?`;
        const resultado = await adapterDB.query(query, [especialidad]);

        // Devuelve solo los nombres de los doctores
        return resultado.map(doctor => doctor.nombre);
    } catch (error) {
        // Manejar el error aquí, puedes imprimirlo o hacer lo que sea necesario
        console.error('Error al obtener doctores:', error);
        throw error; // Lanzar el error nuevamente para que se maneje en el contexto que llamó a esta función
    }
}

const flowSeleccionarDoctor = addKeyword(['nefrologia', 'Nefrologia'])
.addAnswer(
    `tenemos los siguientes doctores disponibles:`,
    null,
    async (context, { flowDynamic }) => {
        try {
          // Realiza la consulta a la base de datos para obtener los doctores de la especialidad de nefrología.
          const doctoresDisponibles = await adapterDB.query(
            'SELECT * FROM doctores WHERE especialidad = ?',
            ['nefrologia']
          );
      
          // Verifica si hay doctores disponibles.
          if (doctoresDisponibles.length === 0) {
            context.send('Lo siento, no hay doctores disponibles en la especialidad de nefrología en este momento.');
            return;
          }
      
          // Construye un mensaje con la lista de doctores disponibles.
          const mensajeDoctores = doctoresDisponibles.map((doctor) => `${doctor.id}. ${doctor.nombre}`).join('\n');
        } catch (error) {
            console.error('Error al obtener los doctores de nefrología:', error);
            context.send('Lo siento, ha ocurrido un error al obtener la información. Por favor, inténtalo de nuevo más tarde.');
          }
    }
    
)
    /*async (_, { flowDynamic }) => {
     * const dayNumber = getDay(new Date());
      *const getMenu = await googelSheet.retriveDayMenu(dayNumber);
     * for (const menu of getMenu) {
        *GLOBAL_STATE.push(menu);
        await flowDynamic(menu);
    *  }
    }*/
  

const flowCita = addKeyword(['cita', 'citas'])
    .addAnswer('Perfecto, ¿en qué área necesitas una cita?')
    .addAnswer(['nefrologia', 'urologia', 'medicina-interna']);

const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'hi', 'hello', 'hey', 'buenas', 'saludos', 'salu2', 'holi', 'holis', 'holas'])
    .addAnswer('🌟 Hola bienvenido a la *CLINICA DEL RIÑON* Tu salud renal es nuestra prioridad.')
    .addAnswer(
        [
            '¡Reserva tu cita hoy!',
            '👉 *Cita* para programar una consulta',
        ],
        null,
        null,
        [flowCita]
    );

const main = async () => {
    adapterDB = new MySQLAdapter({
        host: MYSQL_DB_HOST,
        user: MYSQL_DB_USER,
        database: MYSQL_DB_NAME,
        password: MYSQL_DB_PASSWORD,
        port: MYSQL_DB_PORT,
    });

    const adapterFlow = createFlow([
        flowPrincipal,
        flowCita,
        flowSeleccionarDoctor,
    ]);

    const adapterProvider = createProvider(BaileysProvider);
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
    QRPortalWeb();
};

main();
