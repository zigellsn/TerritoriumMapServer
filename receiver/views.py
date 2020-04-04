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
import base64
import binascii
import logging
from urllib.parse import unquote_plus

import pika
from decouple import config
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import View

logger = logging.getLogger("django.request")


@method_decorator(csrf_exempt, name="dispatch")
class ReceiverView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        request_type = request.META.get("HTTP_X_TERRITORIUM")

        if request_type == "map_rendering":
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(config("RABBITMQ_HOST", default="localhost")))
            channel = connection.channel()
            channel.queue_declare(queue="mapnik")
            channel.basic_publish(exchange="",
                                  routing_key="mapnik",
                                  body=request.body)
            connection.close()
            return HttpResponse("success")

        return HttpResponse(status=204)
