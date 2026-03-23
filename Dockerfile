FROM node:22.14.0

WORKDIR /home/node

#ENV PORT=4001 UPLOAD_ROOT=/home/node/uploads FILEBEAT_ROOT=/home/node/uploads/filebeat_logs
#ENV API_PORT=4001 APP_PORT=4002 TEST_PORT=4003
#ENV SPA_BASE_URL=http://localhost:$APP_PORT API_BASE_URL=http://localhost:$API_PORT APP_BASE_URL=http://localhost:$APP_PORT DEBUG=achwm:* LOG_FORMAT=dev POSTGRES_DB=achwm POSTGRES_PORT=5432 POSTGRES_HOST=postgres POSTGRES_USER=achwm ENVIRONMENT=development NODE_ENV=development POSTGRES_PASSWORD=changeme CHOKIDAR_USEPOLLING=${CHOKIDAR_USEPOLLING:-false} AUDIT_LOGS_DIR=/home/node/log

# Download dependencies to run puppeteer in Docker to produce PDF reports
RUN apt-get update && \
    apt-get install -y wget gnupg imagemagick librsvg2-dev && \
    wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt install -y /tmp/chrome.deb && \
    rm /tmp/chrome.deb && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

ENV PORT=4001 \
    UPLOAD_ROOT=/home/node/uploads \
    FILEBEAT_ROOT=/home/node/uploads/filebeat_logs \
    AUDIT_LOGS_DIR=/home/node/log \
    NODE_ENV=production
    


# Create the directories based on the ENV variables
# We do this as root before switching to the node user
RUN mkdir -p $UPLOAD_ROOT $FILEBEAT_ROOT $AUDIT_LOGS_DIR && \
    chown -R node:node /home/node

COPY --chown=node:node package.json yarn.lock /home/node/

USER node

# Force install devDeps so TypeScript compiler works
RUN yarn install --production=false

COPY --chown=node:node . /home/node

# Expose the variable
VOLUME $UPLOAD_ROOT
VOLUME $FILEBEAT_ROOT
VOLUME $AUDIT_LOGS_DIR

EXPOSE $PORT

CMD [ "yarn", "run", "start" ]
