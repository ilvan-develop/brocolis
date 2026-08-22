"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { useState } from "react";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);

  function resendLink() {
    setResent(true);
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-lg font-semibold">{t("auth.verify.title")}</h2>
      <p className="text-muted-foreground text-sm">
        {t("auth.verify.description")}
      </p>
      {resent ? (
        <p className="text-sm">{t("auth.verify.resent")}</p>
      ) : (
        <Button onClick={resendLink} variant="outline">
          {t("auth.verify.resend")}
        </Button>
      )}
    </div>
  );
}
