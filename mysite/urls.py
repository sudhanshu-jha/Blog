from django.urls import re_path, include, path
from django.contrib import admin
from django.contrib.auth import views

urlpatterns = [
    re_path(r"^admin/", admin.site.urls),
    path("api/", include("blog.api_urls")),
    re_path(r"", include("blog.urls")),
    re_path(r"^accounts/login/$", views.LoginView.as_view(), name="login"),
    re_path(r"^accounts/logout/$", views.LogoutView.as_view(next_page="/"), name="logout"),
]
