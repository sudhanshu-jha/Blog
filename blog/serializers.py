from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "author", "text", "created_date", "approved_comment"]
        read_only_fields = ["id", "created_date", "approved_comment"]


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "text", "author", "author_username",
            "created_date", "published_date", "comment_count",
        ]
        read_only_fields = ["id", "created_date", "author_username", "comment_count"]

    def get_comment_count(self, obj):
        return obj.approve_comments().count()
