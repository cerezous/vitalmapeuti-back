const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const NAS = require('../models/NAS');
const Apache2 = require('../models/Apache2');
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
const RegistroProcedimientos = require('../models/RegistroProcedimientos');
const ProcedimientoRegistro = require('../models/ProcedimientoRegistro');
const ProcedimientoAuxiliar = require('../models/ProcedimientoAuxiliar');
const ProcedimientoMedicina = require('../models/ProcedimientoMedicina');
const CuestionarioBurnout = require('../models/CuestionarioBurnout');
const RegistroProcedimientosTENS = require('../models/RegistroProcedimientosTENS');
const ProcedimientoTENS = require('../models/ProcedimientoTENS');

// Definir relaciones entre modelos

// Un Usuario puede tener muchos registros NAS
Usuario.hasMany(NAS, { foreignKey: 'usuarioId' });
NAS.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Un Paciente puede tener muchos registros NAS (relación por RUT)
Paciente.hasMany(NAS, { foreignKey: 'pacienteRut', sourceKey: 'rut' });
NAS.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut' });

// Un Usuario puede tener muchos registros APACHE II
Usuario.hasMany(Apache2, { foreignKey: 'usuarioId' });
Apache2.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Un Paciente puede tener muchos registros APACHE II
Paciente.hasMany(Apache2, { foreignKey: 'pacienteId' });
Apache2.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// Un Usuario puede tener muchas categorizaciones de kinesiología
Usuario.hasMany(CategorizacionKinesiologia, { foreignKey: 'usuarioId', as: 'categorizacionesKinesiologia' });
CategorizacionKinesiologia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Paciente puede tener muchas categorizaciones de kinesiología (relación por RUT)
Paciente.hasMany(CategorizacionKinesiologia, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'categorizacionesKinesiologia' });
CategorizacionKinesiologia.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

// Un Usuario puede tener muchos procedimientos de kinesiología
Usuario.hasMany(ProcedimientoKinesiologia, { foreignKey: 'usuarioId', as: 'procedimientosKinesiologia' });
ProcedimientoKinesiologia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Paciente puede tener muchos procedimientos de kinesiología (relación por RUT)
Paciente.hasMany(ProcedimientoKinesiologia, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'procedimientosKinesiologia' });
ProcedimientoKinesiologia.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

// Un Usuario puede tener muchos registros de procedimientos
Usuario.hasMany(RegistroProcedimientos, { foreignKey: 'usuarioId', as: 'registrosProcedimientos' });
RegistroProcedimientos.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Registro de Procedimientos puede tener muchos procedimientos individuales
RegistroProcedimientos.hasMany(ProcedimientoRegistro, { foreignKey: 'registroId', as: 'procedimientos' });
ProcedimientoRegistro.belongsTo(RegistroProcedimientos, { foreignKey: 'registroId', as: 'registro' });

// Un Paciente puede tener muchos procedimientos en registros (relación por RUT)
Paciente.hasMany(ProcedimientoRegistro, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'procedimientosRegistro' });
ProcedimientoRegistro.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

// Un Usuario puede tener muchos procedimientos auxiliares
Usuario.hasMany(ProcedimientoAuxiliar, { foreignKey: 'usuarioId', as: 'procedimientosAuxiliares' });
ProcedimientoAuxiliar.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Paciente puede tener muchos procedimientos auxiliares (relación por RUT)
Paciente.hasMany(ProcedimientoAuxiliar, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'procedimientosAuxiliares' });
ProcedimientoAuxiliar.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

// Un Usuario puede tener muchos procedimientos de medicina
Usuario.hasMany(ProcedimientoMedicina, { foreignKey: 'usuarioId', as: 'procedimientosMedicina' });
ProcedimientoMedicina.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Paciente puede tener muchos procedimientos de medicina (relación por RUT)
Paciente.hasMany(ProcedimientoMedicina, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'procedimientosMedicina' });
ProcedimientoMedicina.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

// Un Usuario puede tener muchos cuestionarios de burnout
Usuario.hasMany(CuestionarioBurnout, { foreignKey: 'usuarioId', as: 'cuestionariosBurnout' });
CuestionarioBurnout.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// === ASOCIACIONES PARA TENS ===
// Un Usuario puede tener muchos registros de procedimientos TENS
Usuario.hasMany(RegistroProcedimientosTENS, { foreignKey: 'usuarioId', as: 'registrosProcedimientosTENS' });
RegistroProcedimientosTENS.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Un Registro de Procedimientos TENS puede tener muchos procedimientos individuales
RegistroProcedimientosTENS.hasMany(ProcedimientoTENS, { foreignKey: 'registroId', as: 'procedimientos' });
ProcedimientoTENS.belongsTo(RegistroProcedimientosTENS, { foreignKey: 'registroId', as: 'registro' });

// Un Paciente puede tener muchos procedimientos TENS (relación por RUT)
Paciente.hasMany(ProcedimientoTENS, { foreignKey: 'pacienteRut', sourceKey: 'rut', as: 'procedimientosTENS' });
ProcedimientoTENS.belongsTo(Paciente, { foreignKey: 'pacienteRut', targetKey: 'rut', as: 'paciente' });

module.exports = {
  Usuario,
  Paciente,
  NAS,
  Apache2,
  CategorizacionKinesiologia,
  ProcedimientoKinesiologia,
  RegistroProcedimientos,
  ProcedimientoRegistro,
  ProcedimientoAuxiliar,
  ProcedimientoMedicina,
  CuestionarioBurnout,
  RegistroProcedimientosTENS,
  ProcedimientoTENS
};
