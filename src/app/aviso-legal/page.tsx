import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal — Mambo Cooking Total Gourmet",
  description: "Aviso legal y condiciones de uso de Mambo Cooking Total Gourmet.",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-gray">
      <h1>Aviso Legal</h1>
      <p><em>Última actualización: 11 de agosto de 2026</em></p>

      <h2>1. Información del titular</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la
        Sociedad de la Información y de Comercio Electrónico (LSSICE), se informa a los usuarios
        de que el titular del sitio web <strong>recetasmambo.com</strong> es:
      </p>
      <ul>
        <li><strong>Denominación social:</strong> Mambo Cooking Total Gourmet</li>
        <li><strong>Domicilio:</strong> España</li>
        <li><strong>Email:</strong> contacto@recetasmambo.com</li>
        <li><strong>Sitio web:</strong> https://recetasmambo.com</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        El presente Aviso Legal regula el uso del sitio web recetasmambo.com (en adelante, «el Sitio Web»).
        La utilización del Sitio Web atribuye la condición de usuario e implica la aceptación plena de todas
        las condiciones incluidas en este Aviso Legal.
      </p>

      <h2>3. Propiedad intelectual</h2>
      <p>
        Los contenidos del Sitio Web, incluyendo textos, imágenes, gráficos, logotipos, iconos, software
        y demás elementos, están sujetos a derechos de propiedad intelectual. Las recetas mostradas en este
        sitio proceden de fuentes públicas de internet y se muestran con atribución a sus autores originales.
      </p>
      <p>
        Las recetas originales pertenecen a sus respectivos autores. Este sitio las presenta con fines
        informativos y de transformación técnica (adaptación a la Cecotec Mambo Cooking Total Gourmet).
      </p>

      <h2>4. Responsabilidad</h2>
      <p>
        El titular del Sitio Web no se hace responsable de:
      </p>
      <ul>
        <li>Los daños y perjuicios que pudieran derivarse del uso de la información contenida en el Sitio Web.</li>
        <li>La exactitud, veracidad o actualización de las recetas mostradas.</li>
        <li>Los resultados obtenidos por el usuario al seguir las instrucciones de cocina proporcionadas.</li>
        <li>El contenido de las páginas web enlazadas desde este sitio.</li>
      </ul>

      <h2>5. Enlaces a terceros</h2>
      <p>
        El Sitio Web puede contener enlaces a páginas web de terceros. El titular no ejerce ningún control
        sobre dichos sitios y no asume responsabilidad alguna por su contenido, precisión o funcionamiento.
      </p>

      <h2>6. Publicidad</h2>
      <p>
        Este sitio web puede incluir espacios publicitarios proporcionados por terceros (Google AdSense).
        Los anuncios mostrados son responsabilidad exclusiva de los anunciantes. El titular del Sitio Web
        no se hace responsable del contenido de los anuncios.
      </p>

      <h2>7. Protección de datos</h2>
      <p>
        Para más información sobre el tratamiento de datos personales, consulta nuestra{" "}
        <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>8. Legislación aplicable</h2>
      <p>
        El presente Aviso Legal se rige por la legislación española. Para cualquier controversia,
        las partes se someten a los juzgados y tribunales de España.
      </p>
    </div>
  );
}
