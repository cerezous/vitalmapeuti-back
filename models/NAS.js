const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NAS = sequelize.define('NAS', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Relación con Paciente por RUT (clave única)
  pacienteRut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'rut'
    },
    validate: {
      notEmpty: true,
      len: [8, 12] // RUT sin puntos ni guión
    }
  },
  // Relación with Usuario (quien registra)
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  // Fecha y hora del registro NAS
  fechaRegistro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // ========== GRUPO 1: ACTIVIDADES BÁSICAS DE MONITORIZACIÓN (SELECCIONAR UNA) ==========
  item_1a: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Monitorización horaria, balance hídrico (4.5%)'
  },
  item_1b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Presencia continua ≥2 h (12.1%)'
  },
  item_1c: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Presencia continua ≥4 h (19.6%)'
  },
  
  // ========== ÍTEMS INDIVIDUALES ==========
  item_2: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Analíticas (bioquímica, micro, etc.) (4.3%)'
  },
  item_3: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Medicación (excluye vasoactivos) (5.6%)'
  },
  
  // ========== GRUPO 4: PROCEDIMIENTOS DE HIGIENE (SELECCIONAR UNA) ==========
  item_4a: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Higiene/procedimientos "normales" (4.1%)'
  },
  item_4b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Higiene/procedimientos >2 h en un turno (16.5%)'
  },
  item_4c: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Higiene/procedimientos >4 h en un turno (20.0%)'
  },
  
  // ========== ÍTEM INDIVIDUAL ==========
  item_5: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Cuidados de drenajes (excepto SNG) (1.8%)'
  },
  
  // ========== GRUPO 6: MOVILIZACIÓN Y POSICIONAMIENTO (SELECCIONAR UNA) ==========
  item_6a: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Movilización/posicionamiento hasta 3 veces/24 h (5.5%)'
  },
  item_6b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Movilización >3 veces/24 h o con 2 enfermeras (12.4%)'
  },
  item_6c: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Movilización con ≥3 enfermeras (17.0%)'
  },
  
  // ========== GRUPO 7: APOYO Y SOPORTE FAMILIAR (SELECCIONAR UNA) ==========
  item_7a: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Apoyo a familia/paciente ~1 h (4.0%)'
  },
  item_7b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Apoyo a familia/paciente ≥3 h (duelo, circunstancias complejas) (32.0%)'
  },
  
  // ========== GRUPO 8: TAREAS ADMINISTRATIVAS (SELECCIONAR UNA) ==========
  item_8a: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tareas administrativas rutinarias (<2 h) (4.2%)'
  },
  item_8b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tareas administrativas ~2 h (23.2%)'
  },
  item_8c: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tareas administrativas ~4 h (donación, coordinación…) (30.0%)'
  },
  
  // ========== GRUPO 9: ACTIVIDADES ESPECÍFICAS DE LA UNIDAD ==========
  item_9: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Soporte respiratorio (VM, VMI, CPAP/PEEP, O₂, etc.) (1.4%)'
  },
  item_10: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Cuidados de vía aérea artificial (TET/traqueo) (1.8%)'
  },
  item_11: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tratamiento para mejorar función pulmonar (FTR torácica, aspiración…) (4.4%)'
  },
  item_12: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Fármacos vasoactivos (cualquier tipo/dosis) (1.2%)'
  },
  item_13: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Reposición IV de grandes pérdidas (>3 L/m²/día) (2.5%)'
  },
  item_14: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Monitorización de aurícula izquierda / Swan-Ganz (1.7%)'
  },
  item_15: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'RCP tras parada (en últimas 24 h) (7.1%)'
  },
  item_16: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Hemofiltración/diálisis (7.7%)'
  },
  item_17: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Diuresis cuantitativa (sondaje vesical, etc.) (7.0%)'
  },
  item_18: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Monitorización de presión intracraneal (1.6%)'
  },
  item_19: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tratamiento de acidosis/alcalosis metabólica complicada (1.3%)'
  },
  item_20: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Hiperalimentación IV (nutrición parenteral) (2.8%)'
  },
  item_21: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Nutrición enteral (SNG u otra vía GI) (1.3%)'
  },
  item_22: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Intervención específica en UCI (intubación, marcapasos, cardioversión, endoscopias, cirugía urgente <24 h, etc.) (2.8%)'
  },
  item_23: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Intervención específica fuera de UCI (cirugía/proced. diagnósticos) (1.9%)'
  },
  
  // ========== PUNTUACIÓN TOTAL CALCULADA ==========
  puntuacionTotal: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 200 // Máximo teórico posible
    },
    comment: 'Puntuación total NAS calculada automáticamente'
  },
  
  // ========== METADATOS ADICIONALES ==========
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales sobre el registro NAS'
  }
}, {
  tableName: 'nas',
  timestamps: true,
  indexes: [
    {
      unique: false,
      fields: ['pacienteRut']
    },
    {
      unique: false,
      fields: ['fechaRegistro']
    },
  ],
  validate: {
    // Validar que solo un ítem por grupo exclusivo esté seleccionado
    soloUnItemPorGrupo() {
      // Grupo 1: Solo uno de 1a, 1b, 1c
      const grupo1 = [this.item_1a, this.item_1b, this.item_1c].filter(Boolean).length;
      if (grupo1 > 1) {
        throw new Error('Solo se puede seleccionar una opción del Grupo 1 (ítems 1a, 1b, 1c)');
      }
      
      // Grupo 4: Solo uno de 4a, 4b, 4c
      const grupo4 = [this.item_4a, this.item_4b, this.item_4c].filter(Boolean).length;
      if (grupo4 > 1) {
        throw new Error('Solo se puede seleccionar una opción del Grupo 4 (ítems 4a, 4b, 4c)');
      }
      
      // Grupo 6: Solo uno de 6a, 6b, 6c
      const grupo6 = [this.item_6a, this.item_6b, this.item_6c].filter(Boolean).length;
      if (grupo6 > 1) {
        throw new Error('Solo se puede seleccionar una opción del Grupo 6 (ítems 6a, 6b, 6c)');
      }
      
      // Grupo 7: Solo uno de 7a, 7b
      const grupo7 = [this.item_7a, this.item_7b].filter(Boolean).length;
      if (grupo7 > 1) {
        throw new Error('Solo se puede seleccionar una opción del Grupo 7 (ítems 7a, 7b)');
      }
      
      // Grupo 8: Solo uno de 8a, 8b, 8c
      const grupo8 = [this.item_8a, this.item_8b, this.item_8c].filter(Boolean).length;
      if (grupo8 > 1) {
        throw new Error('Solo se puede seleccionar una opción del Grupo 8 (ítems 8a, 8b, 8c)');
      }
    }
  },
  hooks: {
    beforeSave: (nas) => {
      // Calcular puntuación total automáticamente
      nas.puntuacionTotal = nas.calcularPuntuacionTotal();
    }
  }
});

// ========== MÉTODOS DE INSTANCIA ==========

// Método para calcular puntuación total NAS
NAS.prototype.calcularPuntuacionTotal = function() {
  const puntajes = {
    item_1a: 4.5, item_1b: 12.1, item_1c: 19.6,
    item_2: 4.3, item_3: 5.6,
    item_4a: 4.1, item_4b: 16.5, item_4c: 20.0,
    item_5: 1.8,
    item_6a: 5.5, item_6b: 12.4, item_6c: 17.0,
    item_7a: 4.0, item_7b: 32.0,
    item_8a: 4.2, item_8b: 23.2, item_8c: 30.0,
    item_9: 1.4, item_10: 1.8, item_11: 4.4, item_12: 1.2, item_13: 2.5,
    item_14: 1.7, item_15: 7.1, item_16: 7.7, item_17: 7.0, item_18: 1.6,
    item_19: 1.3, item_20: 2.8, item_21: 1.3, item_22: 2.8, item_23: 1.9
  };
  
  let total = 0.0;
  Object.keys(puntajes).forEach(item => {
    if (this[item] === true) {
      total += puntajes[item];
    }
  });
  
  return parseFloat(total.toFixed(2));
};

// Método para obtener nivel de carga de trabajo
NAS.prototype.obtenerNivelCarga = function() {
  const total = this.puntuacionTotal || this.calcularPuntuacionTotal();
  
  if (total < 40) return 'Baja';
  if (total < 60) return 'Moderada';
  if (total < 80) return 'Alta';
  return 'Muy Alta';
};

// Método para obtener ítems seleccionados
NAS.prototype.obtenerItemsSeleccionados = function() {
  const items = [];
  const campos = [
    'item_1a', 'item_1b', 'item_1c', 'item_2', 'item_3',
    'item_4a', 'item_4b', 'item_4c', 'item_5',
    'item_6a', 'item_6b', 'item_6c', 'item_7a', 'item_7b',
    'item_8a', 'item_8b', 'item_8c',
    'item_9', 'item_10', 'item_11', 'item_12', 'item_13',
    'item_14', 'item_15', 'item_16', 'item_17', 'item_18',
    'item_19', 'item_20', 'item_21', 'item_22', 'item_23'
  ];
  
  campos.forEach(campo => {
    if (this[campo] === true) {
      items.push(campo);
    }
  });
  
  return items;
};

// Método estático para validar selecciones antes de guardar
NAS.validarSelecciones = function(selecciones) {
  const errores = [];
  
  // Validar Grupo 1
  const grupo1 = ['item_1a', 'item_1b', 'item_1c'].filter(item => selecciones[item]).length;
  if (grupo1 > 1) errores.push('Solo se puede seleccionar una opción del Grupo 1');
  
  // Validar Grupo 4
  const grupo4 = ['item_4a', 'item_4b', 'item_4c'].filter(item => selecciones[item]).length;
  if (grupo4 > 1) errores.push('Solo se puede seleccionar una opción del Grupo 4');
  
  // Validar Grupo 6
  const grupo6 = ['item_6a', 'item_6b', 'item_6c'].filter(item => selecciones[item]).length;
  if (grupo6 > 1) errores.push('Solo se puede seleccionar una opción del Grupo 6');
  
  // Validar Grupo 7
  const grupo7 = ['item_7a', 'item_7b'].filter(item => selecciones[item]).length;
  if (grupo7 > 1) errores.push('Solo se puede seleccionar una opción del Grupo 7');
  
  // Validar Grupo 8
  const grupo8 = ['item_8a', 'item_8b', 'item_8c'].filter(item => selecciones[item]).length;
  if (grupo8 > 1) errores.push('Solo se puede seleccionar una opción del Grupo 8');
  
  return errores;
};

module.exports = NAS;
