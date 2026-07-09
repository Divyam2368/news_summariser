# 1. Base Image: We use the exact Node 22 version you have on your Mac.
# The 'slim' version is a smaller download but has everything we need.
FROM node:22-slim

# 2. Prerequisites: Prisma requires OpenSSL to communicate with PostgreSQL securely
RUN apt-get update -y && apt-get install -y openssl

# 3. Set the working directory inside our virtual Linux container
WORKDIR /app

# 4. Copy dependency tracking files first
# (Doing this first caches the install step so rebuilds are much faster)
COPY package*.json ./

# 5. Install all standard Node dependencies using legacy peer deps to bypass LangChain conflicts
RUN npm install --legacy-peer-deps

# 6. Copy the Prisma schema folder into the container
COPY prisma ./prisma

# 7. Generate the Prisma Client specifically for this Linux container's architecture
RUN npx prisma generate

# 8. Copy the rest of the application source code into the container
COPY . .

# 9. Expose the port our Express server is listening on
EXPOSE 3000

# 10. The command to start our pipeline when the container boots up
CMD ["npx", "ts-node", "src/index.ts"]


