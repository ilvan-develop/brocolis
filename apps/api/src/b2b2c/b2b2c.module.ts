import { Module } from "@nestjs/common";
import { B2b2cController } from "./b2b2c.controller.js";
import { B2b2cService } from "./b2b2c.service.js";

@Module({
  controllers: [B2b2cController],
  providers: [B2b2cService],
  exports: [B2b2cService],
})
export class B2b2cModule {}
