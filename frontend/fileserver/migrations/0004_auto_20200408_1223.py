# Generated by Django 3.0.5 on 2020-04-08 10:23

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('fileserver', '0003_auto_20200406_1841'),
    ]

    operations = [
        migrations.RenameField(
            model_name='mapresult',
            old_name='send_time',
            new_name='result_time',
        ),
        migrations.RemoveField(
            model_name='mapresult',
            name='user',
        ),
        migrations.CreateModel(
            name='RenderJob',
            fields=[
                ('guid', models.CharField(max_length=36, primary_key=True, serialize=False, verbose_name='GUID')),
                ('send_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('finish_time', models.DateTimeField()),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterField(
            model_name='mapresult',
            name='job',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='fileserver.RenderJob'),
        ),
    ]