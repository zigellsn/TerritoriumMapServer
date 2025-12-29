#!/usr/bin/env sh

AMQP_PROTOCOL=${RABBITMQ_URL%%:*}
TEMP=${RABBITMQ_URL##*@}
HOST_PORT_RABBITMQ=${TEMP%%/*}
ENV_RABBITMQ_HOST=${HOST_PORT_RABBITMQ%:*}
ENV_RABBITMQ_PORT=${HOST_PORT_RABBITMQ#*:}

if [ "${AMQP_PROTOCOL}" = "amqp" ]; then
  RABBITMQ_HOST="${ENV_RABBITMQ_HOST:-mq}"
  RABBITMQ_PORT="${ENV_RABBITMQ_PORT:-5672}"
fi

echo "Waiting for postgres..."

while ! nc -z "${PGHOST}" "${PGPORT}"; do
  sleep 0.1
done

echo "PostgreSQL started"

echo "Waiting for RabbitMQ..."

while ! nc -z "${RABBITMQ_HOST}" "${RABBITMQ_PORT}"; do
  sleep 0.1
done

echo "RabbitMQ started"

exec "$@"
