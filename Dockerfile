# 1. Base Image: We use the exact Node 22 version you have on your Mac.
FROM node:22-slim

# 2. Prerequisites: Prisma requires OpenSSL to communicate with PostgreSQL securely
RUN apt-get update -y && apt-get install -y openssl

# 3. Set the working directory inside our virtual Linux container
WORKDIR /app

# 4. Copy dependency tracking files first for Docker layer caching
COPY package*.json ./

# 5. Install all standard Node dependencies
RUN npm install --legacy-peer-deps

# 6. Copy the Prisma schema folder into the container
COPY prisma ./prisma

# 7. Generate the Prisma Client specifically for this Linux container's architecture
RUN npx prisma generate

# 8. Copy the rest of the application source code into the container
COPY . .

# 9. Compile the TypeScript into pure JavaScript (Outputs to dist/ directory)
RUN npm run build

# 10. Expose the port our Express server is listening on
EXPOSE 3000

# 11. The command to start our Express API when the container boots up
CMD ["npm", "run", "start:api"]