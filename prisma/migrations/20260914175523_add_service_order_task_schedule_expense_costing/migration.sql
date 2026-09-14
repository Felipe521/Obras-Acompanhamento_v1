-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "quantity" DECIMAL(10,2),
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "unitValue" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "expenses_serviceId_idx" ON "expenses"("serviceId");

-- CreateIndex
CREATE INDEX "services_order_idx" ON "services"("order");

-- CreateIndex
CREATE INDEX "tasks_serviceId_idx" ON "tasks"("serviceId");

-- CreateIndex
CREATE INDEX "tasks_stageId_idx" ON "tasks"("stageId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
