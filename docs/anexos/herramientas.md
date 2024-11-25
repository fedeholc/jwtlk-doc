# Herramientas del navegador

Veremos a continuación las herramientas que nos brindan los navegadores tanto para almacenar información como para transmitirla. En nuestro caso particular queremos pensar como guardamos y enviamos las credenciales del usuario para autenticarlo. Además repasaremos cuáles son los ataques a los que son vulnerables estas herramientas y cómo podríamos evitarlos.
Será con todos estos elementos que tendremos que decidir cómo implementar la autenticación en nuestra aplicación.

## HTTP vs HTTPS

Hoy en día, en las aplicaciones web, la comunicación entre el cliente y el servidor se realiza generalmente mediante el protocolo HTTP Secure (HTTPS), que es una versión segura de su original HTTP, y los navegadores advierten a los usuarios cuando una página no está protegida por HTTPS. Esto se debe a que HTTP envía toda la información en texto plano, lo que significa que cualquier intermediario entre el cliente y el servidor puede leer o modificar todos los datos transmitidos, incluyendo contraseñas, mensajes, información personal, etc. En cambio, HTTPS añade una capa de seguridad mediante SSL/TLS que proporciona:

- Cifrado: toda la comunicación va encriptada, por lo que aunque alguien intercepte los datos, no podrá leerlos sin la clave de descifrado.
- Autenticación: mediante certificados digitales, el navegador puede verificar que está realmente conectándose al servidor correcto y no a un impostor (evita ataques "man in the middle").
- Integridad: garantiza que los datos no han sido modificados durante la transmisión.

Por ello es que doy por sentado que si nuestra aplicación va a realizar autenticación, lo hará sobre HTTPS. Por lo cual cuando enviemos las credenciales del usuario, ya sea que lo hagamos en forma de texto o de token, en el header o en el cuerpo de una petición o en una cookie, estaremos seguros de que nadie podrá interceptarlas y leerlas.

## Almacenamiento de información en el navegador

En lo que respecta a guardar de información, los navegadores actuales (JavaScript mediante), nos ofrecen distintas posibilidades:

- **Memoria**: podemos almacenar información en variables, pero si se cierra la pestaña o se recarga la página se pierden los datos.
- **Local Storage**: es un mecanismo de almacenamiento que permite guardar datos en formato clave-valor de manera persistente, sin fecha de expiración y con un límite de entre 5 y 10MB dependiendo del navegador.
- **Session Storage**: es similar a Local Storage, pero los datos se eliminan cuando se cierra la pestaña.
- **Index DB**: es una base de datos en el navegador que permite almacenar datos de manera estructurada y con un límite de entre 50 y 500MB.
- **Cache API**: es una interfaz de JavaScript que permite a las aplicaciones web almacenar y gestionar recursos en caché en el navegador de manera persistente entre sesiones.
- **Cookies**: son pequeños archivos de texto que se almacenan en el navegador y y tienen un límite de 4KB. Se les puede establecer un tiempo de expiración, y pueden ser creadas y enviadas desde el servidor hacia el cliente y viceversa.

Dado que queremos tener persistencia aún cuando se recarga la página o se cierra la pestaña o el navegador, podemos descartar la opción de trabajar con en memoria o con session storage. A nuestros fines de guardar la autenticación, Index DB y Cache API no aportan nada que no podamos hacer con Local Storage, y son más complejos de utilizar. Además presentan el mismo y principal problema que Local Storage y que veremos a continuación: dado que JavaScript tiene acceso a ellos, son vulnerables a ataques de tipo XSS (Cross-Site Scripting).

## ¿Qué es el Cross-Site Scripting (XSS)?

Cross-site scripting (XSS) es una vulnerabilidad de seguridad que permite a un atacante inyectar en un sitio web código malicioso del lado del cliente. El código inyectado se ejecuta en el navegador de la víctima, y puede ser utilizado para robar información, secuestrar sesiones, redirigir a otros sitios, etc.

**En general hay 3 tipos de ataques XSS:**

- **XSS Reflejado**: el código malicioso se inserta en la URL o en un formulario y se envía al servidor, el cual lo refleja en la respuesta. El atacante engaña a la víctima para que haga clic en un enlace especialmente diseñado con dicho código.
- **XSS Persistente (o almacenado)**: el código malicioso se almacena en el servidor (por ejemplo en una base de datos) y afecta a todos los usuarios que acceden a esa parte del sitio. Es más peligroso porque se ejecuta cada vez que los usuarios acceden a la página comprometida.
- **XSS Basado en DOM**: el ataque no pasa por el servidor, sino que se ejecuta directamente en el navegador de la víctima mediante manipulación del Document Object Model (DOM) de la página.

**¿Qué puede hacer un atacante con XSS?**

- **Robo de cookies de sesión**: el script malicioso puede acceder a las cookies de sesión de la víctima y enviarlas al atacante, quien podría usarlas para hacerse pasar por el usuario afectado.
- **Redireccionamientos maliciosos**: el atacante puede redirigir a la víctima a un sitio falso para robar información.
- **Registro de pulsaciones de teclas**: con scripts, el atacante podría capturar todo lo que la víctima teclea en una página, incluyendo datos sensibles como contraseñas.

**¿Qué podemos hacer para prevenir XSS?**

- **Escapar o codificar las entradas**: convertir caracteres especiales en su representación HTML, de modo que no se interpreten como código.
- **Uso de Content Security Policy (CSP)**: una política de seguridad en el navegador que permite especificar de dónde puede cargarse el contenido, limitando la ejecución de scripts no autorizados.
- **Validación y sanitización de datos**: verificar y limpiar las entradas de los usuarios, aceptando solo los datos esperados y rechazando scripts maliciosos.

Se pueden encontrar ejemplos de ataques XSS y cómo prevenirlos en los siguientes enlaces:

- https://medium.com/sessionstack-blog/how-javascript-works-5-types-of-xss-attacks-tips-on-preventing-them-e6e28327748a
- https://vercel.com/guides/understanding-xss-attacks
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

En el caso del código que se presenta en está guía la única entrada de datos que se muestra en pantalla es el email del usuario. El email se valida en el frontend mediante el input, y en el backend utilizando Joi. Además, estamos mostrando el email mediante textContent (no por innerHTML), por lo que no debería haber problemas con XSS. En caso de que tengamos una aplicación que requiera mostrar más entradas de datos del usuario, deberíamos escapar el HTML y sanitizar los datos, para lo cuál una de las librerías más utilizadas y probadas es DOMPurify.

En cuanto a la CSP, esta una capa de seguridad adicional que podemos agregar a nuestra aplicación para protegernos de ataques XSS (y otros). La CSP se configura en el servidor y se envía al navegador a través de la cabecera HTTP `Content-Security-Policy`. Se puede especificar qué tipos de contenido (scripts, estilos, imágenes, etc.) pueden ser cargados en una página, y desde dónde pueden ser cargados. Por ejemplo, se puede configurar para que solo se carguen scripts desde un dominio específico, o para que no se carguen scripts en absoluto.

En la aplicación de esta guía el backend no devuelve HTML, solo JSON, por lo que no necesitamos configurar CSP allí. En caso de realizar una aplicación en node/express que devuelva HTML, se suele utilizar la librería Helmet, que incluye un middleware para configurar CSP.

Si se tiene un frontend por separado, se puede configurar la CSP en el archivo HTML, o en el servidor que tiene el frontend (por ejemplo, si se utiliza Vercel para desplegar este proyecto en vanilla JavaScript, hay que configurarla en un archivo `vercel.json`). Hacerlo en el servidor permite definir algunas reglas que no están disponibles si se lo hace en el HTML (frame-ancestors, sandbox, report-uri). En el caso de esta guía como el proyecto no tiene definido un servidor en el cual configurar la CSP, la configuraremos en el HTML (`index.html`).

Tener en cuenta que la CSP que encontrarás allí definida es restrictiva en cuanto a los orígenes de los scripts, imágenes, etc (deben provenir del mismo dominio), por lo que si se utiliza una CDN o se cargan scripts de otros dominios, habrá que agregar excepciones. Por otra parte la CSP esta configurada inicialmente para permitir conectarse a cualquier API externa, para que funcione con el backend de este proyecto ya sea que esté desplegado o corriendo localmente. Es importante que en caso de utilizar el código en otro proyecto se configure la CSP para permitir solo las conexiones necesarias.

Dejo aquí algunos enlaces para quien quiera o necesite profundizar en el estudio el tema:

- https://web.dev/articles/csp
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP
- https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

## Cookies

Cuando mencionamos las distintas formas de almacenamiento posibles en el navegador mencionamos a las cookies. 

Cuando las cookies son creadas y enviadas por el servidor, se pueden marcar como `HttpOnly` para que no puedan ser leídas por JavaScript desde el cliente, es decir que la cookie va y vuelve hacia el servidor pero no puede ser leída por un script en la página. De esa forma, y a diferencia de lo que ocurre con LocalStorage y demás formas de almacenamiento, las cookies quedan protegidas contra ataques de tipo XSS. 

Además las cookies se pueden marcar como seguras `Secure` para que solo se envíen si la comunicación tiene lugar mediante HTTPS. Y también pueden ser firmadas digitalmente para que el servidor verifique que no han sido interceptadas y modificadas. En nuestro caso no firmamos la cookie pues solo contiene el token que ya tiene su propia firma.

## Cross-Site Request Forgery (CSRF)

La principal vulnerabilidad a la que están expuestas las cookies el el
Cross-Site Request Forgery (CSRF) o falsificación de petición en sitios cruzados, que es un tipo de ataque en el que se engaña al usuario para que realice acciones no deseadas en un sitio web en el que está autenticado.

Cuando un usuario inicia sesión en un sitio web legítimo, el servidor genera cookies de sesión o con tokens que se almacenan en el navegador y permiten al servidor identificar al usuario en cada petición subsiguiente, verificando que está autorizado para realizar acciones en su cuenta.

El problema surge porque los navegadores envían automáticamente todas las cookies asociadas a un dominio cada vez que se hace una petición a ese sitio, independientemente de dónde se origine dicha petición. Los atacantes explotan esta característica creando páginas que contienen solicitudes ocultas dirigidas a sitios donde el usuario está autenticado. Por ejemplo, si un usuario está conectado a su banco y visita una página maliciosa, esta podría contener código que automáticamente envíe una solicitud de transferencia al servidor del banco, y el navegador incluiría las cookies de sesión válidas en esta petición.

La gestión adecuada de cookies es crucial para prevenir estos ataques. Una de las medidas más importantes es configurar el atributo `SameSite` de las cookies. Cuando se establece como `Strict`, las cookies solo se envían en peticiones que se originan desde el mismo sitio, bloqueando efectivamente las solicitudes cross-site maliciosas. La opción `Lax` brinda un equilibrio entre seguridad y funcionalidad, permitiendo solo algunas peticiones cross-site en situaciones específicas como hacer clic en enlaces.

En nuestro código hemos implementado las cookies con `SameSite=Strict` para protegernos de ataques CSRF.

Si se quiere tener aún más seguridad es posible implementar tokens CSRF, los cuales permiten establecer un mecanismo de verificación de doble cara entre el cliente y el servidor. Cuando un usuario legítimo accede a un formulario o inicia una sesión, el servidor genera un token único y aleatorio que se almacena tanto en el servidor (generalmente en la sesión del usuario) como en el cliente (típicamente en un campo oculto del formulario o en el estado de la aplicación). Este token actúa como una firma digital temporal que vincula la sesión del usuario con sus peticiones subsiguientes, asegurando que cada solicitud que modifica datos en el servidor proviene genuinamente de un formulario o interfaz proporcionada por el propio sitio web.

La efectividad de los tokens CSRF radica en que un atacante, no podrá replicar o generar un token válido, ya que son únicos para cada sesión y están protegidos contra la lectura desde otros dominios. Cuando el servidor recibe una petición, verifica que el token enviado coincida exactamente con el almacenado en la sesión del usuario, rechazando automáticamente cualquier solicitud que no incluya un token válido. Esta verificación es particularmente valiosa porque, a diferencia de las cookies que se envían automáticamente con cada petición, los tokens CSRF requieren ser incluidos explícitamente por el código de la aplicación legítima, creando así una distinción clara entre las peticiones auténticas y las maliciosas.

Los tokens CSRF, aunque efectivos para la seguridad, presentan varios desafíos  en su implementación y uso. Desde el punto de vista del rendimiento, añaden una sobrecarga en cada petición al requerir validación en el servidor y aumentar el tamaño de las solicitudes, lo que puede ser especialmente notable en sistemas con alto tráfico. La implementación se complica al necesitar sincronización entre frontend y backend, gestión de tokens expirados y manejo de errores, además de añadir complejidad al código y su mantenimiento. En arquitecturas modernas, pueden surgir problemas con operaciones en múltiples pestañas, caché de navegador y CDNs, mientras que en sistemas distribuidos requieren estrategias adicionales para la sincronización entre servidores.

En la aplicación de esta guía, no implementé CSRF tokens ya que prioricé un sistema de JWT sin sesiones del lado del servidor, y las cookies con `SameSite=Strict` nos brindan una buena protección contra ataques CSRF.

Para quien quiera profundizar en el tema dejo los siguientes enlaces:

- https://portswigger.net/web-security/csrf
- https://owasp.org/www-community/attacks/csrf
- https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSRF_prevention
