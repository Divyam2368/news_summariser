-- AlterTable
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "Article" ADD COLUMN     "embedding" vector(1024);
