import { Module } from "@nestjs/common";
import { ComplianceController } from "./compliance.controller.js";
import { ComplianceService } from "./compliance.service.js";
import { SaftExportService } from "./saft-export.service.js";

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, SaftExportService],
  exports: [ComplianceService, SaftExportService],
})
export class ComplianceModule {}
