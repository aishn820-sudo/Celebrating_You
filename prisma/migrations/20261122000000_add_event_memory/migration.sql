-- CreateTable
CREATE TABLE "EventMemory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "caption" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventMemory_eventId_idx" ON "EventMemory"("eventId");

-- CreateIndex
CREATE INDEX "EventMemory_customerId_idx" ON "EventMemory"("customerId");

-- AddForeignKey
ALTER TABLE "EventMemory" ADD CONSTRAINT "EventMemory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMemory" ADD CONSTRAINT "EventMemory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
