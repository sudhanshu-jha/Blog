from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer


# ── Auth ────────────────────────────────────────────────────

@api_view(["GET"])
def current_user(request):
    if request.user.is_authenticated:
        return Response({"username": request.user.username, "is_authenticated": True})
    return Response({"is_authenticated": False})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return Response({"username": user.username, "is_authenticated": True})
    return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out"})


# ── Posts ────────────────────────────────────────────────────

@api_view(["GET", "POST"])
def post_list(request):
    if request.method == "GET":
        posts = Post.objects.filter(published_date__lte=timezone.now()).order_by("-published_date")
        return Response(PostSerializer(posts, many=True).data)

    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def draft_list(request):
    posts = Post.objects.filter(published_date__isnull=True).order_by("created_date")
    return Response(PostSerializer(posts, many=True).data)


@api_view(["GET", "PUT", "DELETE"])
def post_detail(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(PostSerializer(post).data)

    if not request.user.is_authenticated:
        return Response(status=status.HTTP_403_FORBIDDEN)

    if request.method == "PUT":
        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    post.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def post_publish(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    post.publish()
    return Response(PostSerializer(post).data)


# ── Comments ─────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def comment_list(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        if request.user.is_authenticated:
            comments = post.comments.all()
        else:
            comments = post.comments.filter(approved_comment=True)
        return Response(CommentSerializer(comments, many=True).data)

    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(post=post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def comment_approve(request, pk):
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    comment.approve()
    return Response(CommentSerializer(comment).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def comment_delete(request, pk):
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    comment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
