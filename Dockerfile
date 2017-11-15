FROM node:6-alpine

#RUN npm install -g netpie-auth
COPY * /root

CMD ["netpie-auth"]