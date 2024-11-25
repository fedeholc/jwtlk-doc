---
sidebar_position: 2
---

# Soluciones con JWT

## Qué es JSON Web Token

En general, un token no es más que una cadena de texto que se usa como credencial digital temporal. Es enviada a un usuario después de que se ha autenticado correctamente, y sirve justamente como prueba de que alguien se ha identificado y tiene permiso para acceder a ciertos recursos.

JSON Web Token es un estándar abierto que define la forma que debe que tener el token. Un token JWT tiene tres partes: encabezado, payload y firma. El encabezado y el payload son objetos JSON, que se codifican en [Base64Url](https://base64.guru/standards/base64url) y se separan por un punto. La firma se crea a partir del encabezado y el payload, y se usa para verificar que el token no ha sido modificado.

Ejemplo de un JWT con el encabezado y el payload codificados:
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo2NCwiZW1haWwiOiJmZWRlcmljb2hvbGNAZ21haWwuY29tIn0sInJlbWVtYmVyTWUiOnRydWUsImlhdCI6MTczMDE2MDY0NSwiZXhwIjoxNzMwMTY0MjQ1fQ.XxmP5K5ytbfOPS-AUhqNeF5dyGMek6G-kc9LWiaQMUE`

El encabezado decodificado:

```JSON
{
    "alg": "HS256",
    "typ": "JWT"
}
```

Allí se indica que el algoritmo de encriptación es [HMAC con SHA-256](https://auth0.com/blog/json-web-token-signing-algorithms-overview/#:~:text=RFC%207518.-,HMAC%20algorithms,-This%20is%20probably) y que el tipo de token es JWT.

El payload decodificado:

```JSON
{
  "user": {
    "id":64,
    "email":"federicoholc@gmail.com"
  },
  "rememberMe":true,
  "iat":1730160859,
  "exp":1730164459
}
```

En este caso el payload contiene información sobre el usuario, como su id y su email, y también información sobre el token, como la fecha de emisión y la fecha de expiración.

La firma se crea a partir del encabezado, el payload y una clave secreta. La usaremos para que cuando el servidor reciba el token (al momento de la autenticación), pueda verificar que este no ha sido modificado. En nuestro ejemplo, la firma es `XxmP5K5ytbfOPS-AUhqNeF5dyGMek6G-kc9LWiaQMUE`.

:::note
Te recomiendo que veas cómo se codifican, decodifican y verifican los tokens JWT en el anexo: [**Manipular JWTs**](/docs/anexos/manipular-jwt.md). Allí encontrarás también una explicación sobre las claves secretas utilizadas para firmar los tokens.
:::

## Sistemas de autenticación con JWT

Trabajar con JWTs presenta algunas ventajas según como se los utilice. Pueden ser firmados digitalmente, lo que permite al servidor enviar el token en una cookie y luego al recibirla comprobar que es válido y que no ha sido modificado, sin tener que consultar la base de datos. Además, el token puede contener información sobre el usuario, lo que evita tener que requerirla en otra petición al servidor. Por otro lado, por los motivos mencionados el servidor no necesita almacenar la sesión del usuario, lo que puede ser una ventaja en términos de escalabilidad.

No hay una única forma de implementar un sistema de autenticación con JWT, veremos a continuación cómo sería un un sistema de un solo token y un sistema de dos tokens, con las ventajas y desventajas de cada uno.

### Sistema de un solo token

Un sistema de un solo token funcionaría del siguiente modo:

- El usuario inicia sesión con sus credenciales, que se envían en una petición al servidor.
- Si los datos son correctos, el servidor crea un token JWT, que contiene información sobre el usuario y que es firmado digitalmente, y lo envía al cliente.
- El cliente guarda el token, que luego envía en cada petición al servidor.
- El servidor recibe el token, lo decodifica y verifica la firma. Si es válido, sabe que el usuario está autenticado y devuelve lo pedido por el cliente. Si no es válido o ha expirado, el servidor devuelve un error para que el cliente redirija al usuario a la página de inicio de sesión.

Lo que no he mencionado es dónde se guarda y cómo se envía el token. Tenemos nuevamente dos posibilidades: guardarlo en el local storage o en una cookie. Veamos que sucede en cada uno de estos casos.

Con el token guardado en LocalStorage el sistema es vulnerable a ataques de tipo XSS (Cross-Site Scripting), ya que JavaScript tiene acceso a LocalStorage. Si bien se pueden y se deben tomar medidas de seguridad, la protección contra XSS puede ser difícil de garantizar completamente. Por eso, en escenarios de aplicaciones públicas, generalmente se desaconseja almacenar datos de autenticación en LocalStorage.

Con el token guardado en una cookie segura y HttpOnly se previene el acceso al token desde scripts del lado del cliente, lo que protege contra XSS.
Pero podría ser vulnerable a ataques de tipo CSRF (Cross-Site Request Forgery). Esto se puede mitigar de distintas formas: desde configuraciones sencillas, como `SameSite=strict`, que asegura que solo se acepten peticiones del mismo origen (adecuado para aplicaciones en un solo dominio), hasta enfoques más complejos, como incluir un token CSRF en la cookie y en el header de la petición para verificar que coincidan. Con todas estas medidas podemos lograr mayor seguridad, pero también aumentamos la complejidad del sistema.

Más allá de dónde se almacenen, se podría mejorar la seguridad usando tokens de corta duración para reducir el tiempo en el que se puede usar un token robado, pero estaríamos resignando la comodidad del usuario, quien tendría que ingresar sus credenciales con frecuencia.
Por el contrario, si el token es de larga duración aumenta el tiempo en el cual un token interceptado podría ser usado por un atacante. Para mitigar esto podríamos implementar una lista de denegación de tokens, pero ello requiere consultar la base de datos en cada petición para verificar si el token está revocado, lo cual tiene un costo en rendimiento/escalabilidad.

### Sistema de dos tokens

Como vimos en el caso anterior, es imposible lograr máxima seguridad, comodidad y rendimiento al mismo tiempo. Pero utilizando una combinación de token de acceso y token de refresco, podemos lograr un sistema que garantice eficiencia, comodidad y un alto nivel de seguridad. Pero como veremos, esto implica una mayor complejidad en la implementación.

El funcionamiento sería el siguiente:

- El usuario inicia sesión con sus credenciales, que se envían en una petición al servidor. Si los datos son correctos, el servidor crea dos tokens:
  - Un token de acceso, que va a ser de corta duración (ej. 15 minutos), va a contener la información del usuario en el payload, y va a ser enviado mediante la respuesta del servidor en formato JSON.
  - Un token de refresco, que va a ser de larga duración (ej. 30 días), va a contener también la información del usuario en el payload, pero va a ser enviado mediante la respuesta del servidor en una cookie segura y HttpOnly.
- El cliente va a guardar los dos tokens, el de acceso en el local storage y el de refresco en la cookie.
- En las siguientes peticiones al servidor, el cliente va a enviar el token de acceso.
- El servidor lo va a recibir, decodificar y verificar (sin necesidad de consultar a una base de datos). Si es válido, devolverá lo pedido por el cliente. Si no es válido o ha expirado, devolverá un error.

A los pasos mencionados hay que agregar que antes de realizar cada petición al servidor, el navegador va a verificar si el token de Acceso ha expirado. Si no ha expirado y por lo tanto sigue siendo válido, lo enviará al servidor en la petición. Pero si ha expirado, ocurrirá lo siguiente:

- El navegador enviará el token de refresco al servidor mediante cookies.
- El servidor comprobará si dicho token ha expirado o si ha sido incluido en una lista de denegación (lo cual requiere de la consulta a la base de datos).
  - Si sigue siendo válido, el servidor devolverá un nuevo token de acceso que el cliente guardará y utilizará en las siguientes peticiones.
  - Si ya no es válido, devolverá un error, y el cliente redirigirá al usuario a la página de inicio de sesión para que ingrese sus credenciales. La frecuencia con que esto ocurrirá dependerá del tiempo de expiración que establezcamos para nuestro token de refresco (en la configuración inicial de nuestra aplicación de ejemplo, es de 30 días).

**¿Qué ventajas y desventajas tiene el sistema que acabamos de describir?**

- Al igual que con un sistema de un solo token guardado en local storage, nuestro token de Acceso puede ser vulnerable a ataques XSS, pero el riesgo se reduce, ya que es de corta duración y se renueva usando el token de Refresco.
- Este último, almacenado en una cookie HttpOnly, tiene protección contra XSS, pero podría ser vulnerable a CSRF. Esto nos pone en una situación similar a la del sistema de un solo token guardado en una cookie. Sin embargo, en este caso contamos con algunas ventajas:
- El sistema de un solo token para que sea cómodo tenía que utilizar un token de larga duración que no podía ser revocado (lo cual era inseguro), a menos que se consultara la base de datos en cada petición (lo cual era negativo en términos de rendimiento/escalabilidad).
- En el sistema de dos tokens podemos tener la comodidad que brinda el token de larga duración, pero con la posibilidad de revocarlo si es necesario. Esto se logra mediante la lista de denegación de tokens que se consulta solo al renovar el token de acceso. Es cierto que la revocación no es inmediata como si lo sería si consultáramos la base de datos en cada petición, pero el margen de tiempo entre la revocación y su efectividad está limitado por la duración del token de acceso (15 minutos en nuestra aplicación). De esta forma cedemos un poco de seguridad para ganar en rendimiento y escalabilidad.

:::note
Te recomiendo la lectura anexo: [**Las listas de denegación de tokens**](/docs/anexos/listas-denegacion.md), para entender mejor su utilidad.
:::

### ¿Qué opción elegir?

Como mencioné antes, hay que evaluar nuestros objetivos, prioridades y el contexto de uso. Por mi parte, quise implementar el sistema con token de acceso y de refresco a pesar de que es más simple el de un solo token, justamente por ese motivo: para aprender a realizar la versión más compleja. 

Pero para un proyecto sin mucho tráfico simultáneo, quizás un sistema de un solo token con cookies HttpOnly sea suficiente. O tal vez se cuentan con los recursos necesarios para implementar un sistema aún más seguro y complejo, con sesiones en el servidor utilizando caché o bases de datos en memoria.

De cualquier modo, lo aquí planteado no son más que conjeturas y un punto de partida para aprender, y tener más herramientas la hora de evaluar cuál es la opción conveniente para nuestras necesidades.