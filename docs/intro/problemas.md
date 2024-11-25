# Problemas a resolver

Si queremos un sistema de autenticación, es porque estamos pensando en una aplicación en el que el acceso a ciertos recursos o funcionalidades dependa de quién sea el usuario que lo solicita.

Tenemos entonces un primer problema que es el de la **autenticación inicial**: ¿cómo hacemos para que un usuario nos diga quién es, y que el servidor lo reconozca como tal? Esto se puede resolver de muchas formas, por ejemplo, mediante el ingreso de un nombre de usuario y una contraseña.

Pero luego hay un segundo problema: la **persistencia de la autenticación** (o manejo de sesiones). Este proviene del hecho de que el navegador se comunica con el servidor mediante HTTP, que es un protocolo sin estado: cada petición que se hace al servidor es independiente de las demás, por lo que en principio no hay forma de saber si dos peticiones provienen de un mismo usuario. ¿Cómo hacemos entonces para que el servidor sepa quién es el usuario sin que éste tenga que identificarse manualmente (ingresando usuario y contraseña en nuestro ejemplo) cada vez que interactúa con el servidor (lo cual resultaría en una experiencia muy molesta)?

Para evaluar cómo resolver estos problemas necesitamos tener ciertos conocimientos respecto a cómo los navegadores pueden almacenar datos, como se comunican con los servidores, a que tipo de ataques están expuestos, y como podemos protegernos de ellos.

:::info

Si ya tenés conocimientos sobre https, local storage, cookies, XSS y CSRF, podés continuar con la siguiente sección. De lo contrario, es importante que leas el siguiente anexo antes de continuar: **[Las herramientas del navegador](/docs/anexos/herramientas.md).**

:::

## Métodos de autenticación inicial

Como usuario de Internet seguramente ya conozcas los métodos más comunes de autenticación inicial:

1. **Usuario y Contraseña**  
   Se ingresa un nombre de usuario y una contraseña, que son validados contra una base de datos del lado del servidor. Si los datos son correctos, el usuario es autenticado.

2. **Uso de credenciales de otros servicios mediante OAuth 2.0**  
   El protocolo OAuth 2.0 permite a una aplicación (la nuestra) obtener permiso para acceder a los recursos de un usuario (por ejemplo su nombre o email) en otro servicio (Google, GitHub, etc.) sin tener que conocer su contraseña. Es decir que el usuario es dirigido desde nuestra a aplicación hacia otro servicio, en el que ingresa sus credenciales, y si son válidas nuestra aplicación recibe sus datos y lo considera como autenticado.

3. **Magic Links**  
   El usuario ingresa su email, y recibe un correo con un enlace, generalmente de uso único y temporal, que al ser clickeado lo autentica automáticamente, sin necesidad de ingresar una contraseña.

4. **Autenticación de Dos Factores (2FA)**  
   Este método incrementa la seguridad combinando dos métodos de autenticación. Por ejemplo, el usuario ingresa su nombre de usuario y contraseña, y luego debe ingresar un código que recibe en su teléfono, email, o aplicación de autenticación.

### El registro del usuario

Las descripciones de los métodos de autenticación inicial dan por supuesto que el usuario ya se encuentra registrado en la base de datos del servidor. Pero, ¿cómo se registra un usuario? El proceso puede variar, y en algunos casos quien lo realiza es un administrador del sistema. Sin embargo en la mayoría de las aplicaciones de acceso público, es el usuario quien se registra por sí mismo, y de un modo similar a la autenticación inicial, ya sea con usuario y contraseña, o mediante OAuth 2.0, etc. Además, durante el registro podemos querer o no validar la dirección de email del usuario, o un número de teléfono, o activar un segundo factor de autenticación, etc.

:::note
Luego en la sección ["Registro del usuario"](/docs/la-aplicacion/procesos/registro.md) se verá el proceso y su implementación.
:::

## Persistencia de la autenticación

La persistencia de la autenticación es un problema a resolver porque valoramos la experiencia del usuario, y no queremos que tenga que autenticarse manualmente en cada petición que haga al servidor. Aunque esto último podría ser deseable en algunas situaciones, como por ejemplo al realizar una transferencia de dinero, o para cambiar la contraseña. En esos casos estaríamos ponderando la seguridad por sobre la comodidad.

Una parte de la complejidad del problema radica en tener que ponderar simultáneamente distintos factores: seguridad,comodidad del usuario,rendimiento, escalabilidad, costos, etc. Por lo tanto, no existe una solución que sea la mejor en términos absolutos: dependerá de nuestras prioridades, del contexto en el que se va a implementar, de los posibles ataques a los que se expondrá, de los recursos con los que se cuenta, etc.

Desde el punto de vista de la implementación de una solución, el problema será: cómo guardar las credenciales del usuario en el navegador y cómo enviarlas al servidor en cada petición para que pueda validarlas y saber si el usuario está autenticado.

Considerando las herramientas que nos brindan los navegadores y sus vulnerabilidades (en anexo ["Las herramientas del navegador"](/docs/anexos/herramientas.md)), veamos que opciones tenemos.

### Autenticación básica

La opción más simple de todas sería guardar las credenciales (usuario y contraseña por ejemplo) en memoria y enviarlas al servidor en el header cada petición. Pero si se cierra o se recarga la página se pierden los datos, motivo por el cual no es una solución viable.

Para lograr persistencia podríamos guardar las credenciales en el local storage o en una cookie creada por el cliente (y por lo tanto no segura). Pero esto presenta tres problemas:

- Mediante un ataque XSS alguien podría obtener las credenciales.
- Se podrían falsificar las credenciales y hacerse pasar por el usuario, pues no pueden ser firmadas o encriptadas sin la intervención del servidor.
- El servidor debería consultar la base de datos en cada petición para verificar si el usuario está autenticado, lo cual sería una desventaja en términos de rendimiento.

Veamos otra alternativa.

### Sesiones en el servidor

El problema de la falsificación de las credenciales podría resolverse utilizando sesiones del lado del servidor, del siguiente modo: el usuario ingresa sus credenciales y el servidor crea una sesión con un identificador único vinculado al usuario, y guarda esa información en una cookie segura y firmada que envía al navegador. Luego, en cada petición, el cliente envía el identificador de la sesión al servidor, que lo valida para confirmar si el usuario está autenticado.

Como la cookie es segura y está firmada, evitamos el problema de un posible ataque XSS y de la falsificación. Sin embargo, como toda cookie, es vulnerable a ataques CSRF si no se toman las medidas adecuadas de seguridad.

Se presenta además otro problema: el servidor debe mantener una lista de sesiones activas. Si se guarda en memoria y el servidor se cae, se pierden todas las sesiones. Si se guarda en disco, como el servidor debe consultar la base de datos en cada petición, cuando el número de sesiones activas sea muy grande se verá afectado en términos de rendimiento. Además se complejiza la escalabilidad si queremos tener varios servidores, pues tendríamos que compartir la información de las sesiones entre ellos.

Necesitamos una opción que pueda combinar de un mejor modo seguridad, eficiencia y escalabilidad, lo cual puede lograrse con una solución con servidor pero sin que este tenga que guardar el estado. Para ello vamos a utilizar JWT.
