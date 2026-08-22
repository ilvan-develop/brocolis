import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import type { PrescriptionService } from "./prescription.service.js";

type RespondBody = {
  organizationId: string;
  marketCode: string;
  action: string;
  notes?: string;
};

@Controller("prescriptions")
export class PrescriptionController {
  constructor(private readonly prescriptions: PrescriptionService) {}

  @Post("upload")
  upload(@Body() body: unknown) {
    return this.prescriptions.upload(body);
  }

  @Post(":prescriptionId/respond")
  respond(
    @Param("prescriptionId") prescriptionId: string,
    @Headers("x-pharmacist-id") pharmacistId: string,
    @Body() body: RespondBody,
  ) {
    return this.prescriptions.respond(
      { ...body, prescriptionId },
      pharmacistId,
    );
  }
}
