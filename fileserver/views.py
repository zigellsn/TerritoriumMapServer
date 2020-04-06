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

import io
import os
import uuid

from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import StreamingHttpResponse, HttpResponse
from django.views import View
from django.views.generic import ListView, FormView

from .forms import UploadFileForm
from .models import MapResult


class DownloaderView(LoginRequiredMixin, View):

    @staticmethod
    def get(request, *args, **kwargs):
        map_result = MapResult.objects.by_guid(kwargs["pk"])
        if map_result is None:
            return HttpResponse(403)
        if map_result.user != request.user:
            return HttpResponse(403)
        url = f"files/{map_result.file}"
        filename = os.path.basename(url)
        bf = io.open(url, "rb")
        response = StreamingHttpResponse(streaming_content=bf)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class FileServerView(LoginRequiredMixin, ListView):
    model = MapResult
    return_403 = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        MapResult.objects.delete_invalid()

    def get_queryset(self):
        return MapResult.objects.by_user(self.request.user)


class UploadView(LoginRequiredMixin, FormView):
    model = MapResult
    template_name = 'fileserver/upload.html'
    form_class = UploadFileForm
    success_url = 'success'

    def form_valid(self, form):
        user = User.objects.get(id=self.request.POST["user"])
        instance = MapResult(guid=uuid.uuid4(), job=self.request.POST["job"], file=self.request.FILES["file"],
                             user=user)
        instance.save()
        return super().form_valid(form)
