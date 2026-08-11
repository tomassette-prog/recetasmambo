import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — Mambo Cooking Total Gourmet",
  description: "Política de cookies de Mambo Cooking Total Gourmet.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-gray">
      <h1>Política de Cookies</h1>
      <p><em>Última actualización: 11 de agosto de 2026</em></p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas
        un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más
        eficiente, así como para proporcionar información a los propietarios del sitio.
      </p>

      <h2>¿Qué cookies utilizamos?</h2>

      <h3>Cookies técnicas (necesarias)</h3>
      <p>
        Son esenciales para el funcionamiento del sitio web. No requieren consentimiento.
      </p>
      <ul>
        <li><strong>Cookie de sesión:</strong> Mantiene tu sesión activa mientras navegas.</li>
        <li><strong>Cookie de preferencias:</strong> Recuerda tus preferencias de idioma y configuración.</li>
      </ul>

      <h3>Cookies de análisis</h3>
      <p>
        Nos ayudan a entender cómo los visitantes interactúan con el sitio web.
      </p>
      <ul>
        <li><strong>Google Analytics (_ga, _gid):</strong> Recopila información anónima sobre las visitas,
        páginas más vistas, tiempo de permanencia, etc. Duración: 2 años (_ga), 24 horas (_gid).</li>
      </ul>

      <h3>Cookies de publicidad</h3>
      <p>
        Se utilizan para mostrar anuncios relevantes para el usuario.
      </p>
      <ul>
        <li><strong>Google AdSense:</strong> Muestra anuncios personalizados basados en tu historial
        de navegación. Puedes inhabilitar la publicidad personalizada en{" "}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
          Configuración de anuncios de Google
        </a>.</li>
        <li><strong>Amazon Afiliados:</strong> Cookies de seguimiento para las compras realizadas
        a través de enlaces de afiliados de Amazon.</li>
      </ul>

      <h2>¿Cómo gestionar las cookies?</h2>
      <p>
        Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando
        se envía una cookie. A continuación tienes los enlaces para gestionar cookies en los
        navegadores más populares:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>Contacto</h2>
      <p>
        Si tienes preguntas sobre nuestra política de cookies, contacta con nosotros en:{" "}
        <strong>contacto@recetasmambo.com</strong>
      </p>
    </div>
  );
}
