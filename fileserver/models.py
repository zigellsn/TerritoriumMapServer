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

import os
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class MapResultQuerySet(QuerySet):
    def by_user(self, user):
        return self.filter(user=user)

    def by_guid(self, guid):
        return self.get(guid=guid)

    def invalid(self):
        date = timezone.now() - timedelta(days=7)
        return self.filter(send_time__lt=date)


class MapResultManager(models.Manager):

    def get_query_set(self):
        return MapResultQuerySet(self.model, using=self._db)

    def create_map_result(self, job, user, file, file_name):
        return self.create(job=job, user=user, file=file, file_name=file_name)

    def delete_invalid(self):
        return self.get_query_set().invalid().delete()

    def by_user(self, user):
        map_results = self.get_query_set().by_user(user)
        for map_result in map_results:
            map_result.filename = os.path.basename(map_result.file.name)
        return map_results

    def by_guid(self, guid):
        return self.get_query_set().by_guid(guid)


class MapResult(models.Model):
    guid = models.CharField(_('GUID'), primary_key=True, max_length=36)
    job = models.CharField(_('Job'), max_length=150)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='maps')
    send_time = models.DateTimeField(default=timezone.now)

    objects = MapResultManager()
