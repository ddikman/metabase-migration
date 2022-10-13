FROM node:13.12.0-alpine
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y npm
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY metabase-export.js metabase-export.js
COPY metabase-import.js metabase-import.js
COPY metabase/data.json metabase/data.json
RUN chmod 777 metabase-export.js
RUN chmod 777 metabase-import.js
RUN chmod 777 metabase/data.json
RUN npm ci
ENTRYPOINT [ "node" , "metabase-import.js" ]