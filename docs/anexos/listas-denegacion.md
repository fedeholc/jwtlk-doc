# Listas de denegación

Una lista de denegación es una lista de tokens (de refresco en nuestro caso) que han sido revocados o invalidados por alguna razón. Estos ya no son válidos y no pueden ser empleados para obtener nuevos tokens de acceso. La implementación de estas listas puede ser util para incrementar la seguridad del sistema y evitar el uso indebido de tokens robados o comprometidos. Algunas de las situaciones en las que se suele agregar un token a la lista lista de denegación son:

1. **Cierre de sesión manual del usuario (logout)**.
2. **Rotación de Refresh Tokens**. Para aquellos sistemas que utilizan un enfoque de rotación de tokens, en el que un nuevo token de refresco se emite cada vez que se solicita un nuevo token de acceso.
3. **Revocación por acciones de seguridad (cambio de contraseña, actualización de email, etc.)**.
4. **Detección o sospecha de que el token ha sido robado o comprometido**.
5. **Desactivación o eliminación de una cuenta de usuario**.
6. **Finalización de una sesión en dispositivos específicos**. Algunos sistemas permiten a los usuarios cerrar sesión en dispositivos específicos desde un panel de control.
7. **Detectar actividad sospechosa o fraude**. Por ejemplo, si se detecta un intento de inicio de sesión desde una ubicación geográfica inusual o con patrones de uso irregulares.

En todos los casos de lo que se trata es de evitar que un token robado o comprometido (por malware, brechas de seguridad, etc.) pueda ser utilizado para obtener un nuevo token de acceso.

Para esta primera versión de la guía solo he implementado la lista de denegación de tokens para los casos de cierre de sesión manual del usuario y eliminación de la cuenta de usuario.

Queda pendiente implementar que periódicamente elimine de la base de datos los tokens de la lista de denegación que ya hayan expirado para mantener la tabla lo más liviana posible.

Otra mejora de seguridad a implementar es guardar el token hasheado en la lista de denegación en lugar de guardarlo como texto plano, para evitar que un atacante pueda robar los tokens de la lista de denegación.
