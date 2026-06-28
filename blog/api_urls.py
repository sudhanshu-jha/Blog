from django.urls import path
from . import api_views

urlpatterns = [
    path("auth/user/", api_views.current_user),
    path("auth/login/", api_views.login_view),
    path("auth/logout/", api_views.logout_view),
    path("posts/", api_views.post_list),
    path("posts/drafts/", api_views.draft_list),
    path("posts/<int:pk>/", api_views.post_detail),
    path("posts/<int:pk>/publish/", api_views.post_publish),
    path("posts/<int:pk>/comments/", api_views.comment_list),
    path("comments/<int:pk>/approve/", api_views.comment_approve),
    path("comments/<int:pk>/", api_views.comment_delete),
]
