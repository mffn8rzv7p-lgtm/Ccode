// Función "cotizacion": genera una cotización en dos etapas.
//   POST { cotizacion_id, etapa: "precio" | "carta" }
// "precio" propone el análisis; el equipo aprueba los precios en la página (campo `aprobado`);
// "carta" escribe la carta usando solo los precios aprobados.
import { clienteDelEquipo, responder } from "../_shared/http.ts";
import { ErrorGeneracion, generar } from "../_shared/claude.ts";
import { ESQUEMA_CARTA, ESQUEMA_PRECIO, promptCarta, promptPrecio, SISTEMA } from "./prompts.ts";
import {
  alertasPrecio,
  calcularPiso,
  type Fase,
  fechaLarga,
  type Item,
  type Paquete,
  redondearPrecio,
  sumarDias,
} from "./precio.ts";

type Fila = {
  id: string;
  numero: string;
  creado_en: string;
  cliente: string;
  contacto: string | null;
  proyecto: string;
  informe_id: string | null;
  brief: Record<string, unknown>;
  precio: Record<string, unknown> | null;
  aprobado: { modo: "paquetes" | "items"; paquetes?: Paquete[]; items?: Item[] } | null;
};

const num = (v: unknown, defecto = 0) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : defecto);

Deno.serve(async (req) => {
  const acceso = await clienteDelEquipo(req);
  if ("respuesta" in acceso) return acceso.respuesta;
  const { db } = acceso;

  let cuerpo: { cotizacion_id?: string; etapa?: string };
  try {
    cuerpo = await req.json();
  } catch (_e) {
    return responder(req, { error: "Solicitud inválida." }, 400);
  }
  const { cotizacion_id, etapa } = cuerpo;
  if (!cotizacion_id || !["precio", "carta"].includes(etapa ?? "")) {
    return responder(req, { error: "Falta la cotización o la etapa." }, 400);
  }

  const { data: fila, error } = await db.from("cotizaciones").select("*").eq("id", cotizacion_id).single<Fila>();
  if (error || !fila) return responder(req, { error: "No encontré esa cotización." }, 404);

  const guardar = (cambios: Record<string, unknown>) => db.from("cotizaciones").update(cambios).eq("id", cotizacion_id);

  try {
    // Resumen de la auditoría de Instagram, si la cotización viene de una.
    let contextoInforme: unknown = null;
    if (fila.informe_id) {
      const { data: inf } = await db.from("informes").select("cuenta, auditoria, estrategia").eq("id", fila.informe_id).single();
      if (inf?.auditoria && inf?.estrategia) {
        contextoInforme = {
          cuenta: `@${inf.cuenta}`,
          resumen: inf.auditoria.resumen,
          accion_principal: inf.auditoria.accion_principal,
          oportunidad: inf.estrategia.la_oportunidad,
          objetivo: inf.estrategia.objetivo,
          servicios_recomendados: inf.estrategia.servicios_recomendados,
        };
      }
    }

    if (etapa === "precio") {
      const tarifa = {
        tarifa_hora: num(fila.brief.tarifa_hora),
        margen_minimo: num(fila.brief.margen_minimo, 25),
        costos_terceros: num(fila.brief.costos_terceros),
      };
      if (!tarifa.tarifa_hora) throw new ErrorGeneracion("Falta la tarifa por hora del equipo para calcular el piso.");

      const propuesta = await generar(
        SISTEMA,
        promptPrecio({ cliente: fila.cliente, contacto: fila.contacto, proyecto: fila.proyecto, ...fila.brief }, contextoInforme, tarifa),
        ESQUEMA_PRECIO,
      ) as {
        fases: Fase[];
        precio_recomendado: number;
        paquetes: Paquete[];
        items: Item[];
        usar_paquetes: boolean;
        negociacion: { hasta: number; a_cambio_de: string[] };
        mercado: { minimo: number; maximo: number; explicacion: string };
      };

      // Cifras limpias y piso calculado en código.
      propuesta.precio_recomendado = redondearPrecio(propuesta.precio_recomendado);
      propuesta.paquetes = propuesta.paquetes.map((p) => ({ ...p, precio: redondearPrecio(p.precio) }));
      propuesta.items = propuesta.items.map((i) => ({ ...i, valor: redondearPrecio(i.valor) }));
      propuesta.negociacion.hasta = redondearPrecio(propuesta.negociacion.hasta);
      const piso = calcularPiso(propuesta.fases, tarifa);

      await guardar({
        precio: {
          ...propuesta,
          ...piso,
          ...tarifa,
          alertas: alertasPrecio(piso.piso, propuesta.precio_recomendado, propuesta.paquetes, propuesta.items, propuesta.negociacion.hasta),
        },
        aprobado: null,
        carta: null,
        estado: "precio",
        error: null,
      });
      return responder(req, { ok: true, estado: "precio" });
    }

    // carta
    if (!fila.aprobado) throw new ErrorGeneracion("Primero aprueba los precios.");
    const ahora = new Date();
    const vigencia = fechaLarga(sumarDias(ahora, num(fila.brief.vigencia_dias, 15)));
    const rondas = num(fila.brief.rondas_ajustes, 2);
    const inversion = fila.aprobado.modo === "paquetes"
      ? { paquetes: fila.aprobado.paquetes ?? [] }
      : { items: fila.aprobado.items ?? [] };

    const texto = await generar(
      SISTEMA,
      promptCarta({
        cliente: fila.cliente,
        contacto: fila.contacto,
        proyecto: fila.proyecto,
        brief: fila.brief,
        auditoria_instagram: contextoInforme,
        inversion_aprobada: inversion,
      }),
      ESQUEMA_CARTA,
    ) as Record<string, unknown> & { condiciones_extra: string[] };

    const pautaAparte = fila.brief.pauta_aparte === true;
    const carta = {
      ...texto,
      fecha: fechaLarga(ahora),
      vigencia,
      inversion: {
        ...inversion,
        nota: "Valores en pesos colombianos. Pivot no es responsable de IVA." +
          (pautaAparte ? " El presupuesto de pauta se paga directamente a la plataforma." : ""),
      },
      condiciones: [
        `${(fila.brief.condicion_pago as string) || "50% para iniciar y 50% contra entrega"}, por transferencia bancaria`,
        `Oferta válida hasta el ${vigencia}`,
        `${rondas} ${rondas === 1 ? "ronda" : "rondas"} de ajustes por entregable`,
        ...texto.condiciones_extra,
      ],
    };

    await guardar({ carta, estado: "listo", error: null });
    return responder(req, { ok: true, estado: "listo" });
  } catch (e) {
    const mensaje = e instanceof ErrorGeneracion
      ? e.message
      : "Algo falló al generar la cotización. Inténtalo de nuevo en unos minutos.";
    console.error("cotizacion", etapa, cotizacion_id, e);
    await guardar({ estado: "error", error: mensaje });
    return responder(req, { error: mensaje }, 500);
  }
});
