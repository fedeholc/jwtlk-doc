---
sidebar_position: 3
---

# La aplicación

La aplicación que aquí se presenta fue desarrollada con el fin de aprender a implementar un sistema de autenticación, y luego poder adaptarlo y usarlo en distintos proyectos.

:::tip
Te recomiendo que a partir de ahora sigas la lectura de la guía junto con el código de la aplicación a la vista. [**Aquí está el repositorio**](https://www.github.com/fedeholc/jwtlk).
:::
:::tip
Los comentarios escritos en el código están en inglés. Si los necesitás en español podés usar [**esta extensión**](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate) en VSCode que se encarga de traducirlos en el momento.
:::

En la [primera parte](/docs/intro/problemas.md) de esta guía, se explica cuáles son los problemas que se nos plantean a la hora de realizar un sistema de autenticación, y de qué manera podríamos solucionarlos, teniendo en cuenta las herramientas que nos brinda el navegador, sus vulnerabilidades, y nuestras prioridades. En nuestro caso definimos que vamos a utilizar JSON Web Token con un sistema de dos tokens (de acceso y de refresco).

Aquí veremos cómo implementar dicha solución desde un punto de vista práctico, viendo cuáles son los procesos y flujos qué debemos seguir y cuál es el código necesario para llevarlos a cabo.

Nuestra aplicación se compone de:

- Un **backend**: desarrollado en Node.js, utilizando Express como servidor, y SQLite como base de datos. Expone una API REST que puede ser consumida por el frontend para realizar las operaciones de registro, login, logout, refresco de tokens, reseteo de contraseña, borrado de usuario, y acceso a recursos protegidos.
- Un **frontend**: desarrollado en vanilla JavaScript, HTML y CSS. Se encarga de presentar una interfaz al usuario, realizar las peticiones a la API del backend, y mostrar sus resultados. Quise utilizar la opción más básica para que sea más fácil de entender y si se quiere adaptar luego a cualquier framework que se quiera utilizar.

:::note
La aplicación cuenta también con tests unitarios realizados con Vitest (tanto para el backend como para el frontend), y tests end to end realizados con Playwright. Más información al respecto en [**este anexo**](/docs/anexos/testing.md).
:::

<details>
<summary>**Sobre el uso de JSDoc**</summary>

En el código he utilizado JSDoc. Es una herramienta de documentación para JavaScript que permite agregar comentarios estructurados utilizando una sintaxis específica para describir el propósito, el uso y los detalles de las funciones, métodos, clases y variables.

En particular lo he incorporado porque se integra con el Language Server Protocol (LSP) de TypeScript en VS Code. Lo cual permite la tipificación de datos, además de ofrecer documentación y autocompletado de funciones y métodos. Pero sin necesidad de escribir TypeScript, por lo cual podemos usar nuestro código JavaScript directamente en el navegador.

Podés consultar la documentación oficial de JSDoc [**aquí**](https://jsdoc.app/).

Si querés desactivarlo es tan sencillo como borrar el archivo `jsconfig.json` de la raíz del proyecto. O establecer la propiedad `checkJs` en `false` en dicho archivo.

</details>
