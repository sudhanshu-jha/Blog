from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Comment, Post


# ── Model Tests ──────────────────────────────────────────────

class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("author", password="pass")
        self.post = Post.objects.create(author=self.user, title="Hello", text="World")

    def test_str(self):
        self.assertEqual(str(self.post), "Hello")

    def test_publish_sets_published_date(self):
        self.assertIsNone(self.post.published_date)
        self.post.publish()
        self.assertIsNotNone(self.post.published_date)

    def test_publish_is_idempotent(self):
        self.post.publish()
        first_date = self.post.published_date
        self.post.publish()
        self.assertGreaterEqual(self.post.published_date, first_date)

    def test_approve_comments_returns_only_approved(self):
        Comment.objects.create(post=self.post, author="A", text="yes", approved_comment=True)
        Comment.objects.create(post=self.post, author="B", text="no", approved_comment=False)
        self.assertEqual(self.post.approve_comments().count(), 1)

    def test_approve_comments_empty_when_none_approved(self):
        Comment.objects.create(post=self.post, author="A", text="pending")
        self.assertEqual(self.post.approve_comments().count(), 0)

    def test_get_absolute_url(self):
        url = self.post.get_absolute_url()
        self.assertIn(str(self.post.pk), url)


class CommentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("author", password="pass")
        self.post = Post.objects.create(author=self.user, title="Post", text="Text")
        self.comment = Comment.objects.create(post=self.post, author="Reader", text="Nice post")

    def test_str(self):
        self.assertEqual(str(self.comment), "Nice post")

    def test_default_not_approved(self):
        self.assertFalse(self.comment.approved_comment)

    def test_approve_sets_flag(self):
        self.comment.approve()
        self.comment.refresh_from_db()
        self.assertTrue(self.comment.approved_comment)

    def test_get_absolute_url(self):
        url = self.comment.get_absolute_url()
        self.assertIsNotNone(url)


# ── Auth API Tests ────────────────────────────────────────────

class AuthAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("admin", password="secret")
        self.client = APIClient(enforce_csrf_checks=False)

    def test_current_user_unauthenticated(self):
        r = self.client.get("/api/auth/user/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data["is_authenticated"])

    def test_current_user_authenticated(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get("/api/auth/user/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data["is_authenticated"])
        self.assertEqual(r.data["username"], "admin")

    def test_login_valid(self):
        r = self.client.post("/api/auth/login/", {"username": "admin", "password": "secret"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["username"], "admin")
        self.assertTrue(r.data["is_authenticated"])

    def test_login_wrong_password(self):
        r = self.client.post("/api/auth/login/", {"username": "admin", "password": "wrong"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unknown_user(self):
        r = self.client.post("/api/auth/login/", {"username": "nobody", "password": "x"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post("/api/auth/logout/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_logout_requires_auth(self):
        r = self.client.post("/api/auth/logout/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


# ── Post API Tests ────────────────────────────────────────────

class PostAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("author", password="pass")
        self.client = APIClient(enforce_csrf_checks=False)
        self.draft = Post.objects.create(author=self.user, title="Draft Post", text="Draft content")
        self.published = Post.objects.create(
            author=self.user, title="Published Post", text="Live content",
            published_date=timezone.now(),
        )

    # GET /api/posts/
    def test_list_returns_published_only(self):
        r = self.client.get("/api/posts/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in r.data]
        self.assertIn("Published Post", titles)
        self.assertNotIn("Draft Post", titles)

    def test_list_includes_comment_count(self):
        r = self.client.get("/api/posts/")
        self.assertIn("comment_count", r.data[0])

    # GET /api/posts/drafts/
    def test_drafts_requires_auth(self):
        r = self.client.get("/api/posts/drafts/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_drafts_returns_unpublished(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get("/api/posts/drafts/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in r.data]
        self.assertIn("Draft Post", titles)
        self.assertNotIn("Published Post", titles)

    # POST /api/posts/
    def test_create_requires_auth(self):
        r = self.client.post("/api/posts/", {"title": "X", "text": "Y", "author": self.user.pk}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_post(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post("/api/posts/", {"title": "New", "text": "Body", "author": self.user.pk}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["title"], "New")
        self.assertIsNone(r.data["published_date"])

    def test_create_post_missing_title(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post("/api/posts/", {"text": "Body", "author": self.user.pk}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    # GET /api/posts/<pk>/
    def test_get_detail(self):
        r = self.client.get(f"/api/posts/{self.published.pk}/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["title"], "Published Post")

    def test_get_draft_visible_to_all(self):
        r = self.client.get(f"/api/posts/{self.draft.pk}/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_get_nonexistent(self):
        r = self.client.get("/api/posts/9999/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # PUT /api/posts/<pk>/
    def test_update_requires_auth(self):
        r = self.client.put(f"/api/posts/{self.draft.pk}/", {"title": "X", "text": "Y", "author": self.user.pk}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_post(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.put(f"/api/posts/{self.draft.pk}/", {"title": "Updated", "text": "New body", "author": self.user.pk}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["title"], "Updated")

    # POST /api/posts/<pk>/publish/
    def test_publish_requires_auth(self):
        r = self.client.post(f"/api/posts/{self.draft.pk}/publish/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_publish_sets_date(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post(f"/api/posts/{self.draft.pk}/publish/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(r.data["published_date"])

    def test_publish_nonexistent(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post("/api/posts/9999/publish/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # DELETE /api/posts/<pk>/
    def test_delete_requires_auth(self):
        r = self.client.delete(f"/api/posts/{self.draft.pk}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_post(self):
        self.client.force_authenticate(user=self.user)
        pk = self.draft.pk
        r = self.client.delete(f"/api/posts/{pk}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=pk).exists())

    def test_delete_nonexistent(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.delete("/api/posts/9999/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


# ── Comment API Tests ─────────────────────────────────────────

class CommentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("author", password="pass")
        self.client = APIClient(enforce_csrf_checks=False)
        self.post = Post.objects.create(
            author=self.user, title="Post", text="Text",
            published_date=timezone.now(),
        )
        self.pending = Comment.objects.create(post=self.post, author="Anon", text="Pending")
        self.approved = Comment.objects.create(post=self.post, author="Bob", text="Approved", approved_comment=True)

    # POST /api/posts/<pk>/comments/
    def test_add_comment(self):
        r = self.client.post(f"/api/posts/{self.post.pk}/comments/", {"author": "X", "text": "Hello"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["author"], "X")
        self.assertFalse(r.data["approved_comment"])

    def test_add_comment_missing_author(self):
        r = self.client.post(f"/api/posts/{self.post.pk}/comments/", {"text": "Hello"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_comment_to_nonexistent_post(self):
        r = self.client.post("/api/posts/9999/comments/", {"author": "X", "text": "Hi"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # GET /api/posts/<pk>/comments/
    def test_list_unauthenticated_sees_approved_only(self):
        r = self.client.get(f"/api/posts/{self.post.pk}/comments/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        authors = [c["author"] for c in r.data]
        self.assertIn("Bob", authors)
        self.assertNotIn("Anon", authors)

    def test_list_authenticated_sees_all(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get(f"/api/posts/{self.post.pk}/comments/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        authors = [c["author"] for c in r.data]
        self.assertIn("Anon", authors)
        self.assertIn("Bob", authors)

    def test_list_nonexistent_post(self):
        r = self.client.get("/api/posts/9999/comments/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # POST /api/comments/<pk>/approve/
    def test_approve_requires_auth(self):
        r = self.client.post(f"/api/comments/{self.pending.pk}/approve/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_comment(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post(f"/api/comments/{self.pending.pk}/approve/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data["approved_comment"])
        self.pending.refresh_from_db()
        self.assertTrue(self.pending.approved_comment)

    def test_approve_nonexistent_comment(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post("/api/comments/9999/approve/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # DELETE /api/comments/<pk>/
    def test_delete_requires_auth(self):
        r = self.client.delete(f"/api/comments/{self.approved.pk}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_comment(self):
        self.client.force_authenticate(user=self.user)
        pk = self.approved.pk
        r = self.client.delete(f"/api/comments/{pk}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_comment(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.delete("/api/comments/9999/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
