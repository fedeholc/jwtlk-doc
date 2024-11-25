# Frontend

El frontend está realizado en HTML, CSS y vanilla JavaScript.

## HTML & CSS

En el `index.html` se encuentra la estructura básica de la página. Asumo que quien está leyendo esto tiene conocimientos básicos de HTML por lo que no voy a entrar en detalles. Solo mencionaré un par de cosas.
El HTML tiene principalmente dos `<section>`, una para el formulario de login (`login-section`), que se muestra cuando no hay un usuario autenticado, y otra para mostrar los datos del usuario (`user-section`), que se muestra cuando sí lo hay.
Luego, para para las otras funcionalidades (registro, reseteo de contraseña, etc.) se utilizan elementos `<dialog>` que se muestran y ocultan según sea necesario.

Por último, mencionar que en los elementos HTML podemos encontrar atributos `data-*` que se utilizan para ser referenciados desde el JavaScript, atributos `data-testid` que se utilizan para ser referenciados desde los tests, y atributos `class` o `id` que se utilizan para ser referenciados desde el CSS.

El objetivo de esta separación es poder realizar cambios en cualquiera de las tres capas sin temor a que afecte a las otras. Por ejemplo, el siguiente elemento contiene los tres tipos de atributos mencionados:

```html
<div data-reset-code-info data-testid="send-info" class="info-slot"></div>
```

Como vemos, el atributo `data-reset-codo-info` funciona a modo de identificador y no re quiere de un valor. Luego lo utilizaremos para referenciarlo desde el JavaScript haciendo uso de `document.querySelector('[data-reset-code-info]')`. El atributo `data-testid` también funciona como identificador, pero en este caso sí requiere de un valor, ya que todos los elementos que usemos para los tests tendrán el formato `data-testid="identificador"`.

En cuanto al CSS, en algunos casos he aplicado directamente el estilo a las etiquetas HTML, y en otros he usado el atributo `class` para referenciar los elementos.
Vale aclarar que he utilizado la sintaxis de CSS nesting, que ya es soportada por los principales navegadores (ver en [Can I use](https://caniuse.com/css-nesting)). Pero si se requiere compatibilidad con navegadores más antiguos, con unos minutos de trabajo se puede cambiar a la sintaxis tradicional.
Por lo demás, el CSS es bastante sencillo y no tiene nada que requiera una explicación detallada.

## JavaScript

El punto de entrada de nuestro JavaScript es [**`script.js`**](https://github.com/fedeholc/jwtlk/blob/main/frontend/src/script.js).

Allí primero se importan algunas funciones y objetos que vamos a utilizar, y se inicializan dos variables globales; `userData` que va a contener la información del usuario autenticado, y `DE` (DOM Elements) que tendrá las referencias a los elementos HTML que vamos a utilizar.

Luego, una vez que el DOM está cargado, se llama a la función `main` que se encarga de inicializar la aplicación:

```js title="en frontend/src/script.js (fragmento)"
async function main() {
  DE = getDomElementsRefs(document);
  setEventListeners();

  let accessToken = await auth.getAccessToken();

  if (accessToken) {
    userData = auth.decodeUserFromToken(accessToken);
    auth.addVisit(accessToken);
  }

  renderUI();
}
```

Allí:

- Cargamos `DE` las referencias a los elementos HTML.
- Establecemos los eventos para los elementos HTML.
- Mediante `auth.getAccessToken` determinaremos si existen o no credenciales que nos permitan autenticar al usuario que ingresa a la página (y si es así guardar guardar sus datos en 'userData' y registrar su visita). Luego explicaré en detalle cómo funciona esto.
- Llamamos a `renderUI`, que realiza un renderizado condicional de la página muy sencillo: si el usuario está autenticado mostrará la sección del usuario con su información, y sino, mostrará la sección de login.

Una vez cargada la aplicación, queda a la espera de las acciones que pueda realizar el usuario.

Si no hay usuario autenticado las acciones posibles son:

- Registro del usuario mediante usuario y contraseña.
- Registro del usuario mediante autenticación con GitHub o Google.
- Login del usuario.
- Resetear la contraseña.

Si hay usuario autenticado las acciones posibles son:

- Logout del usuario.
- Borrado de la cuenta.
- Consulta de las visitas realizadas.

Cada una de esas acciones inician un flujo que involucra tanto al frontend como al backend. Veremos a continuación cómo es la implementación de cada uno de esos procesos.
