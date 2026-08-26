# BiblioTrack — Documentation API Complète

NestJS · PostgreSQL · TypeORM · SMTP · WebSocket · Swagger · Cloudinary

---

## Sommaire

1. [Format des Réponses](#format-des-réponses)
2. [Authentification](#1-authentification)
3. [Profil Utilisateur](#2-profil-utilisateur)
4. [Genres](#3-genres)
5. [Books](#4-books)
6. [Sessions de Lecture](#5-sessions-de-lecture)
7. [Notifications](#6-notifications)
8. [Statistiques](#7-statistiques)
9. [WebSocket](#8-websocket)
10. [Flow Complet](#9-flow-complet)

---

## Format des Réponses

Toutes les réponses suivent ce format :

**Succès :**
```json
{
  "success": true,
  "message": "Description en anglais",
  "data": { ... }
}
```

**Erreur :**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [ { "field": "email", "message": "email must be a valid email address" } ]
}
```

---

## 1. Authentification

### POST /auth/register — Créer un compte

**Request :**
```json
{ "firstName": "John", "lastName": "Doe", "email": "john@gmail.com", "password": "Password123!" }
```

**Response 201 :**
```json
{ "success": true, "message": "Account created. Please verify your email with the code we sent you." }
```

**Response 409 :**
```json
{ "success": false, "message": "An account with this email already exists" }
```

---

### POST /auth/verify-otp — Vérifier l'email

**Request :**
```json
{ "email": "john@gmail.com", "code": "482916" }
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "id": "uuid",
    "email": "john@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "isVerified": true,
    "createdAt": "2026-08-26T07:33:37.493Z"
  }
}
```

**Response 400 :**
```json
{ "success": false, "message": "Invalid verification code" }
```

---

### POST /auth/resend-otp — Renvoyer le code

**Request :**
```json
{ "email": "john@gmail.com" }
```

**Response 200 :**
```json
{ "success": true, "message": "A new verification code has been sent to your email" }
```

---

### POST /auth/login — Se connecter

**Request :**
```json
{ "email": "john@gmail.com", "password": "Password123!" }
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "email": "john@gmail.com", "firstName": "John", "lastName": "Doe" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response 401 :**
```json
{ "success": false, "message": "Invalid email or password" }
```

---

### POST /auth/refresh — Rafraîchir les tokens

**Request :**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST /auth/forgot-password — Demander un reset

**Request :**
```json
{ "email": "john@gmail.com" }
```

**Response 200 :**
```json
{ "success": true, "message": "If the email exists, a reset code has been sent" }
```

---

### POST /auth/reset-password — Réinitialiser le mot de passe

**Request :**
```json
{ "email": "john@gmail.com", "code": "482916", "newPassword": "NewPass123!" }
```

**Response 200 :**
```json
{ "success": true, "message": "Password reset successfully" }
```

---

### PATCH /auth/update-password — Changer le mot de passe (connecté)

**Headers :** `Authorization: Bearer <accessToken>`

**Request :**
```json
{ "currentPassword": "Password123!", "newPassword": "NewPass123!" }
```

**Response 200 :**
```json
{ "success": true, "message": "Password updated successfully" }
```

---

## 2. Profil Utilisateur

### GET /users/me — Voir son profil

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "id": "uuid",
    "email": "john@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "isVerified": true,
    "createdAt": "2026-08-26T07:33:37.493Z",
    "updatedAt": "2026-08-26T07:33:37.493Z"
  }
}
```

---

### PATCH /users/me — Modifier son profil

**Headers :** `Authorization: Bearer <accessToken>`

**Request :**
```json
{ "firstName": "Jane", "lastName": "Smith" }
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { "id": "uuid", "email": "john@gmail.com", "firstName": "Jane", "lastName": "Smith", "avatarUrl": null, "isVerified": true }
}
```

---

### PATCH /users/me/avatar — Upload photo de profil

**Headers :** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Body :** champ `avatar` (image jpg/png/gif/webp, max 5 MB)

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { "id": "uuid", "email": "john@gmail.com", "firstName": "Jane", "lastName": "Smith", "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg", "isVerified": true }
}
```

---

### DELETE /users/me/avatar — Supprimer la photo de profil

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { "id": "uuid", "email": "john@gmail.com", "firstName": "Jane", "lastName": "Smith", "avatarUrl": null, "isVerified": true }
}
```

---

## 3. Genres

### GET /genres — Lister tous les genres

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": [
    { "id": "uuid", "name": "Science Fiction" },
    { "id": "uuid", "name": "Fantasy" },
    { "id": "uuid", "name": "Roman" }
  ]
}
```

---

### POST /genres — Créer un genre

**Headers :** `Authorization: Bearer <accessToken>`

**Request :** `{ "name": "Science Fiction" }`

**Response 201 :**
```json
{ "success": true, "message": "Request completed successfully", "data": { "id": "uuid", "name": "Science Fiction" } }
```

**Response 409 :** `{ "success": false, "message": "Genre already exists" }`

---

### PATCH /genres/:id — Modifier un genre

**Headers :** `Authorization: Bearer <accessToken>`

**Request :** `{ "name": "Sci-Fi" }`

**Response 200 :**
```json
{ "success": true, "message": "Request completed successfully", "data": { "id": "uuid", "name": "Sci-Fi" } }
```

---

### DELETE /genres/:id — Supprimer un genre

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :** `{ "success": true, "message": "Genre deleted successfully" }`

**Response 404 :** `{ "success": false, "message": "Genre not found" }`

---

## 4. Books

### GET /books/external-search?q=django — Recherche externe

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": [
    {
      "title": "Django for Beginners",
      "author": "William Vincent",
      "description": "Learn web development with Django",
      "coverUrl": "https://covers.openlibrary.org/b/id/123456-L.jpg",
      "totalPages": 300,
      "isbn": "9781735467221",
      "publisher": "Leanpub",
      "publishedYear": 2024,
      "language": "en",
      "externalSourceId": "/works/OL82563W",
      "externalSource": "open_library"
    },
    {
      "title": "Django for Professionals",
      "author": "William Vincent",
      "description": "Production-ready web apps",
      "coverUrl": "https://books.google.com/...",
      "totalPages": 350,
      "isbn": "9781735467238",
      "publisher": "Leanpub",
      "publishedYear": 2023,
      "language": "en",
      "externalSourceId": "abc123def",
      "externalSource": "google_books"
    }
  ]
}
```

Recherche par ISBN : `GET /books/external-search?q=9782070360529`

---

### POST /books/import-external — Importer un livre trouvé (RECOMMANDÉ)

**Headers :** `Authorization: Bearer <accessToken>`

**Request :**
```json
{
  "externalSourceId": "/works/OL82563W",
  "externalSource": "open_library",
  "genreId": "uuid-genre"
}
```

Le backend récupère automatiquement : titre, auteur, description, cover, ISBN, éditeur, année, langue. Si un PDF/EPUB est disponible sur Internet Archive, il est téléchargé et stocké sur Cloudinary.

**Response 201 :**
```json
{
  "success": true,
  "message": "Book imported successfully",
  "data": {
    "id": "uuid",
    "title": "Les Misérables",
    "author": "Victor Hugo",
    "description": "Un roman historique...",
    "coverUrl": "https://covers.openlibrary.org/b/id/123456-L.jpg",
    "fileUrl": "https://res.cloudinary.com/.../raw/upload/v1/.../les-miserables.pdf",
    "readOnlineUrl": "https://archive.org/details/lesmiserables00hugo",
    "totalPages": 1900,
    "isbn": "9782070360529",
    "publisher": "Gallimard",
    "publishedYear": 1862,
    "language": "fr",
    "externalSourceId": "/works/OL82563W",
    "externalSource": "open_library",
    "status": "TO_READ",
    "lastReadPage": 0,
    "hasReadableContent": true,
    "createdAt": "2026-08-26T07:33:37.493Z"
  }
}
```

---

### POST /books/import — Importer manuellement (toutes les données)

**Headers :** `Authorization: Bearer <accessToken>`

**Request :**
```json
{
  "title": "Les Misérables",
  "author": "Victor Hugo",
  "description": "Un roman historique...",
  "totalPages": 1900,
  "isbn": "9782070360529",
  "publisher": "Gallimard",
  "publishedYear": 1862,
  "language": "fr",
  "externalSourceId": "/works/OL82563W",
  "externalSource": "open_library",
  "genreId": "uuid-genre"
}
```

**Response 201 :**
```json
{
  "success": true,
  "message": "Book imported successfully",
  "data": { "id": "uuid", "title": "Les Misérables", "status": "TO_READ", "lastReadPage": 0 }
}
```

---

### POST /books — Ajouter un livre manuellement

**Headers :** `Authorization: Bearer <accessToken>`

**Request :**
```json
{
  "title": "Mon livre perso",
  "author": "Moi",
  "description": "Une description",
  "isbn": "9782070360529",
  "publisher": "Gallimard",
  "publishedYear": 2024,
  "language": "fr",
  "genreId": "uuid-genre",
  "totalPages": 300
}
```

**Response 201 :**
```json
{
  "success": true,
  "message": "Book added successfully",
  "data": {
    "id": "uuid",
    "title": "Mon livre perso",
    "author": "Moi",
    "description": "Une description",
    "coverUrl": null,
    "fileUrl": null,
    "totalPages": 300,
    "isbn": "9782070360529",
    "publisher": "Gallimard",
    "publishedYear": 2024,
    "language": "fr",
    "status": "TO_READ",
    "lastReadPage": 0,
    "createdAt": "2026-08-26T07:33:37.493Z"
  }
}
```

---

### GET /books — Lister ses livres

**Headers :** `Authorization: Bearer <accessToken>`

**Query params :**

| Param   | Type   | Défaut | Description                        |
|---------|--------|--------|------------------------------------|
| `page`  | number | 1      | Numéro de page                     |
| `limit` | number | 20     | Nombre par page                    |
| `search`| string | -      | Recherche titre/auteur/isbn        |
| `status`| string | -      | `TO_READ`, `IN_PROGRESS`, `FINISHED` |
| `genreId`| string| -      | UUID du genre                      |

**Exemple :** `GET /books?page=1&limit=10&search=django&status=IN_PROGRESS`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "Django for Beginners",
        "author": "William Vincent",
        "description": "Learn web development",
        "coverUrl": "https://covers.openlibrary.org/b/id/123-L.jpg",
        "fileUrl": "https://res.cloudinary.com/.../file.pdf",
        "readOnlineUrl": "https://archive.org/details/...",
        "totalPages": 300,
        "isbn": "9781735467221",
        "publisher": "Leanpub",
        "publishedYear": 2024,
        "language": "en",
        "status": "IN_PROGRESS",
        "lastReadPage": 42,
        "genre": { "id": "uuid", "name": "Tech" },
        "createdAt": "2026-08-26T07:33:37.493Z"
      }
    ],
    "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
  }
}
```

---

### GET /books/:id — Détail d'un livre

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "id": "uuid",
    "title": "Django for Beginners",
    "author": "William Vincent",
    "description": "Learn web development",
    "coverUrl": "https://covers.openlibrary.org/b/id/123-L.jpg",
    "fileUrl": "https://res.cloudinary.com/.../file.pdf",
    "readOnlineUrl": "https://archive.org/details/...",
    "totalPages": 300,
    "isbn": "9781735467221",
    "publisher": "Leanpub",
    "publishedYear": 2024,
    "language": "en",
    "externalSourceId": "/works/OL82563W",
    "externalSource": "open_library",
    "status": "IN_PROGRESS",
    "lastReadPage": 42,
    "genre": { "id": "uuid", "name": "Tech" },
    "sessions": [
      { "id": "uuid", "pagesRead": 10, "startPage": 1, "endPage": 10, "readAt": "2026-08-26T10:00:00.000Z" }
    ],
    "createdAt": "2026-08-26T07:33:37.493Z",
    "updatedAt": "2026-08-26T10:00:00.000Z"
  }
}
```

**Response 404 :** `{ "success": false, "message": "Book not found" }`

---

### GET /books/:id/read — Info de lecture

Le frontend utilise cette route pour savoir comment afficher le livre.

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "id": "uuid",
    "title": "Django for Beginners",
    "author": "William Vincent",
    "coverUrl": "https://covers.openlibrary.org/b/id/123-L.jpg",
    "fileUrl": "https://res.cloudinary.com/.../file.pdf",
    "readOnlineUrl": "https://archive.org/details/...",
    "lastReadPage": 42,
    "totalPages": 300,
    "status": "IN_PROGRESS",
    "hasReadableContent": true
  }
}
```

---

### PATCH /books/:id — Modifier un livre

**Headers :** `Authorization: Bearer <accessToken>`

**Request :** `{ "title": "Nouveau titre", "status": "FINISHED" }`

**Response 200 :**
```json
{ "success": true, "message": "Book updated successfully", "data": { "id": "uuid", "title": "Nouveau titre", "status": "FINISHED" } }
```

---

### DELETE /books/:id — Supprimer un livre

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :** `{ "success": true, "message": "Book deleted successfully" }`

**Response 404 :** `{ "success": false, "message": "Book not found" }`

---

### PATCH /books/:id/progress — Mettre à jour la progression

**Headers :** `Authorization: Bearer <accessToken>`

**Request :** `{ "currentPage": 42 }`

**Response 200 :**
```json
{
  "success": true,
  "message": "Progress updated",
  "data": { "id": "uuid", "title": "Django for Beginners", "status": "IN_PROGRESS", "lastReadPage": 42, "totalPages": 300 }
}
```

Si le livre est terminé (`currentPage >= totalPages`) :
```json
{
  "success": true,
  "message": "Progress updated",
  "data": { "id": "uuid", "title": "Django for Beginners", "status": "FINISHED", "lastReadPage": 300, "totalPages": 300 }
}
```

---

### POST /books/:id/cover — Upload cover image

**Headers :** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Body :** champ `cover` (jpg/png/gif/webp, max 10 MB)

**Response 201 :**
```json
{
  "success": true,
  "message": "Cover uploaded successfully",
  "data": { "id": "uuid", "title": "Django for Beginners", "coverUrl": "https://res.cloudinary.com/.../books/cover.jpg" }
}
```

---

### POST /books/:id/file — Upload fichier livre

**Headers :** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Body :** champ `file` (PDF/EPUB, max 50 MB)

**Response 201 :**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": { "id": "uuid", "title": "Django for Beginners", "fileUrl": "https://res.cloudinary.com/.../raw/upload/books/file.pdf" }
}
```

---

## 5. Sessions de Lecture

### POST /books/:bookId/sessions — Enregistrer une session

**Headers :** `Authorization: Bearer <accessToken>`

**Request :** `{ "pagesRead": 10, "startPage": 1, "endPage": 10 }`

**Response 201 :**
```json
{
  "success": true,
  "message": "Session logged successfully",
  "data": { "id": "uuid", "pagesRead": 10, "startPage": 1, "endPage": 10, "readAt": "2026-08-26T10:00:00.000Z", "bookId": "uuid" }
}
```

---

### GET /books/:bookId/sessions — Historique des sessions

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": [
    { "id": "uuid", "pagesRead": 10, "startPage": 42, "endPage": 52, "readAt": "2026-08-26T10:00:00.000Z" },
    { "id": "uuid", "pagesRead": 20, "startPage": 22, "endPage": 42, "readAt": "2026-08-25T14:30:00.000Z" }
  ]
}
```

---

### DELETE /sessions/:id — Supprimer une session

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :** `{ "success": true, "message": "Session deleted successfully" }`

---

## 6. Notifications

### GET /notifications — Lister ses notifications

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": [
    { "id": "uuid", "type": "BOOK_ADDED", "title": "Book Added", "message": "You have added \"Django\" to your library.", "isRead": false, "createdAt": "2026-08-26T07:33:37.493Z" },
    { "id": "uuid", "type": "WELCOME", "title": "Welcome to BiblioTrack!", "message": "Hi John, your account has been verified.", "isRead": true, "createdAt": "2026-08-26T07:30:00.000Z" }
  ]
}
```

---

### PATCH /notifications/:id/read — Marquer comme lue

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { "id": "uuid", "type": "BOOK_ADDED", "title": "Book Added", "message": "...", "isRead": true, "createdAt": "..." }
}
```

---

### PATCH /notifications/read-all — Marquer toutes comme lues

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :** `{ "success": true, "message": "All notifications marked as read" }`

---

## 7. Statistiques

### GET /stats/overview — Vue d'ensemble

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "totalBooks": 12,
    "booksFinished": 5,
    "booksInProgress": 3,
    "booksToRead": 4,
    "totalPagesRead": 1250,
    "totalSessions": 45
  }
}
```

---

### GET /stats/progress — Progression dans le temps

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": [
    { "date": "2026-08-20T00:00:00.000Z", "pagesRead": 45 },
    { "date": "2026-08-21T00:00:00.000Z", "pagesRead": 32 },
    { "date": "2026-08-22T00:00:00.000Z", "pagesRead": 58 }
  ]
}
```

---

## 8. WebSocket

### Connexion

```js
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});
```

### Événements reçus

| Événement                  | Quand                          | Payload                                    |
|----------------------------|--------------------------------|--------------------------------------------|
| `notification`             | Nouvelle notification créée    | `{ type, title, message, createdAt }`      |
| `reading-progress-updated` | Progression mise à jour        | `{ bookId, lastReadPage }`                 |

**Exemple frontend :**
```js
socket.on('notification', (data) => {
  toast.success(data.title + ': ' + data.message);
});

socket.on('reading-progress-updated', (data) => {
  updateProgressBar(data.bookId, data.lastReadPage);
});
```

---

## 9. Flow Complet

### Flow Auth
```
1. POST /auth/register       → crée le compte, envoie OTP
2. POST /auth/verify-otp     → vérifie l'email
3. POST /auth/login          → récupère les tokens
4. PATCH /users/me/avatar    → ajoute une photo
```

### Flow Books
```
5. POST /genres              → crée des genres
6. GET /books/external-search?q=django    → cherche un livre
7. POST /books/import-external            → importe automatiquement
8. POST /books/:id/cover                  → ajoute la cover (si pas dispo)
9. POST /books/:id/file                   → ajoute le PDF (si pas auto-téléchargé)
```

### Flow Lecture
```
10. GET /books/:id/read                    → frontend sait comment afficher
11. PATCH /books/:id/progress { "currentPage": 42 }  → met à jour la lecture
12. POST /books/:bookId/sessions           → enregistre une session
```

### Flow Stats et Notifs
```
13. GET /stats/overview                    → vois ses stats
14. GET /notifications                     → vois ses notifs
15. PATCH /notifications/read-all          → marque tout comme lu
```

### Flow Frontend
```
Page d'accueil
  → GET /books?status=IN_PROGRESS     → affiche livres en cours
  → GET /stats/overview               → affiche stats

Page Recherche
  → GET /books/external-search?q=...  → affiche résultats
  → POST /books/import-external       → importe le livre

Page Détail Livre
  → GET /books/:id/read               → obtient URLs de lecture
  → Affiche PDF (fileUrl) ou lecteur Internet Archive (readOnlineUrl)
  → PATCH /books/:id/progress         → met à jour la page lue

WebSocket
  → socket.on('notification')         → affiche notif en temps réel
  → socket.on('reading-progress-updated') → met à jour la barre de progression
```

---

## Swagger

Toutes les routes sont documentées sur :
```
http://localhost:3000/docs
```

## Ordre des tables SQL

TypeORM crée les tables automatiquement (`synchronize: true`) :

1. `users`
2. `genres`
3. `books` (dépend de users + genres)
4. `reading_sessions` (dépend de books)
5. `notifications` (dépend de users)
