import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type { PrescriptionDigitalService } from "./prescription-digital.service.js";

type ScopeQuery = Record<string, string | undefined>;

@Controller("prescription-digital")
export class PrescriptionDigitalController {
  constructor(private readonly rxdigital: PrescriptionDigitalService) {}

  @Post("professionals")
  registerProfessional(@Body() body: unknown) {
    return this.rxdigital.registerProfessional(body);
  }

  @Post("professionals/:professionalId/verification")
  setVerification(
    @Param("professionalId") professionalId: string,
    @Body() body: unknown,
  ) {
    return this.rxdigital.setVerification({
      ...(body as Record<string, unknown>),
      professionalId,
    });
  }

  @Get("professionals/:professionalId")
  getProfessional(
    @Param("professionalId") professionalId: string,
    @Query() query: ScopeQuery,
  ) {
    return this.rxdigital.getProfessional(
      query.organizationId ?? "",
      query.marketCode ?? "",
      professionalId,
    );
  }

  @Post()
  issue(@Body() body: unknown) {
    return this.rxdigital.issue(body);
  }

  @Get(":prescriptionId")
  getPrescription(
    @Param("prescriptionId") prescriptionId: string,
    @Query() query: ScopeQuery,
  ) {
    return this.rxdigital.getPrescription(
      query.organizationId ?? "",
      query.marketCode ?? "",
      prescriptionId,
    );
  }

  @Post(":prescriptionId/validate")
  validate(
    @Param("prescriptionId") prescriptionId: string,
    @Body() body: unknown,
  ) {
    return this.rxdigital.validate({
      ...(body as Record<string, unknown>),
      prescriptionId,
    });
  }

  @Post(":prescriptionId/dispense")
  dispense(
    @Param("prescriptionId") prescriptionId: string,
    @Headers("x-pharmacist-id") pharmacistId: string,
    @Body() body: unknown,
  ) {
    return this.rxdigital.dispense(
      { ...(body as Record<string, unknown>), prescriptionId },
      pharmacistId,
    );
  }

  @Post(":prescriptionId/revoke")
  revoke(
    @Param("prescriptionId") prescriptionId: string,
    @Body() body: unknown,
  ) {
    return this.rxdigital.revoke({
      ...(body as Record<string, unknown>),
      prescriptionId,
    });
  }

  @Post(":prescriptionId/renew")
  renew(
    @Param("prescriptionId") prescriptionId: string,
    @Body() body: unknown,
  ) {
    return this.rxdigital.renew({
      ...(body as Record<string, unknown>),
      prescriptionId,
    });
  }
}
