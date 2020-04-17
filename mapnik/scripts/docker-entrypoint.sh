#!/usr/bin/env sh

echo "Waiting for postgres..."

while ! nc -z "${PGHOST}" "${PGPORT}"; do
  sleep 0.1
done

echo "PostgreSQL started"

echo "Waiting for RabbitMQ..."

while ! nc -z "${RABBITMQ_HOST}" 5672; do
  sleep 0.1
done

echo "RabbitMQ started"

exec "$@"
