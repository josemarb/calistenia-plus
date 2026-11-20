# Calistenia+ · Entrenador personal para iPhone

Una aplicación web progresiva (PWA) gratuita, en castellano, para instalar desde Safari y GitHub Pages. No necesita Mac, Xcode, base de datos ni servidor de pago.

## Qué incluye

- Perfil editable: edad, peso, altura, objetivo, nivel, equipo disponible, posibles zonas a proteger, días por semana y marcas iniciales de flexiones/plancha.
- Plan de cuerpo completo con 2–6 sesiones semanales, variantes según nivel/equipo, repeticiones o segundos orientativos y ajuste gradual al registrar esfuerzo percibido (RPE).
- Biblioteca de partida con más de 40 ejercicios; en línea se completa con más de 100 ejercicios de peso corporal de `free-exercise-db`.
- Fotografías de demostración para ejercicios de la biblioteca fotográfica, y 12 vídeos CC0 de ejercicios seleccionados (se reproducen en streaming con internet).
- Temporizador de descanso, registro por serie, historial, tendencias por movimiento y peso corporal.
- Copia/exportación e importación JSON desde la pestaña **Progreso**.
- Funciona parcialmente sin conexión después de abrirla en línea: interfaz, perfil, rutinas y registros; medios externos y nuevas fichas requieren conexión.

## Publicar con GitHub Pages desde iPhone

1. Descarga el ZIP de Calistenia+ y **descomprímelo en la app Archivos** del iPhone (mantén pulsado el ZIP y toca Descomprimir).
2. En Safari, entra en `https://github.com/new`, inicia sesión y crea un repositorio **público** con el nombre `calistenia-plus` (puedes usar otro nombre). Es más fácil dejar sin marcar «Add a README file», ya que aquí va incluido.
3. Abre tu repositorio → **Add file → Upload files**. Selecciona todos los archivos descomprimidos, **no el ZIP**, y pulsa **Commit changes**. Todos los archivos del paquete están en la misma carpeta, sin subcarpetas.
4. Ve a **Settings → Pages**. En **Build and deployment**, escoge **Deploy from a branch**, rama **main** y carpeta **/(root)**; pulsa **Save**.
5. Cuando GitHub Pages haya finalizado la publicación, abre `https://TU-USUARIO.github.io/calistenia-plus/` con **Safari**.
6. Pulsa **Compartir** → **Añadir a pantalla de inicio** → **Añadir**. La app aparecerá con su icono.

> GitHub puede cambiar ligeramente los textos de los menús. El enlace definitivo aparece en Settings → Pages. La primera instalación requiere HTTPS y conexión a Internet.

## Privacidad

No solicita registro ni envía tu perfil a un servidor propio. Los datos se almacenan en el espacio local del navegador del dispositivo, por lo que **pueden perderse si se borran los datos de Safari, se cambia de iPhone o se elimina la app**. Exporta copias JSON periódicamente. No existe sincronización entre dispositivos en esta versión.

## Bibliotecas externas y licencias

- `yuhonas/free-exercise-db` (conjunto de ejercicios y fotografías): Unlicense. `https://github.com/yuhonas/free-exercise-db`.
- `namnq/workout-free-videos` (vídeos y metadatos): CC0 1.0, versión v2.0.0. `https://github.com/namnq/workout-free-videos`.

Los recursos externos no se incluyen en el ZIP, se cargan desde dominios de GitHub y jsDelivr cuando hay conexión. La disponibilidad de imágenes y vídeos depende de esos proveedores.

## Salud y ejercicio

Las recomendaciones de volumen son orientativas y no representan una valoración médica. Si existe dolor, lesión, mareo u otra limitación, se debe detener el ejercicio y consultar a un profesional cualificado. El sistema aumenta poco a poco los objetivos **según los registros y el esfuerzo declarado**; no puede comprobar la técnica ni evaluar lesiones.

## Estructura

- `index.html`: interfaz y navegación
- `styles.css`: diseño responsive iPhone
- `exercises.js`: catálogo inicial y vídeos públicos seleccionados
- `app.js`: lógica del entrenador y almacenamiento
- `manifest.webmanifest`, `sw.js`, iconos: instalación PWA y funcionamiento parcialmente sin conexión
