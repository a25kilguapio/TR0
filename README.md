# Endevina la marca

Joc de preguntes tipus quiz per endevinar marques a partir del seu eslògan o logotip. El projecte té una API REST feta amb Node.js/Express i MySQL, i un frontend en HTML/CSS/JS pur (sense frameworks) amb una pantalla de joc i una pantalla d'administració de preguntes.

## Funcionalitats

- **Joc per a l'usuari** (`static/index.html`)
  - Partida de 10 preguntes triades a l'atzar entre totes les disponibles.
  - Navegació entre preguntes amb els botons «anterior» i «següent», mantenint la resposta marcada a cada una.
  - Marcador de progrés (preguntes respostes / total) i cronòmetre que compta els segons des de l'inici de la partida.
  - El botó d'enviar respostes només apareix quan s'han contestat totes les preguntes; el cronòmetre s'atura en enviar.
  - En acabar, es mostra el resultat (encerts/total) amb un diàleg de SweetAlert2.
  - Nom d'usuari guardat a `localStorage`, amb opció d'esborrar-lo.

- **Administració de preguntes** (`static/admin.html`)
  - Llistat de totes les preguntes amb les seves 4 respostes i la imatge (si en té), marcant quina és la correcta.
  - Formulari per crear una pregunta nova amb 4 respostes, indicant quina és la correcta i pujant una imatge opcional.
  - Edició d'una pregunta existent (precarrega les dades al formulari).
  - Eliminació d'una pregunta (també esborra la imatge associada del disc si n'hi havia).

- **API REST** (`app.js`)
  - `GET /preguntes` — totes les preguntes amb les seves respostes.
  - `GET /preguntes/:id` — una pregunta concreta.
  - `GET /iniciar` — selecciona 10 preguntes a l'atzar per començar una partida.
  - `POST /enviar` — rep les respostes de l'usuari i retorna encerts/incorrectes/total.
  - `POST /preguntes` — crea una pregunta nova amb 4 respostes (multipart, imatge opcional via Multer).
  - `PUT /preguntes/:id` — modifica una pregunta existent (la imatge només es canvia si se n'envia una de nova).
  - `DELETE /preguntes/:id` — elimina una pregunta i la seva imatge del disc.

- **Base de dades** (`schema.sql`)
  - Taula `preguntes` (id, pregunta, imatge).
  - Taula `respostes` (id, pregunta_id, ordre, etiqueta, es_correcta), amb clau forana a `preguntes` i esborrat en cascada.

- **Dades inicials** (`marques.json` + `scripts/migrate.js`)
  - Banc de 20 preguntes sobre eslògans i logotips de marques conegudes, amb les seves imatges (icones via `cdn.simpleicons.org`).
  - L'script `migrate.js` buida les taules i les torna a omplir a partir de `marques.json`.

## Estructura del projecte

```
TR0/
├── app.js              # Servidor Express i totes les rutes de l'API
├── db_conexion.js       # Pool de connexions MySQL (mysql2/promise)
├── queries.js            # Capa de consultes alternativa (agrupar/crear/editar/eliminar preguntes)
├── init-db.js            # Aplica schema.sql a la base de dades
├── schema.sql             # Definició de les taules preguntes i respostes
├── marques.json           # Banc de preguntes inicial (20 marques)
├── scripts/
│   └── migrate.js         # Importa marques.json a la base de dades
└── static/
    ├── index.html          # Pantalla del joc
    ├── functions.js         # Lògica del joc (frontend)
    ├── admin.html            # Pantalla d'administració
    ├── admin.js               # Lògica del CRUD de preguntes (frontend)
    └── images/                 # Imatges pujades des de l'administració
```

## Tecnologies

- **Backend**: Node.js, Express 5, mysql2 (promeses), Multer (pujada d'imatges), CORS.
- **Base de dades**: MySQL.
- **Frontend**: HTML, JavaScript natiu (sense frameworks), Bootstrap 5 i SweetAlert2 via CDN.

## Instal·lació i execució

1. Instal·lar les dependències:
   ```
   npm install
   ```
2. Configurar la connexió a la base de dades a `db_conexion.js` (host/socket, usuari, contrasenya i nom de la base de dades).
3. Crear les taules:
   ```
   npm run migrate
   ```
   o bé aplicar directament `schema.sql`.
4. (Opcional) Carregar el banc de preguntes inicial:
   ```
   node scripts/migrate.js
   ```
5. Arrancar el servidor:
   ```
   npm start
   ```
   o en mode desenvolupament amb recàrrega automàtica:
   ```
   npm run dev
   ```
   El servidor escolta per defecte al port `40001` (configurable passant el port com a argument: `node app.js 3000`).
6. Obrir `static/index.html` (o la URL del servidor) al navegador per jugar, i `static/admin.html` per gestionar les preguntes.

## Notes

- El frontend apunta a un backend desplegat a `http://a25kilguapio.daw.inspedralbes.cat:40001` (variable `BACKEND` a `functions.js` i `admin.js`); cal canviar-la si s'executa en un altre entorn.
- Les imatges pujades des de l'administració es guarden a `static/images/`.
