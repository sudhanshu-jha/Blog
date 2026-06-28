# My Tech Blog

A full-stack blog application with a **Django REST API** backend and a **React** frontend.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Django 6.0, Django REST Framework |
| Frontend | React 19, Vite 8 |
| Database | SQLite (dev) |
| Fonts | Inter + Playfair Display |

## Features

- Create, edit, publish, and delete posts
- Comment system with admin approval workflow
- Draft management
- Session-based authentication
- Clean editorial UI (dark navbar, serif headings, card layout)

## Getting started

### Backend (Django)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Runs on **http://127.0.0.1:8000**

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** — proxies `/api` requests to Django automatically.

## Testing

### Backend

```bash
python manage.py test blog
```

47 tests covering models, auth, posts, and comments API.

### Frontend

```bash
cd frontend
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

25 tests covering the fetch wrapper (CSRF handling, error paths) and key components (Login, PostList).

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/user/` | — | Current user / session state |
| POST | `/api/auth/login/` | — | Login |
| POST | `/api/auth/logout/` | ✓ | Logout |
| GET | `/api/posts/` | — | Published posts |
| POST | `/api/posts/` | ✓ | Create post |
| GET | `/api/posts/drafts/` | ✓ | Unpublished drafts |
| GET | `/api/posts/<id>/` | — | Post detail |
| PUT | `/api/posts/<id>/` | ✓ | Update post |
| DELETE | `/api/posts/<id>/` | ✓ | Delete post |
| POST | `/api/posts/<id>/publish/` | ✓ | Publish post |
| GET | `/api/posts/<id>/comments/` | — | List comments |
| POST | `/api/posts/<id>/comments/` | — | Add comment |
| POST | `/api/comments/<id>/approve/` | ✓ | Approve comment |
| DELETE | `/api/comments/<id>/` | ✓ | Delete comment |

## Project structure

```
Blog/
├── blog/               # Django app
│   ├── models.py       # Post, Comment models
│   ├── serializers.py  # DRF serializers
│   ├── api_views.py    # REST API views
│   ├── api_urls.py     # API URL routes
│   ├── tests.py        # Django test suite (47 tests)
│   └── views.py        # Legacy Django template views
├── mysite/             # Django project config
├── frontend/           # React app (Vite)
│   └── src/
│       ├── __tests__/  # Vitest test suite (25 tests)
│       ├── pages/      # PostList, PostDetail, PostForm, ...
│       ├── components/ # Navbar
│       ├── AuthContext.jsx
│       └── api.js      # Fetch wrapper with CSRF handling
└── requirements.txt
```
