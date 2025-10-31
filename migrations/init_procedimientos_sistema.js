const ProcedimientoSistema = require('../models/ProcedimientoSistema');

const procedimientosIniciales = [
  // ENFERMERÍA - TAREAS HABITUALES
  { nombre: 'Administrativo (redacción de ingresos/traslados, evoluciones, categorización, estadística, etc)', descripcion: 'Tareas administrativas de enfermería', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: false, orden: 1 },
  { nombre: 'Atención de enfermería (evaluación, curación simple, administración de medicamentos, etc)', descripcion: 'Atención integral de enfermería', estamento: 'Enfermería', tiempoEstimado: 25, requierePaciente: true, orden: 2 },
  { nombre: 'Curación avanzada', descripcion: 'Curación de heridas complejas', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 3 },
  { nombre: 'Diálisis', descripcion: 'Asistencia en diálisis', estamento: 'Enfermería', tiempoEstimado: 120, requierePaciente: true, orden: 4 },
  { nombre: 'Entrega de turno (solo cuando se recibe turno)', descripcion: 'Entrega de turno de enfermería', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: false, orden: 5 },
  { nombre: 'Hemocultivos (incluye registro administrativo)', descripcion: 'Toma de hemocultivos con registro', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 6 },
  { nombre: 'Ingreso (Incluye tarea administrativa)', descripcion: 'Proceso de ingreso del paciente', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 7 },
  { nombre: 'Instalación LA', descripcion: 'Instalación de línea arterial', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 8 },
  { nombre: 'Instalación SNG', descripcion: 'Instalación de sonda nasogástrica', estamento: 'Enfermería', tiempoEstimado: 10, requierePaciente: true, orden: 9 },
  { nombre: 'Instalación de Sonda Foley', descripcion: 'Instalación de sonda vesical', estamento: 'Enfermería', tiempoEstimado: 10, requierePaciente: true, orden: 10 },
  { nombre: 'Instalación VVP', descripcion: 'Instalación de vía venosa periférica', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 11 },
  { nombre: 'MAKI (incluye registro administrativo)', descripcion: 'Procedimiento MAKI con registro', estamento: 'Enfermería', tiempoEstimado: 25, requierePaciente: true, orden: 12 },
  { nombre: 'Preparación de medicamentos', descripcion: 'Preparación y organización de medicamentos', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: false, orden: 13 },
  { nombre: 'TAC con contraste', descripcion: 'Traslado a TAC con contraste', estamento: 'Enfermería', tiempoEstimado: 45, requierePaciente: true, orden: 14 },
  { nombre: 'TAC simple', descripcion: 'Traslado a TAC sin contraste', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 15 },
  { nombre: 'Toma de exámenes (incluye registro administrativo)', descripcion: 'Toma de muestras con registro', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 16 },
  { nombre: 'Traslado (Incluye tarea administrativa)', descripcion: 'Traslado de pacientes con registro', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 17 },

  // ENFERMERÍA - OTRAS TAREAS
  { nombre: 'Cambio de TQT', descripcion: 'Cambio de traqueostomía', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 18 },
  { nombre: 'Cateterismo vesical', descripcion: 'Cateterismo vesical', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 19 },
  { nombre: 'Colonoscopía', descripcion: 'Asistencia en colonoscopía', estamento: 'Enfermería', tiempoEstimado: 60, requierePaciente: true, orden: 20 },
  { nombre: 'Decanulación', descripcion: 'Retiro de traqueostomía', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 21 },
  { nombre: 'Ecografía', descripcion: 'Asistencia en ecografía', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 22 },
  { nombre: 'Electrocardiograma', descripcion: 'Realización de electrocardiograma', estamento: 'Enfermería', tiempoEstimado: 10, requierePaciente: true, orden: 23 },
  { nombre: 'Endoscopía', descripcion: 'Asistencia en endoscopía', estamento: 'Enfermería', tiempoEstimado: 45, requierePaciente: true, orden: 24 },
  { nombre: 'Endoscopía + Colonoscopía', descripcion: 'Asistencia en endoscopía y colonoscopía', estamento: 'Enfermería', tiempoEstimado: 90, requierePaciente: true, orden: 25 },
  { nombre: 'Fibrobroncoscopía', descripcion: 'Asistencia en fibrobroncoscopía', estamento: 'Enfermería', tiempoEstimado: 45, requierePaciente: true, orden: 26 },
  { nombre: 'IOT', descripcion: 'Intubación orotraqueal', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 27 },
  { nombre: 'Instalación CHD', descripcion: 'Instalación de catéter de hemodiálisis', estamento: 'Enfermería', tiempoEstimado: 25, requierePaciente: true, orden: 28 },
  { nombre: 'Instalación CVC', descripcion: 'Instalación de catéter venoso central', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 29 },
  { nombre: 'Instalación de Cistotomia', descripcion: 'Instalación de cistotomía', estamento: 'Enfermería', tiempoEstimado: 25, requierePaciente: true, orden: 30 },
  { nombre: 'Instalación de gastrotomía', descripcion: 'Instalación de gastrotomía', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 31 },
  { nombre: 'Instalación de Sonda rectal', descripcion: 'Instalación de sonda rectal', estamento: 'Enfermería', tiempoEstimado: 10, requierePaciente: true, orden: 32 },
  { nombre: 'Instalación de TQT', descripcion: 'Instalación de traqueostomía', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 33 },
  { nombre: 'Instalación de tunelizado', descripcion: 'Instalación de catéter tunelizado', estamento: 'Enfermería', tiempoEstimado: 40, requierePaciente: true, orden: 34 },
  { nombre: 'Instalación PICCLINE', descripcion: 'Instalación de catéter central de inserción periférica', estamento: 'Enfermería', tiempoEstimado: 35, requierePaciente: true, orden: 35 },
  { nombre: 'Instalación de SNY', descripcion: 'Instalación de sonda nasoyeyunal', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 36 },
  { nombre: 'Mielograma', descripcion: 'Asistencia en mielograma', estamento: 'Enfermería', tiempoEstimado: 60, requierePaciente: true, orden: 37 },
  { nombre: 'Paracentesís', descripcion: 'Asistencia en paracentesís', estamento: 'Enfermería', tiempoEstimado: 25, requierePaciente: true, orden: 38 },
  { nombre: 'PCR', descripcion: 'Procedimiento de reanimación cardiopulmonar', estamento: 'Enfermería', tiempoEstimado: 60, requierePaciente: true, orden: 39 },
  { nombre: 'Premeditación QMT', descripcion: 'Premedicación para QMT', estamento: 'Enfermería', tiempoEstimado: 15, requierePaciente: true, orden: 40 },
  { nombre: 'Punción lumbar', descripcion: 'Asistencia en punción lumbar', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 41 },
  { nombre: 'Radiografía', descripcion: 'Traslado a radiografía', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 42 },
  { nombre: 'RMN', descripcion: 'Traslado a resonancia magnética', estamento: 'Enfermería', tiempoEstimado: 60, requierePaciente: true, orden: 43 },
  { nombre: 'RMN con traslado a BUPA', descripcion: 'Traslado a RMN externa', estamento: 'Enfermería', tiempoEstimado: 90, requierePaciente: true, orden: 44 },
  { nombre: 'Toracocentesís', descripcion: 'Asistencia en toracocentesís', estamento: 'Enfermería', tiempoEstimado: 30, requierePaciente: true, orden: 45 },
  { nombre: 'Traslado a pabellón', descripcion: 'Traslado a pabellón quirúrgico', estamento: 'Enfermería', tiempoEstimado: 20, requierePaciente: true, orden: 46 },

  // KINESIOLOGÍA - PROCEDIMIENTOS ESPECÍFICOS
  { nombre: 'Kinesiterapia respiratoria (Ev, KTR, EMR, etc)', descripcion: 'Terapia respiratoria especializada', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 1 },
  { nombre: 'Kinesiterapia motora', descripcion: 'Terapia de movilización y ejercicios', estamento: 'Kinesiología', tiempoEstimado: 25, requierePaciente: true, orden: 2 },
  { nombre: 'Kinesiterapia integral (respiratorio + motor)', descripcion: 'Terapia integral respiratoria y motora', estamento: 'Kinesiología', tiempoEstimado: 45, requierePaciente: true, orden: 3 },
  { nombre: 'Cultivo de secreción bronquial', descripcion: 'Toma de muestra para cultivo', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 4 },
  { nombre: 'Film array respiratorio', descripcion: 'Toma de muestra para film array', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 5 },
  { nombre: 'Baciloscopía', descripcion: 'Toma de muestra para baciloscopía', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 6 },
  { nombre: 'Instalación de VMNI', descripcion: 'Instalación de ventilación mecánica no invasiva', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 7 },
  { nombre: 'Instalación de CNAF', descripcion: 'Instalación de cánula nasal de alto flujo', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 8 },
  { nombre: 'Tareas administrativas (evoluciones, estadísticas, etc)', descripcion: 'Tareas administrativas de kinesiología', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: false, orden: 9 },
  { nombre: 'Entrega de turno (solo cuando se recibe turno)', descripcion: 'Entrega de turno de kinesiología', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: false, orden: 10 },

  // KINESIOLOGÍA - OTROS PROCEDIMIENTOS (de enfermería que también puede hacer kinesiología)
  { nombre: 'Instalación VVP', descripcion: 'Instalación de vía venosa periférica', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 11 },
  { nombre: 'Instalación CVC', descripcion: 'Instalación de catéter venoso central', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 12 },
  { nombre: 'Instalación CHD', descripcion: 'Instalación de catéter de hemodiálisis', estamento: 'Kinesiología', tiempoEstimado: 25, requierePaciente: true, orden: 13 },
  { nombre: 'Instalación LA', descripcion: 'Instalación de línea arterial', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 14 },
  { nombre: 'Instalación PICCLINE', descripcion: 'Instalación de catéter central de inserción periférica', estamento: 'Kinesiología', tiempoEstimado: 35, requierePaciente: true, orden: 15 },
  { nombre: 'Instalación de tunelizado', descripcion: 'Instalación de catéter tunelizado', estamento: 'Kinesiología', tiempoEstimado: 40, requierePaciente: true, orden: 16 },
  { nombre: 'Instalación de Cistotomia', descripcion: 'Instalación de cistotomía', estamento: 'Kinesiología', tiempoEstimado: 25, requierePaciente: true, orden: 17 },
  { nombre: 'Instalación de Sonda Foley', descripcion: 'Instalación de sonda vesical', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 18 },
  { nombre: 'Instalación de Sonda rectal', descripcion: 'Instalación de sonda rectal', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 19 },
  { nombre: 'Instalación de gastrotomía', descripcion: 'Instalación de gastrotomía', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 20 },
  { nombre: 'Instalación de SNG', descripcion: 'Instalación de sonda nasogástrica', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 21 },
  { nombre: 'Instalación de SNY', descripcion: 'Instalación de sonda nasoyeyunal', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 22 },
  { nombre: 'Toma de exámenes', descripcion: 'Toma de muestras para exámenes', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 23 },
  { nombre: 'Hemocultivos', descripcion: 'Toma de hemocultivos', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 24 },
  { nombre: 'TAC simple', descripcion: 'Traslado a TAC sin contraste', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 25 },
  { nombre: 'TAC con contraste', descripcion: 'Traslado a TAC con contraste', estamento: 'Kinesiología', tiempoEstimado: 45, requierePaciente: true, orden: 26 },
  { nombre: 'RMN', descripcion: 'Traslado a resonancia magnética', estamento: 'Kinesiología', tiempoEstimado: 60, requierePaciente: true, orden: 27 },
  { nombre: 'RMN con traslado a BUPA', descripcion: 'Traslado a RMN externa', estamento: 'Kinesiología', tiempoEstimado: 90, requierePaciente: true, orden: 28 },
  { nombre: 'Electrocardiograma', descripcion: 'Realización de electrocardiograma', estamento: 'Kinesiología', tiempoEstimado: 10, requierePaciente: true, orden: 29 },
  { nombre: 'MAKI', descripcion: 'Procedimiento MAKI', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 30 },
  { nombre: 'Premeditación QMT', descripcion: 'Premedicación para QMT', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 31 },
  { nombre: 'Cateterismo vesical', descripcion: 'Cateterismo vesical', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 32 },
  { nombre: 'Endoscopía', descripcion: 'Asistencia en endoscopía', estamento: 'Kinesiología', tiempoEstimado: 45, requierePaciente: true, orden: 33 },
  { nombre: 'Colonoscopía', descripcion: 'Asistencia en colonoscopía', estamento: 'Kinesiología', tiempoEstimado: 60, requierePaciente: true, orden: 34 },
  { nombre: 'Endoscopía + Colonoscopía', descripcion: 'Asistencia en endoscopía y colonoscopía', estamento: 'Kinesiología', tiempoEstimado: 90, requierePaciente: true, orden: 35 },
  { nombre: 'Fibrobroncoscopía', descripcion: 'Asistencia en fibrobroncoscopía', estamento: 'Kinesiología', tiempoEstimado: 45, requierePaciente: true, orden: 36 },
  { nombre: 'Ecografía', descripcion: 'Asistencia en ecografía', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 37 },
  { nombre: 'Radiografía', descripcion: 'Traslado a radiografía', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 38 },
  { nombre: 'Toracocentesís', descripcion: 'Asistencia en toracocentesís', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 39 },
  { nombre: 'Paracentesís', descripcion: 'Asistencia en paracentesís', estamento: 'Kinesiología', tiempoEstimado: 25, requierePaciente: true, orden: 40 },
  { nombre: 'Punción lumbar', descripcion: 'Asistencia en punción lumbar', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 41 },
  { nombre: 'Mielograma', descripcion: 'Asistencia en mielograma', estamento: 'Kinesiología', tiempoEstimado: 60, requierePaciente: true, orden: 42 },
  { nombre: 'IOT', descripcion: 'Intubación orotraqueal', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 43 },
  { nombre: 'PCR', descripcion: 'Procedimiento de reanimación cardiopulmonar', estamento: 'Kinesiología', tiempoEstimado: 60, requierePaciente: true, orden: 44 },
  { nombre: 'Instalación de TQT', descripcion: 'Instalación de traqueostomía', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 45 },
  { nombre: 'Cambio de TQT', descripcion: 'Cambio de traqueostomía', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 46 },
  { nombre: 'Decanulación', descripcion: 'Retiro de traqueostomía', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 47 },
  { nombre: 'Traslado a pabellón', descripcion: 'Traslado a pabellón quirúrgico', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 48 },
  { nombre: 'Traslado a otra unidad', descripcion: 'Traslado a otra unidad del hospital', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 49 },
  { nombre: 'Ingreso', descripcion: 'Proceso de ingreso del paciente', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 50 },
  { nombre: 'Curación simple', descripcion: 'Curación de heridas simples', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: true, orden: 51 },
  { nombre: 'Diálisis', descripcion: 'Asistencia en diálisis', estamento: 'Kinesiología', tiempoEstimado: 120, requierePaciente: true, orden: 52 },
  { nombre: 'Curación avanzada', descripcion: 'Curación de heridas complejas', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: true, orden: 53 },
  { nombre: 'Evaluación de enfermería', descripcion: 'Evaluación integral del paciente', estamento: 'Kinesiología', tiempoEstimado: 20, requierePaciente: true, orden: 54 },
  { nombre: 'Administrativo (redacción de ingresos/traslados, evoluciones, categorización, estadística, etc)', descripcion: 'Tareas administrativas de enfermería', estamento: 'Kinesiología', tiempoEstimado: 30, requierePaciente: false, orden: 55 },
  { nombre: 'Entrega de turno (solo cuando se recibe turno)', descripcion: 'Entrega de turno de enfermería', estamento: 'Kinesiología', tiempoEstimado: 15, requierePaciente: false, orden: 56 },

  // MEDICINA - PROCEDIMIENTOS HABITUALES
  { nombre: 'Administrativo (evoluciones, revisión de HC, indicaciones, etc)', descripcion: 'Tareas administrativas médicas', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: false, orden: 1 },
  { nombre: 'Egreso (redacción de egreso, indicaciones, etc)', descripcion: 'Proceso de egreso del paciente', estamento: 'Medicina', tiempoEstimado: 25, requierePaciente: true, orden: 2 },
  { nombre: 'Entrega de turno (solo cuando se recibe turno)', descripcion: 'Entrega de turno médico', estamento: 'Medicina', tiempoEstimado: 20, requierePaciente: false, orden: 3 },
  { nombre: 'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)', descripcion: 'Proceso de ingreso del paciente', estamento: 'Medicina', tiempoEstimado: 40, requierePaciente: true, orden: 4 },
  { nombre: 'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)', descripcion: 'Proceso de interconsulta médica', estamento: 'Medicina', tiempoEstimado: 35, requierePaciente: true, orden: 5 },

  // MEDICINA - OTROS PROCEDIMIENTOS
  { nombre: 'Cambio de TQT', descripcion: 'Cambio de traqueostomía', estamento: 'Medicina', tiempoEstimado: 20, requierePaciente: true, orden: 6 },
  { nombre: 'Colonoscopía', descripcion: 'Procedimiento de colonoscopía', estamento: 'Medicina', tiempoEstimado: 60, requierePaciente: true, orden: 7 },
  { nombre: 'Decanulación', descripcion: 'Retiro de traqueostomía', estamento: 'Medicina', tiempoEstimado: 15, requierePaciente: true, orden: 8 },
  { nombre: 'Ecografía', descripcion: 'Procedimiento de ecografía', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: true, orden: 9 },
  { nombre: 'Endoscopía', descripcion: 'Procedimiento de endoscopía', estamento: 'Medicina', tiempoEstimado: 45, requierePaciente: true, orden: 10 },
  { nombre: 'Endoscopía + Colonoscopía', descripcion: 'Procedimientos combinados', estamento: 'Medicina', tiempoEstimado: 90, requierePaciente: true, orden: 11 },
  { nombre: 'Fibrobroncoscopía', descripcion: 'Procedimiento de fibrobroncoscopía', estamento: 'Medicina', tiempoEstimado: 45, requierePaciente: true, orden: 12 },
  { nombre: 'Instalación CHD', descripcion: 'Instalación de catéter de hemodiálisis', estamento: 'Medicina', tiempoEstimado: 25, requierePaciente: true, orden: 13 },
  { nombre: 'Instalación CVC', descripcion: 'Instalación de catéter venoso central', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: true, orden: 14 },
  { nombre: 'Instalación de Cistotomia', descripcion: 'Instalación de cistotomía', estamento: 'Medicina', tiempoEstimado: 25, requierePaciente: true, orden: 15 },
  { nombre: 'Instalación de gastrotomía', descripcion: 'Instalación de gastrotomía', estamento: 'Medicina', tiempoEstimado: 15, requierePaciente: true, orden: 16 },
  { nombre: 'Instalación de SNY', descripcion: 'Instalación de sonda nasoyeyunal', estamento: 'Medicina', tiempoEstimado: 15, requierePaciente: true, orden: 17 },
  { nombre: 'Instalación de TQT', descripcion: 'Instalación de traqueostomía', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: true, orden: 18 },
  { nombre: 'Instalación de tunelizado', descripcion: 'Instalación de catéter tunelizado', estamento: 'Medicina', tiempoEstimado: 40, requierePaciente: true, orden: 19 },
  { nombre: 'Instalación LA', descripcion: 'Instalación de línea arterial', estamento: 'Medicina', tiempoEstimado: 20, requierePaciente: true, orden: 20 },
  { nombre: 'Instalación PICCLINE', descripcion: 'Instalación de catéter central de inserción periférica', estamento: 'Medicina', tiempoEstimado: 35, requierePaciente: true, orden: 21 },
  { nombre: 'IOT', descripcion: 'Intubación orotraqueal', estamento: 'Medicina', tiempoEstimado: 20, requierePaciente: true, orden: 22 },
  { nombre: 'Mielograma', descripcion: 'Procedimiento de mielograma', estamento: 'Medicina', tiempoEstimado: 60, requierePaciente: true, orden: 23 },
  { nombre: 'Paracentesís', descripcion: 'Procedimiento de paracentesís', estamento: 'Medicina', tiempoEstimado: 25, requierePaciente: true, orden: 24 },
  { nombre: 'PCR', descripcion: 'Procedimiento de reanimación cardiopulmonar', estamento: 'Medicina', tiempoEstimado: 60, requierePaciente: true, orden: 25 },
  { nombre: 'Punción lumbar', descripcion: 'Procedimiento de punción lumbar', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: true, orden: 26 },
  { nombre: 'Radiografía', descripcion: 'Interpretación de radiografías', estamento: 'Medicina', tiempoEstimado: 15, requierePaciente: true, orden: 27 },
  { nombre: 'RMN con traslado a BUPA', descripcion: 'Traslado a RMN externa', estamento: 'Medicina', tiempoEstimado: 90, requierePaciente: true, orden: 28 },
  { nombre: 'Toracocentesís', descripcion: 'Procedimiento de toracocentesís', estamento: 'Medicina', tiempoEstimado: 30, requierePaciente: true, orden: 29 },

  // TENS - PROCEDIMIENTOS HABITUALES
  { nombre: 'Esterilización (conteo de materiales, recolección y traslados)', descripcion: 'Proceso de esterilización de materiales', estamento: 'TENS', tiempoEstimado: 30, requierePaciente: false, orden: 1 },
  { nombre: 'Tareas administrativas (registros, evoluciones, etc)', descripcion: 'Tareas administrativas de TENS', estamento: 'TENS', tiempoEstimado: 20, requierePaciente: false, orden: 2 },
  { nombre: 'Entrega de turno (solo cuando se recibe)', descripcion: 'Entrega de turno de TENS', estamento: 'TENS', tiempoEstimado: 15, requierePaciente: false, orden: 3 },
  { nombre: 'Toma de signos vitales', descripcion: 'Control de signos vitales del paciente', estamento: 'TENS', tiempoEstimado: 10, requierePaciente: true, orden: 4 },
  { nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)', descripcion: 'Cuidados de aseo y piel del paciente', estamento: 'TENS', tiempoEstimado: 25, requierePaciente: true, orden: 5 },
  { nombre: 'Administración de medicamentos oral/SNG/SNY/Gastrostomía', descripcion: 'Administración de medicamentos por diferentes vías', estamento: 'TENS', tiempoEstimado: 15, requierePaciente: true, orden: 6 },
  { nombre: 'Medición de diuresis', descripcion: 'Control y medición de diuresis', estamento: 'TENS', tiempoEstimado: 5, requierePaciente: true, orden: 7 },
  { nombre: 'Administración de broncodilatadores o nebulización', descripcion: 'Administración de medicamentos broncodilatadores', estamento: 'TENS', tiempoEstimado: 20, requierePaciente: true, orden: 8 },

  // TENS - OTRAS TAREAS
  { nombre: 'Control de glicemia', descripcion: 'Control de niveles de glucosa', estamento: 'TENS', tiempoEstimado: 5, requierePaciente: true, orden: 9 },
  { nombre: 'Curación simple (asistencia)', descripcion: 'Asistencia en curaciones simples', estamento: 'TENS', tiempoEstimado: 15, requierePaciente: true, orden: 10 },
  { nombre: 'Curación avanzada (asistencia)', descripcion: 'Asistencia en curaciones avanzadas', estamento: 'TENS', tiempoEstimado: 25, requierePaciente: true, orden: 11 },
  { nombre: 'Cambio de posición', descripcion: 'Cambio de posición del paciente', estamento: 'TENS', tiempoEstimado: 10, requierePaciente: true, orden: 12 },
  { nombre: 'Alimentación asistida', descripcion: 'Asistencia en alimentación del paciente', estamento: 'TENS', tiempoEstimado: 20, requierePaciente: true, orden: 13 },
  { nombre: 'Traslado interno', descripcion: 'Traslado interno del paciente', estamento: 'TENS', tiempoEstimado: 15, requierePaciente: true, orden: 14 },
  { nombre: 'Traslado a TAC sin contraste', descripcion: 'Traslado a TAC sin medio de contraste', estamento: 'TENS', tiempoEstimado: 30, requierePaciente: true, orden: 15 },
  { nombre: 'Traslado a TAC con contraste', descripcion: 'Traslado a TAC con medio de contraste', estamento: 'TENS', tiempoEstimado: 45, requierePaciente: true, orden: 16 },
  { nombre: 'Control de drenajes (vaciado y registro)', descripcion: 'Control y registro de drenajes', estamento: 'TENS', tiempoEstimado: 10, requierePaciente: true, orden: 17 },
  { nombre: 'Educación familiar', descripcion: 'Educación a familiares del paciente', estamento: 'TENS', tiempoEstimado: 20, requierePaciente: true, orden: 18 },

  // AUXILIARES - TODOS LOS PROCEDIMIENTOS
  { nombre: 'Entrega de turno', descripcion: 'Entrega de turno de auxiliares', estamento: 'Auxiliar', tiempoEstimado: 15, requierePaciente: false, orden: 1 },
  { nombre: 'Aseo terminal', descripcion: 'Limpieza y desinfección terminal', estamento: 'Auxiliar', tiempoEstimado: 45, requierePaciente: false, orden: 2 },
  { nombre: 'Entrega de interconsulta', descripcion: 'Entrega de documentos de interconsulta', estamento: 'Auxiliar', tiempoEstimado: 10, requierePaciente: false, orden: 3 },
  { nombre: 'Entrega de exámenes', descripcion: 'Entrega de resultados de exámenes', estamento: 'Auxiliar', tiempoEstimado: 10, requierePaciente: false, orden: 4 },
  { nombre: 'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia)', descripcion: 'Gestión de recetas y fármacos', estamento: 'Auxiliar', tiempoEstimado: 20, requierePaciente: false, orden: 5 },
  { nombre: 'Aseo regular', descripcion: 'Limpieza regular de áreas', estamento: 'Auxiliar', tiempoEstimado: 30, requierePaciente: false, orden: 6 },
  { nombre: 'Recepción / entrega de ropa', descripcion: 'Gestión de ropa hospitalaria', estamento: 'Auxiliar', tiempoEstimado: 15, requierePaciente: false, orden: 7 }
];

async function initProcedimientosSistema() {
  try {
    
    // Verificar si ya existen procedimientos
    const count = await ProcedimientoSistema.count();
    if (count > 0) {
      return;
    }

    // Crear todos los procedimientos
    await ProcedimientoSistema.bulkCreate(procedimientosIniciales);
    
  } catch (error) {
    console.error('❌ Error al inicializar procedimientos del sistema:', error);
    throw error;
  }
}

module.exports = initProcedimientosSistema;
