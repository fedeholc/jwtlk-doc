# Manipular JWTs

## Codificación

Para generar los JWTs utilizamos la librería [**`jose`**](https://github.com/panva/jose).

En nuestro código la función `genAccessToken` (ver [**`util-auth.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/util-auth.js)) es la encargada de generar el token de autenticación:

```js title="en backend/src/util-auth.js"
/**
 * Function to generate the access token
 * @param {types.TokenPayload} payload - Information to be included in the token
 * @param {Uint8Array} accessSecretKey - Secret key to sign the token
 * @returns {Promise<string>} - token
 */
async function genAccessToken(payload, accessSecretKey) {
  let expirationTime = accessJWTExpiration.noRemember;
  if (payload.rememberMe) {
    expirationTime = accessJWTExpiration.remember;
  }
  const newAccessToken = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(accessSecretKey);
  return newAccessToken;
}
```

Como vemos, `genAccessToken` recibe un objeto `payload`, que tendrá la información del usuario que queremos incluir en el token, y una clave secreta `accessSecretKey` para firmar el token.
Una vez creado el objeto `SignJWT` con el payload recibido, se establece el header del token con el algoritmo de encriptación y el tipo de token, y se setea la fecha de emisión (que al no recibir parámetro será la del momento de ejecución) y la fecha de expiración, quedando incluidos también en el payload (como "iat" y "exp"). Finalmente se firma el token con la clave secreta.

También tendremos la función `genRefreshToken`, encargada de generar el token de refresco, en la que solamente cambian los tiempos de expiración y la clave secreta.

## Decodificación y verificación

En el proceso de autenticación, del lado del cliente vamos a recibir el token, y para poder leer la información que contiene el payload, vamos a tener que decodificarlo.
Si se está utilizando algún framework como React, o algún bundler como Vite, se puede utilizar la misma librería `jose` para decodificarlo. Como nuestro frontend no utiliza ningún bundler, no podemos instalar directamente la librería, por lo que utilizamos la siguiente función (ver [**`auth.js`**](https://github.com/fedeholc/jwtlk/blob/main/frontend/src/auth.js)) que decodifica el token y devuelve su payload:

```js title="en frontend/src/auth.js"
/**
 * Decodes the payload of the provided token.
 * @param {string} token - The access token containing encoded user data.
 * @returns {types.TokenPayload | null} - The decoded token payload or null if
 * decoding fails.
 */
export function decodeTokenPayload(token) {
  if (!token) {
    console.error("No token found.");
    return null;
  }
  let jsonPayload = null;

  try {
    // Split the token to get the payload
    const base64Url = token.split(".")[1];

    // Decode from Base64URL to Base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode from Base64 to JSON
    jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch (error) {
    console.error("Error decoding token: ", error);
    return null;
  }
```

<details>

<summary>Explicación de la conversión de base64 a JSON</summary>

Para convertir de base64 a JSON, primero se convierte de Base64 a una cadena de texto usando atob(base64). Esto decodifica el Base64 a su representación binaria original. Ese texto binario podría incluir caracteres que no son ASCII estándar (Ej: "Ç", "¡"), los cuales podrían ser interpretados incorrectamente al utilizarse. Para evitar posibles problemas con esos caracteres especiales, necesitamos:

- Convertir cada carácter a su representación hexadecimal: esto se hace con `c.charCodeAt(0).toString(16)`, donde `charCodeAt` obtiene el código Unicode (en formato decimal) de cada carácter, y `toString(16)` lo convierte a formato hexadecimal.
- Asegurar que el valor hexadecimal tenga siempre dos dígitos: `("00" + ...).  slice(-2)` agrega un 0 inicial en caso de que el valor hexadecimal sea menor a 16, asegurando que siempre tenga dos dígitos.
- Agregar el prefijo `%`: esto transforma cada carácter en una secuencia de escape, como `%20` para un espacio, que `decodeURIComponent` puede interpretar correctamente.
- Juntar todo: `.join("")` vuelve a unir la secuencia en una cadena donde cada carácter especial está representado con un código de escape (`%xx`).

Al final, decodeURIComponent puede interpretar estos caracteres de manera segura, decodificando la cadena a una representación JSON válida.

</details>

Para decodificar el token del lado del servidor se puede usar `decodeJwt` de la librería `jose`, o como es nuestro caso, podemos utilizar `jwtVerify` (también de `jose`), que además verifica la firma del token.

Por ejemplo, en la función `handleRefreshToken` (ver [**`refresh-token.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/route-handlers/refresh-token.js)), que se encarga de generar un nuevo token de acceso, se decodifica y verifica el token de refresco que llegó mediante la cookie, de la siguiente manera:

```js title="en backend/src/route-handlers/refresh-token.js (fragmento)"
let response = await jwtVerify(refreshToken, refreshSecretKey);
if (!response) {
  return res.status(401).json({ error: "Invalid refresh token" });
}

const newAccessToken = await genAccessToken(
  /**@type {types.TokenPayload} */ (response.payload),
  accessSecretKey
);
```

Si el refresh token era valido, la respuesta de la decodificación/verificación mediante `jwtVerify` también lo será, y contendrá el payload que se utilizará para generar un nuevo token de acceso.

Del lado del cliente no podemos realizar una verificación de la firma del token, ya que no tenemos acceso a la clave secreta con la que se firmó. Por lo tanto, confiamos en que el token de acceso que recibimos de parte del servidor es válido, y si no lo es, cuando intentemos usarlo el servidor nos devolverá un error.

### Qué es y cómo se genera una clave secreta {#clave-secreta}

Una clave secreta es un valor alfanumérico que se utiliza junto con un algoritmo de firma (como HMAC SHA256) para generar una firma única que valida la autenticidad de un token JWT. La clave secreta se utiliza tanto para firmar como para verificar los tokens:

- Codificar (firmar) tokens JWT: al crear un JWT, la clave secreta se combina con el encabezado y el payload del token mediante un algoritmo de firma para generar una firma criptográfica. Esto asegura que el contenido del token no ha sido alterado después de su creación.
- Decodificar (verificar) tokens JWT: cuando un cliente envía un token al servidor, este utiliza la misma clave secreta para verificar que la firma es válida. Si alguien intenta modificar el token, la firma generada con la clave secreta no coincidirá y el servidor rechazará el token.

Así la clave secreta actúa como un mecanismo de confianza entre el servidor que genera el token y el servidor que lo verifica, garantizando la integridad y autenticidad de la comunicación.

**Generar una clave secreta**

La librería `jose`, con la cual manipulamos los JWTs, utiliza claves secretas de 32 bytes en formato `Uint8Array`.

Podemos generar una haciendo uso de `crypto` de Node.js:

```js
const accessSecretKey = new Uint8Array(crypto.randomBytes(32));
```

Para guardar las claves secretas en nuestro archivo `.env` las podemos convertir a un string base64 del siguiente modo:

```js
const accessSecretKeyBase64 = Buffer.from(accessSecretKey).toString("base64");
```

Para facilitar la tarea de crear las claves secretas se puede utilizar el script [**`create-keys.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/create-keys.js). Este nos mostrará en la consola las claves secretas en el formato requerido para que podamos copiarlas y pegarlas directamente en nuestro archivo `.env`. Cuando la aplicación tenga que leer y utilizar las claves (en `config.js`), se encargará de convertirlas nuevamente a `Uint8Array`.
