const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Cargar asociaciones
require('../config/associations');

// Importar modelos
const Paciente = require('../models/Paciente');
const Apache2 = require('../models/Apache2');
const NAS = require('../models/NAS');
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const ProcedimientoMedicina = require('../models/ProcedimientoMedicina');
const ProcedimientoAuxiliar = require('../models/ProcedimientoAuxiliar');
const RegistroProcedimientosTENS = require('../models/RegistroProcedimientosTENS');
const RegistroProcedimientos = require('../models/RegistroProcedimientos');
const ProcedimientoRegistro = require('../models/ProcedimientoRegistro');

// Middleware para validar token JWT
const authenticateToken = require('../middleware/auth');

// ========== ESTADÍSTICAS UTI ==========

// GET /api/estadisticas/uti - Obtener estadísticas generales de UTI
router.get('/uti', authenticateToken, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Construir filtros de fecha si se proporcionan
    const whereFecha = {};
    if (fechaInicio && fechaFin) {
      whereFecha.fechaIngresoUTI = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }

    // 1. MÉTRICAS DE OCUPACIÓN
    const pacientesActivos = await Paciente.findAll({
      where: {
        ...whereFecha,
        fechaEgresoUTI: null // Solo pacientes que aún están en UTI
      },
      attributes: ['id', 'nombreCompleto', 'rut', 'camaAsignada', 'fechaIngresoUTI']
    });

    const totalCamas = 27;
    const camasOcupadas = pacientesActivos.length;
    const tasaOcupacion = (camasOcupadas / totalCamas) * 100;

    // Determinar nivel de ocupación
    let nivelOcupacion = 'normal';
    if (tasaOcupacion >= 95) nivelOcupacion = 'critico';
    else if (tasaOcupacion >= 85) nivelOcupacion = 'alto';

    // 2. MÉTRICAS DE SEVERIDAD
    // Apache II de pacientes activos
    const apache2Activos = await Apache2.findAll({
      include: [{
        model: Paciente,
        where: { fechaEgresoUTI: null },
        attributes: ['rut']
      }],
      attributes: ['puntajeTotal', 'nivelRiesgo', 'fechaEvaluacion']
    });

    const apachePromedio = apache2Activos.length > 0 
      ? apache2Activos.reduce((sum, a) => sum + a.puntajeTotal, 0) / apache2Activos.length 
      : 0;

    // Distribución Apache II
    const distribucionApache = {
      bajo: apache2Activos.filter(a => a.puntajeTotal <= 9).length,
      moderado: apache2Activos.filter(a => a.puntajeTotal > 9 && a.puntajeTotal <= 19).length,
      alto: apache2Activos.filter(a => a.puntajeTotal > 19).length
    };

    // NAS de pacientes activos
    const nasActivos = await NAS.findAll({
      where: {
        pacienteRut: { [Op.in]: pacientesActivos.map(p => p.rut) }
      },
      attributes: ['puntuacionTotal', 'fechaRegistro']
    });

    const nasPromedio = nasActivos.length > 0 
      ? nasActivos.reduce((sum, n) => sum + n.puntuacionTotal, 0) / nasActivos.length 
      : 0;

    // Distribución NAS
    const distribucionNAS = {
      baja: nasActivos.filter(n => n.puntuacionTotal < 40).length,
      moderada: nasActivos.filter(n => n.puntuacionTotal >= 40 && n.puntuacionTotal < 60).length,
      alta: nasActivos.filter(n => n.puntuacionTotal >= 60).length
    };

    // Pacientes críticos de kinesiología
    const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
    const categorizacionesKinesiologia = await CategorizacionKinesiologia.findAll({
      where: {
        pacienteRut: { [Op.in]: pacientesActivos.map(p => p.rut) }
      },
      attributes: ['complejidad', 'puntajeTotal', 'fechaCategorizacion'],
      order: [['fechaCategorizacion', 'DESC']]
    });

    // Obtener la última categorización por paciente
    const ultimasCategorizaciones = {};
    categorizacionesKinesiologia.forEach(cat => {
      if (!ultimasCategorizaciones[cat.pacienteRut] || 
          new Date(cat.fechaCategorizacion) > new Date(ultimasCategorizaciones[cat.pacienteRut].fechaCategorizacion)) {
        ultimasCategorizaciones[cat.pacienteRut] = cat;
      }
    });

    const distribucionKinesiologia = {
      baja: Object.values(ultimasCategorizaciones).filter(cat => cat.complejidad === 'Baja').length,
      mediana: Object.values(ultimasCategorizaciones).filter(cat => cat.complejidad === 'Mediana').length,
      alta: Object.values(ultimasCategorizaciones).filter(cat => cat.complejidad === 'Alta').length
    };

    // Pacientes críticos (Apache > 20 o NAS > 60)
    const pacientesCriticos = apache2Activos.filter(a => a.puntajeTotal > 20).length;

    // 3. MÉTRICAS DE TIEMPO POR ESTAMENTO
    const fechaHoy = new Date();
    const inicioMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1);
    const finMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 0);

    // Medicina
    const procedimientosMedicina = await ProcedimientoMedicina.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      attributes: ['tiempo', 'fecha', 'turno']
    });

    const tiempoMedicina = procedimientosMedicina.reduce((total, proc) => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      return total + (horas * 60 + minutos);
    }, 0);

    // Auxiliares
    const procedimientosAuxiliares = await ProcedimientoAuxiliar.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      attributes: ['tiempo', 'fecha', 'turno']
    });

    const tiempoAuxiliares = procedimientosAuxiliares.reduce((total, proc) => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      return total + (horas * 60 + minutos);
    }, 0);

    // TENS
    const registrosTENS = await RegistroProcedimientosTENS.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      attributes: ['tiempoTotal', 'fecha', 'turno']
    });

    const tiempoTENS = registrosTENS.reduce((total, reg) => total + reg.tiempoTotal, 0);

    // Kinesiología (tabla específica)
    const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
    const procedimientosKinesiologia = await ProcedimientoKinesiologia.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      attributes: ['tiempo', 'fecha', 'turno']
    });

    const tiempoKinesiologia = procedimientosKinesiologia.reduce((total, proc) => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      return total + (horas * 60 + minutos);
    }, 0);

    // Enfermería (basado en registros con turno Día/Noche - típicos de enfermería)
    const registrosEnfermeria = await RegistroProcedimientos.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        },
        turno: {
          [Op.in]: ['Día', 'Noche']
        }
      },
      attributes: ['tiempoTotal', 'fecha', 'turno']
    });

    const tiempoEnfermeria = registrosEnfermeria.reduce((total, reg) => total + reg.tiempoTotal, 0);

    // Obtener datos detallados de procedimientos para la tabla y ranking
    const procedimientosDetalle = await obtenerProcedimientosDetalle(inicioMes, finMes);
    const rankingProcedimientos = await obtenerRankingProcedimientos(inicioMes, finMes);

    const metricasTiempo = {
      medicina: {
        total: tiempoMedicina,
        promedio: procedimientosMedicina.length > 0 ? tiempoMedicina / procedimientosMedicina.length : 0
      },
      enfermeria: {
        total: tiempoEnfermeria,
        promedio: registrosEnfermeria.length > 0 ? tiempoEnfermeria / registrosEnfermeria.length : 0
      },
      kinesiologia: {
        total: tiempoKinesiologia,
        promedio: procedimientosKinesiologia.length > 0 ? tiempoKinesiologia / procedimientosKinesiologia.length : 0
      },
      tens: {
        total: tiempoTENS,
        promedio: registrosTENS.length > 0 ? tiempoTENS / registrosTENS.length : 0
      },
      auxiliares: {
        total: tiempoAuxiliares,
        promedio: procedimientosAuxiliares.length > 0 ? tiempoAuxiliares / procedimientosAuxiliares.length : 0
      }
    };

    // 4. TENDENCIAS (últimos 7 días)
    const fecha7DiasAtras = new Date();
    fecha7DiasAtras.setDate(fecha7DiasAtras.getDate() - 7);

    const tendencias = await calcularTendencias(fecha7DiasAtras, fechaHoy);


    res.json({
      success: true,
      data: {
        ocupacion: {
          camasOcupadas,
          totalCamas,
          tasaOcupacion: parseFloat(tasaOcupacion.toFixed(1)),
          nivel: nivelOcupacion
        },
        severidad: {
          apachePromedio: parseFloat(apachePromedio.toFixed(1)),
          nasPromedio: parseFloat(nasPromedio.toFixed(1)),
          pacientesCriticos,
          distribucionApache,
          distribucionNAS,
          distribucionKinesiologia
        },
        tiempo: metricasTiempo,
        tendencias,
        procedimientosDetalle,
        rankingProcedimientos
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas UTI:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas UTI',
      error: error.message
    });
  }
});

// Función auxiliar para calcular tendencias
async function calcularTendencias(fechaInicio, fechaFin) {
  const dias = [];
  const ocupacionDias = [];
  const tiempoDias = [];

  for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
    const fechaActual = new Date(d);
    
    // Ocupación del día
    const pacientesDia = await Paciente.count({
      where: {
        fechaIngresoUTI: { [Op.lte]: fechaActual },
        [Op.or]: [
          { fechaEgresoUTI: null },
          { fechaEgresoUTI: { [Op.gte]: fechaActual } }
        ]
      }
    });
    
    const ocupacionDia = (pacientesDia / 27) * 100;
    
    // Tiempo del día
    const tiempoDia = await RegistroProcedimientos.sum('tiempoTotal', {
      where: {
        fecha: fechaActual.toISOString().split('T')[0]
      }
    }) || 0;
    
    dias.push(fechaActual.toISOString().split('T')[0]);
    ocupacionDias.push(parseFloat(ocupacionDia.toFixed(1)));
    tiempoDias.push(tiempoDia);
  }

  return {
    ocupacion7dias: ocupacionDias,
    tiempo7dias: tiempoDias
  };
}

// ========== ESTADÍSTICAS POR ESTAMENTO ==========

// GET /api/estadisticas/estamento/:estamento - Obtener estadísticas por estamento
router.get('/estamento/:estamento', authenticateToken, async (req, res) => {
  try {
    const { estamento } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    
    if (!['medicina', 'enfermeria', 'kinesiologia', 'tens', 'auxiliares'].includes(estamento)) {
      return res.status(400).json({
        success: false,
        message: 'Estamento no válido'
      });
    }

    // Construir filtros de fecha
    const whereFecha = {};
    if (fechaInicio && fechaFin) {
      whereFecha.fecha = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }

    let estadisticas = {};

    switch (estamento) {
      case 'medicina':
        estadisticas = await obtenerEstadisticasMedicina(whereFecha);
        break;
      case 'enfermeria':
        estadisticas = await obtenerEstadisticasEnfermeria(whereFecha);
        break;
      case 'kinesiologia':
        estadisticas = await obtenerEstadisticasKinesiologia(whereFecha);
        break;
      case 'tens':
        estadisticas = await obtenerEstadisticasTENS(whereFecha);
        break;
      case 'auxiliares':
        estadisticas = await obtenerEstadisticasAuxiliares(whereFecha);
        break;
    }

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error(`Error al obtener estadísticas de ${req.params.estamento}:`, error);
    res.status(500).json({
      success: false,
      message: `Error al obtener estadísticas de ${req.params.estamento}`,
      error: error.message
    });
  }
});

// Funciones auxiliares para cada estamento
async function obtenerEstadisticasMedicina(whereFecha) {
  const procedimientos = await ProcedimientoMedicina.findAll({
    where: whereFecha,
    attributes: ['tiempo', 'fecha', 'turno', 'nombre']
  });

  const tiempoTotal = procedimientos.reduce((total, proc) => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    return total + (horas * 60 + minutos);
  }, 0);

  const procedimientosPorTurno = {
    '24 h': procedimientos.filter(p => p.turno === '24 h').length,
    '22 h': procedimientos.filter(p => p.turno === '22 h').length,
    '12 h': procedimientos.filter(p => p.turno === '12 h').length
  };

  return {
    totalProcedimientos: procedimientos.length,
    tiempoTotal,
    tiempoPromedio: procedimientos.length > 0 ? tiempoTotal / procedimientos.length : 0,
    procedimientosPorTurno,
    procedimientosMasFrecuentes: await obtenerProcedimientosMasFrecuentes(procedimientos)
  };
}

async function obtenerEstadisticasEnfermeria(whereFecha) {
  const nas = await NAS.findAll({
    where: {
      fechaRegistro: whereFecha.fecha || { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    attributes: ['puntuacionTotal', 'fechaRegistro']
  });

  const puntuacionPromedio = nas.length > 0 
    ? nas.reduce((sum, n) => sum + n.puntuacionTotal, 0) / nas.length 
    : 0;

  return {
    totalEvaluaciones: nas.length,
    puntuacionPromedio: parseFloat(puntuacionPromedio.toFixed(1)),
    distribucionCarga: {
      baja: nas.filter(n => n.puntuacionTotal < 40).length,
      moderada: nas.filter(n => n.puntuacionTotal >= 40 && n.puntuacionTotal < 60).length,
      alta: nas.filter(n => n.puntuacionTotal >= 60).length
    }
  };
}

async function obtenerEstadisticasKinesiologia(whereFecha) {
  const categorizaciones = await CategorizacionKinesiologia.findAll({
    where: {
      fechaCategorizacion: whereFecha.fecha || { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    attributes: ['puntajeTotal', 'complejidad', 'cargaAsistencial', 'fechaCategorizacion']
  });

  const puntajePromedio = categorizaciones.length > 0 
    ? categorizaciones.reduce((sum, c) => sum + c.puntajeTotal, 0) / categorizaciones.length 
    : 0;

  return {
    totalCategorizaciones: categorizaciones.length,
    puntajePromedio: parseFloat(puntajePromedio.toFixed(1)),
    distribucionComplejidad: {
      baja: categorizaciones.filter(c => c.complejidad === 'Baja').length,
      mediana: categorizaciones.filter(c => c.complejidad === 'Mediana').length,
      alta: categorizaciones.filter(c => c.complejidad === 'Alta').length
    }
  };
}

async function obtenerEstadisticasTENS(whereFecha) {
  const registros = await RegistroProcedimientosTENS.findAll({
    where: whereFecha,
    attributes: ['tiempoTotal', 'fecha', 'turno']
  });

  const tiempoTotal = registros.reduce((total, reg) => total + reg.tiempoTotal, 0);

  return {
    totalRegistros: registros.length,
    tiempoTotal,
    tiempoPromedio: registros.length > 0 ? tiempoTotal / registros.length : 0,
    distribucionPorTurno: {
      dia: registros.filter(r => r.turno === 'Día').length,
      noche: registros.filter(r => r.turno === 'Noche').length,
      '24h': registros.filter(r => r.turno === '24 h').length
    }
  };
}

async function obtenerEstadisticasAuxiliares(whereFecha) {
  const procedimientos = await ProcedimientoAuxiliar.findAll({
    where: whereFecha,
    attributes: ['tiempo', 'fecha', 'turno', 'nombre']
  });

  const tiempoTotal = procedimientos.reduce((total, proc) => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    return total + (horas * 60 + minutos);
  }, 0);

  return {
    totalProcedimientos: procedimientos.length,
    tiempoTotal,
    tiempoPromedio: procedimientos.length > 0 ? tiempoTotal / procedimientos.length : 0,
    procedimientosMasFrecuentes: await obtenerProcedimientosMasFrecuentes(procedimientos)
  };
}

async function obtenerProcedimientosMasFrecuentes(procedimientos) {
  const frecuencia = {};
  procedimientos.forEach(proc => {
    frecuencia[proc.nombre] = (frecuencia[proc.nombre] || 0) + 1;
  });

  return Object.entries(frecuencia)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));
}

module.exports = router;

// Función para obtener promedios de procedimientos por estamento
async function obtenerProcedimientosDetalle(fechaInicio, fechaFin) {
  const { Op } = require('sequelize');
  const ProcedimientoMedicina = require('../models/ProcedimientoMedicina');
  const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
  const ProcedimientoAuxiliar = require('../models/ProcedimientoAuxiliar');
  const RegistroProcedimientosTENS = require('../models/RegistroProcedimientosTENS');
  const RegistroProcedimientos = require('../models/RegistroProcedimientos');

  const promedios = [];

  // Medicina - calcular promedios por procedimiento
  const procedimientosMedicina = await ProcedimientoMedicina.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const medicinaStats = {};
  procedimientosMedicina.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!medicinaStats[proc.nombre]) {
      medicinaStats[proc.nombre] = { tiempos: [], estamento: 'Medicina' };
    }
    medicinaStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(medicinaStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    promedios.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // Kinesiología - calcular promedios por procedimiento
  const procedimientosKinesiologia = await ProcedimientoKinesiologia.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const kinesiologiaStats = {};
  procedimientosKinesiologia.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!kinesiologiaStats[proc.nombre]) {
      kinesiologiaStats[proc.nombre] = { tiempos: [], estamento: 'Kinesiología' };
    }
    kinesiologiaStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(kinesiologiaStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    promedios.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // Auxiliares - calcular promedios por procedimiento
  const procedimientosAuxiliares = await ProcedimientoAuxiliar.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const auxiliaresStats = {};
  procedimientosAuxiliares.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!auxiliaresStats[proc.nombre]) {
      auxiliaresStats[proc.nombre] = { tiempos: [], estamento: 'Auxiliares' };
    }
    auxiliaresStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(auxiliaresStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    promedios.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // TENS - calcular promedio general
  const registrosTENS = await RegistroProcedimientosTENS.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['tiempoTotal']
  });

  if (registrosTENS.length > 0) {
    const tiempoTotalTENS = registrosTENS.reduce((total, reg) => total + reg.tiempoTotal, 0);
    const promedioTENS = tiempoTotalTENS / registrosTENS.length;
    promedios.push({
      nombre: 'Registro TENS',
      estamento: 'TENS',
      tiempoPromedio: Math.round(promedioTENS * 10) / 10,
      cantidad: registrosTENS.length
    });
  }

  // Enfermería - calcular promedio general
  const registrosEnfermeria = await RegistroProcedimientos.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      },
      turno: {
        [Op.in]: ['Día', 'Noche']
      }
    },
    attributes: ['tiempoTotal']
  });

  if (registrosEnfermeria.length > 0) {
    const tiempoTotalEnfermeria = registrosEnfermeria.reduce((total, reg) => total + reg.tiempoTotal, 0);
    const promedioEnfermeria = tiempoTotalEnfermeria / registrosEnfermeria.length;
    promedios.push({
      nombre: 'Registro Enfermería',
      estamento: 'Enfermería',
      tiempoPromedio: Math.round(promedioEnfermeria * 10) / 10,
      cantidad: registrosEnfermeria.length
    });
  }

  // Ordenar por tiempo promedio descendente
  return promedios.sort((a, b) => b.tiempoPromedio - a.tiempoPromedio);
}

// Función para obtener ranking de procedimientos más largos
async function obtenerRankingProcedimientos(fechaInicio, fechaFin) {
  const { Op } = require('sequelize');
  const ProcedimientoMedicina = require('../models/ProcedimientoMedicina');
  const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
  const ProcedimientoAuxiliar = require('../models/ProcedimientoAuxiliar');

  const ranking = [];

  // Medicina
  const procedimientosMedicina = await ProcedimientoMedicina.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const medicinaStats = {};
  procedimientosMedicina.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!medicinaStats[proc.nombre]) {
      medicinaStats[proc.nombre] = { tiempos: [], estamento: 'Medicina' };
    }
    medicinaStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(medicinaStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    ranking.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // Kinesiología
  const procedimientosKinesiologia = await ProcedimientoKinesiologia.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const kinesiologiaStats = {};
  procedimientosKinesiologia.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!kinesiologiaStats[proc.nombre]) {
      kinesiologiaStats[proc.nombre] = { tiempos: [], estamento: 'Kinesiología' };
    }
    kinesiologiaStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(kinesiologiaStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    ranking.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // Auxiliares
  const procedimientosAuxiliares = await ProcedimientoAuxiliar.findAll({
    where: {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    },
    attributes: ['nombre', 'tiempo']
  });

  const auxiliaresStats = {};
  procedimientosAuxiliares.forEach(proc => {
    const [horas, minutos] = proc.tiempo.split(':').map(Number);
    const tiempoMinutos = horas * 60 + minutos;
    
    if (!auxiliaresStats[proc.nombre]) {
      auxiliaresStats[proc.nombre] = { tiempos: [], estamento: 'Auxiliares' };
    }
    auxiliaresStats[proc.nombre].tiempos.push(tiempoMinutos);
  });

  Object.entries(auxiliaresStats).forEach(([nombre, data]) => {
    const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length;
    ranking.push({
      nombre,
      estamento: data.estamento,
      tiempoPromedio: Math.round(promedio * 10) / 10,
      cantidad: data.tiempos.length
    });
  });

  // Ordenar por tiempo promedio descendente y tomar los top 10
  return ranking
    .sort((a, b) => b.tiempoPromedio - a.tiempoPromedio)
    .slice(0, 10);
}
