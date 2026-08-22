import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module.js";
import { PrescriptionDigitalController } from "./prescription-digital.controller.js";
import { PrescriptionDigitalService } from "./prescription-digital.service.js";

@Module({
  imports: [ComplianceModule],
  controllers: [PrescriptionDigitalController],
  providers: [PrescriptionDigitalService],
  exports: [PrescriptionDigitalService],
})
export class PrescriptionDigitalModule {}
