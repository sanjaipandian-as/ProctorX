FROM node:18-bullseye

# Install compilers and runtimes
RUN apt-get update && apt-get install -y \
    python3 \
    openjdk-17-jdk \
    g++ \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Create tmp directory and set permissions
RUN mkdir -p /tmp/proctorx && chmod 777 /tmp/proctorx

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
# Force direct execution mode for Render
ENV EXECUTION_MODE=direct
ENV TMP_ROOT=/tmp/proctorx

EXPOSE 4000

CMD [ "npm", "start" ]
