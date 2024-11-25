# Backend

El punto de entrada de nuestra aplicación es el archivo [**`app.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/app.js).Allí se van a establecer todas las configuraciones necesarias para el funcionamiento de la aplicación: variables de entorno, configuración del servidor, rutas, y conexión a la base de datos.

## Configuración del entorno

En `app.js` se importa el objeto `config` desde [**`config.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/config.js), el cual contiene las variables de configuración de la aplicación, creadas a partir de las variables de entorno presentes en el archivo **`.env`** o sus correspondientes valores por defecto.

El archivo `.env` no está incluido en el repositorio por cuestiones de seguridad, por lo que deberás crearlo. Aquí un ejemplo de cómo podría quedar:

```ini title="backend/.env"

# Los valores aquí especificados son solo ejemplos y deben ser reemplazados
# por los valores reales que necesitemos para nuestra app.

NODE_ENV=development
PORT=1234

ALLOWED_ORIGINS=http://127.0.0.1:8080,http://localhost:8080,http://127.0.0.1:5500,http://localhost:5500

ACCESS_SECRET_KEY=0mkPPcn6WW9bmDz8TPGAAJgkDU3KG59xOI2FWJCHz0o=
REFRESH_SECRET_KEY=Orx2m/ze3AriHH7XRypPS9fmQNhQJGphk8z+GyQJhxs=

DB_ADAPTER=sqlite3
DB_DEV_URI=/home/usuario/repos/jwt/mydb.sqlite
DB_PROD_URI=mydb.sqlite
DB_TEST_URI=/home/usuario/repos/jwt/mydb-test.sqlite

TURSO_DATABASE_URL=libsql://dbejemplo.turso.io
TURSO_AUTH_TOKEN=eyJhbSIsInR5cCGciOiJFZERTQI6IkpXVCJ9.eyJhIThhNmjoickIjoiNzM5NDRnciLCJpYXQiOjE3MjY3NzI1NjAsImljYTktYjRmZS00ZjE5LWIyMTktNmZkYzcxYRkIn0.WdHDL0xa6Zb1JLP4Snx0x-kshFJDgAvN6SmyMoqn4MQGQd--iZ8zEy7tF6bi5ggJrjKgvHEmuV-TcXNGz_JfCA

GITHUB_CLIENT_ID=Ov35liswepi2uodemHMUQJT
GITHUB_CLIENT_SECRET=44137ffa4adb5d501e7efeab59369061cc8dc6e52f

GOOGLE_CLIENT_ID=919490301737-jdp539hnm2enqahl8a3tashmj3r3neap4p.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GPOCSX-Rj89T5oFb3wZazEALf1r7svfURq8O-

GMAIL_USER=google@gmail.com
GMAIL_PASS='1234 1234 1234 1234'

```

Veamos que hacen las distintas variables y como configurarlas.

`NODE_ENV` es utilizada para especificar en qué entorno se está ejecutando la app y así poder diferenciar configuraciones y comportamientos. En nuestro caso la usaremos para establecer distintos valores en las URLs de las bases de
datos (en [**`endpoints.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/endpoints.js)), así como también para el uso o no de cookies seguras, según estemos en `development`, `testing` o `production`. Si no se establece ningún valor, se utilizará por defecto `development`. De todos modos cuando se corren los tests se establece automáticamente a `test`, y cuando desplegamos la app en algún servidor en general estos establecen automáticamente a `production`.

`PORT` es el puerto en el que se ejecutará la aplicación. Si no se establece ningún valor, se utilizará el puerto 1234. Tener en cuenta que luego en el front end (archivo endpoints.js) se debe establecer el puerto que se utilizará para hacer las peticiones, y que debe coincidir con el puerto que se establece aquí.

`ALLOWED_ORIGINS` establece los dominios permitidos para hacer peticiones a la API. Si no se establece ningún valor, se utilizará por defecto `http://127.0.0.1:8080,http://localhost:8080`. Si vamos a correr nuestro frontend en otro puerto, o en otro dominio, debemos establecer los valores correspondientes.

`ACCESS_SECRET_KEY` y `REFRESH_SECRET_KEY` son las claves secretas que se utilizan para firmar los JWT. Si no se establece ningún valor, se utilizarán unos valores por defecto simplemente a los fines de poder ejecutar y probar la aplicación.

:::note
Podés encontrar más información sobre las claves y cómo generarlas en [**este anexo**](/docs/anexos/manipular-jwt.md#clave-secreta).
:::

`DB_ADAPTER` establece que librería de base de datos se utilizará. Los valores pueden ser `sqlite3` (valor por defecto), o `turso`.

En caso de utilizar sqlite 3, se deben establecer los valores para `DB_DEV_URI`, `DB_PROD_URI`, `DB_TEST_URI`. Si no se establece ningún valor, se utilizará por defecto `mydb.sqlite`.

En caso de utilizar turso, no es necesario establecer las rutas a las bases
de datos en las variables recién mencionadas. En su lugar se establece la URL de la base de datos en `TURSO_DATABASE_URL` y el token de autorización en `TURSO_AUTH_TOKEN`.

`GIHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` son las credenciales que se utilizan para autenticar a través de GitHub. Si no se establece ningún valor, no se podrá utilizar la autenticación con GitHub. Para obtener estos valores se debe
crear una aplicación OAuth en GitHub. La página para hacerlo es:
https://github.com/settings/applications/new

`GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son las credenciales que se utilizan para autenticar a través de Google. Si no se establece ningún valor, no se podrá utilizar la autenticación con Google. Para obtener estos valores se debe utilizar la consola de [Google Cloud](https://console.cloud.google.com/). Allí hay que crear un proyecto, y configurar un cliente OAuth. Es fundamental establecer las "Authorized redirect URIs" agregando:

- http://127.0.0.1:1234/auth/google/callback
- http://localhost:1234/auth/google/callback

Esas son las URIs correspondientes a la configuración del puerto y los endpoints de nuestro servidor. Si logramos crear el cliente Oauth deberíamos poder ver los datos del 'Client ID' y del 'Client Secret' que necesitamos. En [este](https://support.google.com/cloud/answer/6158849) enlace se puede encontrar información más detallada sobre cómo hacerlo.

`GMAIL_USER` y `GMAIL_PASS` son las credenciales que se utilizan para enviar correos electrónicos a través de Gmail. Si no se establece ningún valor, no se podrán enviar correos electrónicos en la opción de reseteo de contraseña. Para obtener el `GMAIL_PASS` se debe crear una "app password" en [Google App Passwords](https://myaccount.google.com/apppasswords). `GMAIL_USER` será la dirección de correo electrónico que se utilizará para enviar los correos.

Como ya mencioné, no es necesario incluir todas las variables. Algunas de ellas sí son obligatorias para que la aplicación funcione, pero otras son optativas, en algunos casos tomarán valores por defecto si no están presentes, y en otros simplemente no se podrá utilizar alguna funcionalidad.

```js title="backend/src/config.js (fragmento)"
checkNodeEnv();
checkPort();
checkGoogleAuth();
checkGitHubAuth();
checkGmail();
checkDB();
```

En `config.js` esos métodos se encargan de verificar que las variables de entorno necesarias estén presentes y tengan un valor válido. Si alguna de ellas no cumple con los requisitos, la aplicación no se iniciará y se mostrará un mensaje de error. También se mostrará en la consola que valores de configuración se están utilizando.

Además de estas variables de entorno, en [**`global-store.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/global-store.js) definimos algunas variables globales que se utilizarán en distintas partes de la aplicación: la instancia de la base de datos, la configuración del tiempo de expiración de los tokens, y la configuración de las opciones de las Cookies. Iré explicando cada una de ellas a medida que necesitemos utilizarlas.

## Configuración del servidor

En [**`server.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/server.js) se configura el servidor utilizando Express.

Allí la función `configServer` hace lo siguiente:

1. **Crea una instancia de Express**:

   ```javascript
   const app = express();
   ```

   Se crea la instancia de Express que vamos a configurar y devolver, para que luego sea utilizada por `app.js`.

2. **Habilita el parsing de datos JSON**:

   ```javascript
   app.use(express.json());
   ```

   Este middleware permite que las solicitudes con cuerpo (`body`) en formato JSON sean automáticamente interpretadas, haciendo que los datos estén disponibles en `req.body`.

3. **Habilita el parsing de cookies**:

   ```javascript
   app.use(cookieParser());
   ```

   Este middleware procesa las cookies que llegan en las solicitudes HTTP. Convierte el string de cookies en un objeto accesible mediante `req.cookies`.

4. **Configura Cross-origin resource sharing (CORS)**:

   ```javascript
   app.use(
     cors({
       origin: function (origin, callback) {
         if (!origin) {
           return callback(null, true);
         }
         if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
           return callback(null, true);
         } else {
           return callback(new Error("Not allowed by CORS"));
         }
       },
       credentials: true,
     })
   );
   ```

   - **`origin`**: define qué orígenes (dominios) pueden hacer solicitudes al servidor. Si no hay un origen (por ejemplo, solicitudes desde archivos locales), se permite la solicitud. Si el origen está incluido en la lista `config.ALLOWED_ORIGINS`, también se permite. Allí debemos tener la URL de nuestro frontend, de lo contrario las solicitudes serán rechazadas.
   - **`'credentials: true'`**: permite el envío de cookies en las solicitudes, lo cual es necesitamos por ejemplo para poder utilizar el token de refresco.

## Configuración de la base de datos

Mencionamos antes que en la variable de entorno `DB_ADAPTER` se establece qué librería de base de datos se utilizará. En nuestro caso tenemos para elegir entre `sqlite3` y `turso`. Decidí incluir la opción de Turso ya que tiene una implementación de SQLite que permite utilizar una base de datos en un servidor (también se puede utilizar un archivo local) de manera gratuita.  

Haciendo algunas modificaciones en el código también es posible utilizar otra base de datos. Para ello lo que hice fue crear una clase abstracta `DBInterface` (en [**`db-interface.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/db/db-interface.js)), que define los métodos que deben ser implementados por las clases que la extiendan. En nuestro caso tenemos dos clases que la extienden: `dbSqlite3` (en [**`db-sqlite.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/db/db-sqlite.js)) y `dbTurso` (en[**`db-turso.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/db/db-turso.js)). Ambas clases implementan los métodos de la interfaz, utilizando sus respectivas librerías.
Luego la instancia de la base de datos se crea en `global-store.js` según nuestra elección en la variable de entorno `DB_ADAPTER` y se exporta para que pueda ser utilizada en el resto de la aplicación.  

Si decidiéramos utilizar otro tipo de base de datos, deberíamos crear una nueva clase que extienda `DBInterface`, implementando todos sus métodos, y modificar `config.js` y `global-store.js` para incluir la nueva base de datos como una opción posible de `DB_ADAPTER`.

A los fines de que nuestra app de ejemplo funcione, en `app.js` se va a llamar al método `createTables` de la instancia de la base de datos para crear las tablas necesarias si no existen (lo cual seguramente no será necesario si usamos la base de datos en producción).

Las tablas que necesitamos son:

- `users` para almacenar los datos de los usuarios, que van a ser un `id`, un `email` que utilizaremos a modo de nombre de usuario, y un `pass` que será el hash de la contraseña.
- `denylist`, con los campos `token` y `expiration` para almacenar los tokens de refresco que han sido denegados, y así poder invalidarlos.
- `history`, con los campos `date`, y `user_id`, para guardar un historial de las visitas de los usuarios a la aplicación.

## Configuración de las rutas

Para quién haya trabajado alguna vez con Express, la configuración de las rutas no debería presentar mayores dificultades. En `app.js` establecemos que función va a ser llamada para manejar cada ruta:

```js title="en backend/src/app.js (fragmento)"
app.get(apiEP.AUTH_GITHUB, handleAuthGitHub);
app.get(apiEP.AUTH_GITHUB_CALLBACK, handleAuthGitHubCallback);
app.get(apiEP.AUTH_GOOGLE, handleAuthGoogle);
app.get(apiEP.AUTH_GOOGLE_CALLBACK, handleAuthGoogleCallback);

app.post(apiEP.REGISTER, handleRegister);
app.post(apiEP.LOGIN, handleLogin);
app.get(apiEP.LOGOUT, handleLogOut);
app.delete(apiEP.DELETE_USER, handleDeleteUser);
app.post(apiEP.REFRESH, handleRefreshToken);

app.post(apiEP.RESET_PASS, handleResetPass);
app.post(apiEP.CHANGE_PASS, handleChangePass);

app.post(
  apiEP.ADD_VISIT,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleAddVisit
);

app.get(
  apiEP.GET_VISITS,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleGetVisits
);
```

Como se puede ver los endpoints los obtenemos del objeto `apiEP` que se importa de `endpoints.js`, donde se encuentran definidos. De esta manera si necesitamos cambiar algún endpoint, lo hacemos en un solo lugar y no en todos los archivos donde se utilizan.

En cada ruta se llama a una función que se encarga de manejar la petición. Estas funciones son importadas cada una de su archivo correspondiente, y se encuentran en la carpeta `route-handlers`.

Las únicas dos rutas que no llaman directamente a la funciones que las manejan son las que se encargan de las visitas de los usuarios a la aplicación. Estas son rutas protegidas que requieren de autorización. Para ello se utiliza el middleware `extractToken` y `verifyAccessToken` que se encuentran en [**`middleware.js`**](https://www.github.com/fedeholc/jwtlk/blob/main/backend/src/middleware.js). Luego explicaré cómo funciona [**el proceso de verificación mediante middleware**](/docs/la-aplicacion/procesos/middleware-verificacion.md).

Finalmente, el código de `app.js` termina con:

```js title="backend/src/app.js (fragmento)"
app.get("*", (req, res) => {
  res.status(404).send("404 - Oops! Page not found");
});

app.listen(config.PORT, () =>
  console.log(`Server running on port ${config.PORT}`)
);
```

Donde se establece que si se hace una petición a un endpoint que no existe, se devolverá un mensaje de error 404. Y luego se inicia el servidor en el puerto que se estableció en la variable de entorno `PORT`.

**¿Localhost o 127.0.0.1?**

La aplicación está configurada inicialmente para funcionar en `http://127.0.0.1` tanto en el backend como en el frontend, por lo que si se intenta abrir el frontend en `http://localhost` no funcionará correctamente. Si se desea utilizar `localhost` se deben cambiar los valores de `apiBase` en el archivo `endpoints.js`, para que quede de este modo:

```js title="en backend/src/endpoints.js (fragmento)"
const apiBase = {
  development: `http://localhost:${config.PORT}`,
  test: `http://localhost:${config.PORT}`,
  production: "https://api.example.com",
};
```

Y en el archivo `endpoints-front.js` del frontend, para que quede:

```js title="en frontend/src/endpoints-front.js (fragmento)"
const apiBase = {
  development: `http://localhost:${apiPort}`,
  production: "https://api.example.com",
};
```

Por último, `localhost` debe estar incluido en la lista de orígenes permitidos en la variable de entorno `ALLOWED_ORIGINS`.

De este modo queda configurado el backend. Luego veremos cómo se implementan las rutas y las distintas funcionalidades de la aplicación.
