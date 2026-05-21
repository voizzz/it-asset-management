-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostname" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "cpu" TEXT,
    "ramMb" INTEGER,
    "diskGb" INTEGER,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'online'
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_hostname_key" ON "Agent"("hostname");
