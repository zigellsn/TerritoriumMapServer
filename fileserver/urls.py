#  Copyright 2019-2020 Simon Zigelli
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from django.urls import path
from django.views.generic import TemplateView

from .views import FileListView, DownloaderView, UploadView, JobDetailView

app_name = 'fileserver'

urlpatterns = [
    path('list/', FileListView.as_view(), name='filelist'),
    path('job/<str:pk>', JobDetailView.as_view(), name='jobdetail'),
    path('upload/', UploadView.as_view(), name='upload'),
    path('upload/success/', TemplateView.as_view(template_name='fileserver/success.html')),
    path('dl/<str:pk>', DownloaderView.as_view(), name='download'),
]
