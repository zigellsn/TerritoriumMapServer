FROM nginx:1.17.10-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
COPY crt.pem /etc/nginx/crt.pem
COPY key.pem /etc/nginx/key.pem
