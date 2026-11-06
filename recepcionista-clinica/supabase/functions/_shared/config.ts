// Datos de la clínica. Cambia estos valores por los reales antes de desplegar.
// Las claves secretas (Meta, Anthropic, Google, OpenAI) NO van aquí: van en los Secrets de Supabase.

export type Franja = [inicio: string, fin: string]; // "HH:mm" en hora de la clínica

export const CLINICA = {
  nombre: "Clínica Dental Ruiz",
  doctora: "Dra. Ruiz",
  direccion: "Calle 10 # 43A-20, El Poblado, Medellín",
  latitud: 6.2088,
  longitud: -75.5674,
  zonaHoraria: "America/Bogota",
  // Teléfono que recibe los avisos de urgencias y el resumen diario (con indicativo, sin +).
  telefonoClinica: "573000000000",
  idiomaPlantillas: "es",
  duracionCitaMin: 30,
  // No ofrecer horarios que empiecen antes de este margen (para que alguien alcance a llegar).
  margenMinimoMin: 60,
  // Horario de atención por día de la semana (1 = lunes ... 7 = domingo).
  horario: {
    1: [["08:00", "18:00"]],
    2: [["08:00", "18:00"]],
    3: [["08:00", "18:00"]],
    4: [["08:00", "18:00"]],
    5: [["08:00", "18:00"]],
    6: [["08:00", "13:00"]],
    7: [],
  } as Record<number, Franja[]>,
  horarioTexto: "Lunes a viernes de 8:00 a.m. a 6:00 p.m. y sábados de 8:00 a.m. a 1:00 p.m. Domingos y festivos cerrado.",
  // Días cerrados además de los domingos (festivos de Colombia, vacaciones). Formato "yyyy-MM-dd".
  diasCerrados: [
    "2026-11-16", // Independencia de Cartagena
    "2026-12-08", // Inmaculada Concepción
    "2026-12-25", // Navidad
  ],
  servicios:
    "Valoración $80.000; Limpieza dental $150.000; Resina desde $180.000; Atención de urgencia $120.000; " +
    "Ortodoncia: valoración sin costo. (Precios de ejemplo en pesos colombianos: pon los tuyos.)",
};

// Modelo de Claude que hace de recepcionista.
export const MODELO_CLAUDE = "claude-opus-5-5";

// Mensajes que se guardan como memoria de cada conversación.
export const MENSAJES_DE_MEMORIA = 12;
