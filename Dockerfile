# --- Stage 1: Build Stage ---
FROM node:22.14.0 AS builder

WORKDIR /home/node

# Copy package files
COPY package.json yarn.lock ./

# Install ALL dependencies (including devDependencies like typescript and shx)
RUN yarn install

# Copy the rest of the source code
COPY . .

# Compile the TypeScript code to the /lib folder
RUN yarn run compile --project tsconfig.build.json


# --- Stage 2: Production Stage ---
FROM node:22.14.0-slim

# Set environment to production
ENV NODE_ENV=production
WORKDIR /home/node

# Copy ONLY the package files first
COPY package.json yarn.lock ./

# Install ONLY production dependencies (ignores devDependencies)
# This keeps the image tiny
RUN yarn install --production

# Copy the compiled /lib folder from the builder stage
COPY --from=builder /home/node/lib ./lib
# Copy config files (FeathersJS needs these at runtime)
COPY --from=builder /home/node/config ./config

# If you have migrations or other assets needed at runtime, copy them here:
# COPY --from=builder /home/node/src/migrations ./src/migrations

# Ensure the 'node' user owns the files
RUN chown -R node:node /home/node
USER node

# Expose your app port
EXPOSE 4001

# Start the app directly from the compiled JS
# We don't use "yarn start" here because we already compiled in the builder stage
CMD [ "node", "lib/index.js" ]
