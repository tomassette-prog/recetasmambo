import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — Mambo Cooking Total Gourmet",
  description: "Política de privacidad de Mambo Cooking Total Gourmet.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-gray">
      <h1>Política de Privacidad</h1>
      <p><em>Última actualización: 11 de agosto de 2026</em></p>

      <h2>1. Información que recopilamos</h2>
      <p>
        Cuando visitas nuestro sitio web, podemos recopilar la siguiente información:
      </p>
      <ul>
        <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia.</li>
        <li><strong>Cookies:</strong> Utilizamos cookies técnicas necesarias para el funcionamiento del sitio, y cookies de análisis (Google Analytics) para mejorar la experiencia del usuario.</li>
        <li><strong>Datos de suscripción:</strong> Si te suscribes a nuestro newsletter, recopilamos tu dirección de email.</li>
      </ul>

      <h2>2. Finalidad del tratamiento</h2>
      <p>Los datos recopilados se utilizan para:</p>
      <ul>
        <li>Mejorar el contenido y la experiencia de navegación.</li>
        <li>Enviar newsletters con recetas y novedades (solo si has dado tu consentimiento).</li>
        <li>Mostrar publicidad personalizada a través de Google AdSense.</li>
        <li>Análisis estadístico del tráfico web.</li>
      </ul>

      <h2>3. Google AdSense</h2>
      <p>
        Este sitio web utiliza Google AdSense, un servicio de publicidad proporcionado por Google Inc.
        Google AdSense utiliza cookies para mostrar anuncios basados en las visitas anteriores del usuario
        a nuestro sitio u otros sitios web. Puedes obtener más información sobre cómo Google utiliza los
        datos en la{" "}
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
          Política de privacidad de Google
        </a>.
      </p>
      <p>
        Los usuarios pueden inhabilitar la publicidad personalizada de Google visitando{" "}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
          Configuración de anuncios de Google
        </a>.
      </p>

      <h2>4. Cookies</h2>
      <p>
        Utilizamos los siguientes tipos de cookies:
      </p>
      <ul>
        <li><strong>Cookies técnicas:</strong> Necesarias para el funcionamiento del sitio.</li>
        <li><strong>Cookies de análisis:</strong> Google Analytics para estadísticas de visitas.</li>
        <li><strong>Cookies de publicidad:</strong> Google AdSense para mostrar anuncios relevantes.</li>
      </ul>
      <p>
        Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envía una cookie.
      </p>

      <h2>5. Enlaces de afiliados</h2>
      <p>
        Este sitio contiene enlaces de afiliados de Amazon. Si realizas una compra a través de estos enlaces,
        recibimos una pequeña comisión sin coste adicional para ti. Esto nos ayuda a mantener el sitio y seguir
        creando contenido gratuito.
      </p>

      <h2>6. Derechos del usuario</h2>
      <p>
        Tienes derecho a acceder, rectificar, suprimir y portar tus datos personales, así como a oponerte
        al tratamiento y solicitar la limitación del mismo. Para ejercer estos derechos, contacta con nosotros
        en: <strong>contacto@recetasmambo.com</strong>
      </p>

      <h2>7. Cambios en esta política</h2>
      <p>
        Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento.
        Los cambios serán efectivos inmediatamente después de su publicación en el sitio web.
      </p>
    </div>
  );
}
